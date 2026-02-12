const express = require('express');
const slugify = require('slugify');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../lib/auth');

function makeSlug(value) {
  return slugify(String(value || ''), { lower: true, strict: true, trim: true });
}

async function uniqueSlug(table, base, excludeId = null) {
  const original = makeSlug(base);
  let candidate = original || `item-${Date.now()}`;
  let count = 1;

  while (true) {
    const params = [candidate];
    let q = `SELECT id FROM ${table} WHERE slug = $1`;
    if (excludeId) {
      q += ' AND id != $2';
      params.push(excludeId);
    }
    const { rows } = await db.query(q, params);
    if (rows.length === 0) return candidate;
    count += 1;
    candidate = `${original}-${count}`;
  }
}

// ---------- Public ----------

router.get('/categories/tree', async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT c.id, c.name, c.slug, c.parent_id, c.sort_order, c.is_active,
             p.name AS parent_name, p.slug AS parent_slug
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.is_active = TRUE
      ORDER BY COALESCE(p.sort_order, c.sort_order), COALESCE(p.name, c.name), c.sort_order, c.name
      `
    );

    const parents = rows.filter((r) => !r.parent_id);
    const children = rows.filter((r) => !!r.parent_id);
    const byParent = new Map();
    for (const child of children) {
      if (!byParent.has(child.parent_id)) byParent.set(child.parent_id, []);
      byParent.get(child.parent_id).push({
        id: child.id,
        name: child.name,
        slug: child.slug,
        sort_order: child.sort_order,
      });
    }

    const tree = parents.map((parent) => ({
      id: parent.id,
      name: parent.name,
      slug: parent.slug,
      sort_order: parent.sort_order,
      children: (byParent.get(parent.id) || []).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    }));

    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch category tree.' });
  }
});

router.get('/vendors', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, slug, logo_url, is_active FROM vendors WHERE is_active = TRUE ORDER BY name ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendors.' });
  }
});

// ---------- Admin Categories ----------

router.get('/admin/categories', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT c.id, c.name, c.slug, c.parent_id, c.sort_order, c.is_active,
             p.name AS parent_name, p.slug AS parent_slug
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      ORDER BY COALESCE(p.sort_order, c.sort_order), COALESCE(p.name, c.name), c.sort_order, c.name
      `
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

router.post('/admin/categories', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, parentId = null, sort_order = 0, is_active = true } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required.' });

    if (parentId) {
      const parent = await db.query('SELECT id FROM categories WHERE id = $1', [parentId]);
      if (parent.rows.length === 0) return res.status(400).json({ error: 'Parent category not found.' });
    }

    const slug = await uniqueSlug('categories', name);
    const { rows } = await db.query(
      `
      INSERT INTO categories (name, slug, parent_id, sort_order, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [name, slug, parentId, sort_order, is_active]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category.' });
  }
});

router.put('/admin/categories/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Category not found.' });

    const current = existing.rows[0];
    const name = req.body.name ?? current.name;
    const parentId = req.body.parentId !== undefined ? req.body.parentId : current.parent_id;
    const sortOrder = req.body.sort_order !== undefined ? req.body.sort_order : current.sort_order;
    const isActive = req.body.is_active !== undefined ? req.body.is_active : current.is_active;

    if (parentId && parentId === id) return res.status(400).json({ error: 'Category cannot be its own parent.' });
    if (parentId) {
      const parent = await db.query('SELECT id FROM categories WHERE id = $1', [parentId]);
      if (parent.rows.length === 0) return res.status(400).json({ error: 'Parent category not found.' });
    }

    let slug = current.slug;
    if (name !== current.name) slug = await uniqueSlug('categories', name, id);

    const { rows } = await db.query(
      `
      UPDATE categories
      SET name = $1, slug = $2, parent_id = $3, sort_order = $4, is_active = $5
      WHERE id = $6
      RETURNING *
      `,
      [name, slug, parentId, sortOrder, isActive, id]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category.' });
  }
});

router.delete('/admin/categories/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const usage = await db.query('SELECT COUNT(*)::int AS count FROM products WHERE category_id = $1', [id]);
    if (usage.rows[0].count > 0) {
      return res.status(400).json({ error: 'Category has products. Deactivate it instead of deleting.' });
    }
    const childUsage = await db.query('SELECT COUNT(*)::int AS count FROM categories WHERE parent_id = $1', [id]);
    if (childUsage.rows[0].count > 0) {
      return res.status(400).json({ error: 'Category has child categories. Delete children first.' });
    }
    await db.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

// ---------- Admin Vendors ----------

router.get('/admin/vendors', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, slug, logo_url, is_active, created_at FROM vendors ORDER BY name ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendors.' });
  }
});

router.post('/admin/vendors', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, logo_url = null, is_active = true } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required.' });
    const slug = await uniqueSlug('vendors', name);
    const { rows } = await db.query(
      `INSERT INTO vendors (name, slug, logo_url, is_active) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, slug, logo_url, is_active]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create vendor.' });
  }
});

router.put('/admin/vendors/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.query('SELECT * FROM vendors WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Vendor not found.' });
    const current = existing.rows[0];
    const name = req.body.name ?? current.name;
    const logoUrl = req.body.logo_url !== undefined ? req.body.logo_url : current.logo_url;
    const isActive = req.body.is_active !== undefined ? req.body.is_active : current.is_active;
    let slug = current.slug;
    if (name !== current.name) slug = await uniqueSlug('vendors', name, id);

    const { rows } = await db.query(
      `UPDATE vendors SET name = $1, slug = $2, logo_url = $3, is_active = $4 WHERE id = $5 RETURNING *`,
      [name, slug, logoUrl, isActive, id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update vendor.' });
  }
});

router.delete('/admin/vendors/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const usage = await db.query('SELECT COUNT(*)::int AS count FROM products WHERE vendor_id = $1', [id]);
    if (usage.rows[0].count > 0) {
      return res.status(400).json({ error: 'Vendor has products. Deactivate it instead of deleting.' });
    }
    await db.query('DELETE FROM vendors WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete vendor.' });
  }
});

module.exports = router;

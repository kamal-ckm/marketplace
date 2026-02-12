const express = require('express');
const router = express.Router();
const db = require('../db');
const slugify = require('slugify');
const { requireAuth, requireAdmin } = require('../lib/auth');

async function generateUniqueSlug(name, excludeId = null) {
    let slug = slugify(name, { lower: true, strict: true, trim: true });
    let originalSlug = slug;
    let counter = 1;

    while (true) {
        let query = 'SELECT id FROM products WHERE slug = $1';
        const params = [slug];

        if (excludeId) {
            query += ' AND id != $2';
            params.push(excludeId);
        }

        const result = await db.query(query, params);
        if (result.rows.length === 0) break;

        counter++;
        slug = `${originalSlug}-${counter}`;
    }

    return slug;
}

async function getFallbackCategoryId() {
    const { rows } = await db.query(`SELECT id FROM categories WHERE slug = 'uncategorized' LIMIT 1`);
    return rows[0]?.id || null;
}

async function getFallbackVendorId() {
    const { rows } = await db.query(`SELECT id FROM vendors WHERE slug = 'unbranded' LIMIT 1`);
    return rows[0]?.id || null;
}

async function resolveCategory(categoryId, legacyCategoryName = null) {
    if (categoryId) {
        const { rows } = await db.query(
            `
            SELECT c.id, c.name
            FROM categories c
            WHERE c.id = $1 AND c.parent_id IS NOT NULL
            `,
            [categoryId]
        );
        if (rows.length > 0) return rows[0];
    }

    if (legacyCategoryName) {
        const { rows } = await db.query(
            `
            SELECT c.id, c.name
            FROM categories c
            WHERE c.parent_id IS NOT NULL AND LOWER(TRIM(c.name)) = LOWER(TRIM($1))
            `,
            [legacyCategoryName]
        );
        if (rows.length > 0) return rows[0];
    }

    const fallbackId = await getFallbackCategoryId();
    if (!fallbackId) return null;

    const { rows } = await db.query(`SELECT id, name FROM categories WHERE id = $1`, [fallbackId]);
    return rows[0] || null;
}

async function resolveVendor(vendorId) {
    if (vendorId) {
        const { rows } = await db.query(`SELECT id, name FROM vendors WHERE id = $1`, [vendorId]);
        if (rows.length > 0) return rows[0];
    }

    const fallbackId = await getFallbackVendorId();
    if (!fallbackId) return null;

    const { rows } = await db.query(`SELECT id, name FROM vendors WHERE id = $1`, [fallbackId]);
    return rows[0] || null;
}

function normalizeProductCard(row) {
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        price: row.price,
        mrp: row.mrp,
        images: row.images,
        category: row.category,
        wallet_eligible: row.wallet_eligible,
        rewards_eligible: row.rewards_eligible,
        stock_quantity: row.stock_quantity,
        vendor: row.vendor_id_meta
            ? {
                  id: row.vendor_id_meta,
                  name: row.vendor_name,
                  slug: row.vendor_slug,
                  logo_url: row.vendor_logo_url,
              }
            : null,
        category_meta: row.category_id_meta
            ? {
                  id: row.category_id_meta,
                  name: row.category_name,
                  slug: row.category_slug,
                  parentName: row.parent_category_name,
                  parentSlug: row.parent_category_slug,
              }
            : null,
    };
}

// 1. Create Product
router.post('/products', requireAuth, requireAdmin, async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            mrp,
            stock_quantity,
            images,
            category,
            categoryId,
            vendorId,
            slug: providedSlug,
            wallet_eligible = true,
            rewards_eligible = true,
            flex_collection_id = null,
        } = req.body;

        if (!name || price === undefined || mrp === undefined) {
            return res.status(400).json({ error: 'Name, Price, and MRP are required.' });
        }
        if (stock_quantity < 0) {
            return res.status(400).json({ error: 'Stock quantity must be non-negative.' });
        }

        const resolvedCategory = await resolveCategory(categoryId, category);
        if (!resolvedCategory) {
            return res.status(400).json({ error: 'No valid child category available. Run migrations first.' });
        }

        const resolvedVendor = await resolveVendor(vendorId);
        if (!resolvedVendor) {
            return res.status(400).json({ error: 'No valid vendor available. Run migrations first.' });
        }

        const finalSlug = providedSlug ? await generateUniqueSlug(providedSlug) : await generateUniqueSlug(name);
        const status = 'DRAFT';
        const imageArray = Array.isArray(images) ? images : [];

        const query = `
      INSERT INTO products (
        name, slug, description, price, mrp, stock_quantity, images, category, category_id, vendor_id, status,
        wallet_eligible, rewards_eligible, flex_collection_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;

        const values = [
            name,
            finalSlug,
            description,
            price,
            mrp,
            stock_quantity || 0,
            imageArray,
            resolvedCategory.name,
            resolvedCategory.id,
            resolvedVendor.id,
            status,
            wallet_eligible,
            rewards_eligible,
            flex_collection_id,
        ];

        const { rows } = await db.query(query, values);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// 2. Update Product
router.put('/products/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            price,
            mrp,
            stock_quantity,
            images,
            category,
            categoryId,
            vendorId,
            status,
            slug,
            wallet_eligible,
            rewards_eligible,
            flex_collection_id,
        } = req.body;

        const checkProduct = await db.query('SELECT * FROM products WHERE id = $1', [id]);
        if (checkProduct.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const currentProduct = checkProduct.rows[0];

        let finalSlug = currentProduct.slug;
        if (slug && slug !== currentProduct.slug) {
            finalSlug = await generateUniqueSlug(slug, id);
        }

        const resolvedCategory = await resolveCategory(categoryId || currentProduct.category_id, category || currentProduct.category);
        const resolvedVendor = await resolveVendor(vendorId || currentProduct.vendor_id);

        const query = `
      UPDATE products
      SET name = $1,
          slug = $2,
          description = $3,
          price = $4,
          mrp = $5,
          stock_quantity = $6,
          images = $7,
          category = $8,
          category_id = $9,
          vendor_id = $10,
          status = $11,
          wallet_eligible = $12,
          rewards_eligible = $13,
          flex_collection_id = $14
      WHERE id = $15
      RETURNING *;
    `;

        const values = [
            name || currentProduct.name,
            finalSlug,
            description !== undefined ? description : currentProduct.description,
            price !== undefined ? price : currentProduct.price,
            mrp !== undefined ? mrp : currentProduct.mrp,
            stock_quantity !== undefined ? stock_quantity : currentProduct.stock_quantity,
            images || currentProduct.images,
            resolvedCategory?.name || currentProduct.category,
            resolvedCategory?.id || currentProduct.category_id,
            resolvedVendor?.id || currentProduct.vendor_id,
            status || currentProduct.status,
            wallet_eligible !== undefined ? wallet_eligible : currentProduct.wallet_eligible,
            rewards_eligible !== undefined ? rewards_eligible : currentProduct.rewards_eligible,
            flex_collection_id !== undefined ? flex_collection_id : currentProduct.flex_collection_id,
            id,
        ];

        const { rows } = await db.query(query, values);
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// 3. Admin product list
router.get('/admin/products', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { rows } = await db.query(
            `
            SELECT p.*, c.name AS category_name, c.slug AS category_slug,
                   pc.name AS parent_category_name,
                   v.id AS vendor_id_meta, v.name AS vendor_name, v.slug AS vendor_slug, v.logo_url AS vendor_logo_url
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN categories pc ON c.parent_id = pc.id
            LEFT JOIN vendors v ON p.vendor_id = v.id
            ORDER BY p.created_at DESC
            `
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// A-2.1: Get Single Admin Product
router.get('/admin/products/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await db.query(
            `
            SELECT p.*, c.name AS category_name, c.slug AS category_slug, c.parent_id AS parent_category_id,
                   pc.name AS parent_category_name, pc.slug AS parent_category_slug,
                   v.id AS vendor_id_meta, v.name AS vendor_name, v.slug AS vendor_slug, v.logo_url AS vendor_logo_url
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN categories pc ON c.parent_id = pc.id
            LEFT JOIN vendors v ON p.vendor_id = v.id
            WHERE p.id = $1
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// 4. List Published Products
router.get('/products', async (req, res) => {
    try {
        const { category, categorySlug, vendorSlug, q, sort = 'featured', inStock = 'true' } = req.query;

        let query = `
            SELECT p.*, c.id AS category_id_meta, c.name AS category_name, c.slug AS category_slug,
                   pc.name AS parent_category_name, pc.slug AS parent_category_slug,
                   v.id AS vendor_id_meta, v.name AS vendor_name, v.slug AS vendor_slug, v.logo_url AS vendor_logo_url
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN categories pc ON c.parent_id = pc.id
            LEFT JOIN vendors v ON p.vendor_id = v.id
            WHERE p.status = 'PUBLISHED'
        `;
        const params = [];
        let paramIndex = 1;

        if (inStock !== 'false') {
            query += ` AND p.stock_quantity > 0`;
        }

        if (category) {
            query += ` AND p.category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        if (categorySlug) {
            query += ` AND (c.slug = $${paramIndex} OR pc.slug = $${paramIndex})`;
            params.push(categorySlug);
            paramIndex++;
        }

        if (vendorSlug) {
            query += ` AND v.slug = $${paramIndex}`;
            params.push(vendorSlug);
            paramIndex++;
        }

        if (q) {
            query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
            params.push(`%${q}%`);
            paramIndex++;
        }

        if (sort === 'price-asc') {
            query += ' ORDER BY p.price ASC';
        } else if (sort === 'price-desc') {
            query += ' ORDER BY p.price DESC';
        } else {
            query += ' ORDER BY p.created_at DESC';
        }

        const { rows } = await db.query(query, params);
        res.json(rows.map(normalizeProductCard));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// 5. Product Detail + related-by-vendor
router.get('/products/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const { rows } = await db.query(
            `
            SELECT p.*, c.id AS category_id_meta, c.name AS category_name, c.slug AS category_slug,
                   pc.name AS parent_category_name, pc.slug AS parent_category_slug,
                   v.id AS vendor_id_meta, v.name AS vendor_name, v.slug AS vendor_slug, v.logo_url AS vendor_logo_url
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN categories pc ON c.parent_id = pc.id
            LEFT JOIN vendors v ON p.vendor_id = v.id
            WHERE p.slug = $1 AND p.status = 'PUBLISHED'
            LIMIT 1
            `,
            [slug]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = rows[0];
        let relatedByVendor = [];

        if (product.vendor_id && product.vendor_slug !== 'unbranded') {
            const related = await db.query(
                `
                SELECT p.*, c.id AS category_id_meta, c.name AS category_name, c.slug AS category_slug,
                       pc.name AS parent_category_name, pc.slug AS parent_category_slug,
                       v.id AS vendor_id_meta, v.name AS vendor_name, v.slug AS vendor_slug, v.logo_url AS vendor_logo_url
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN categories pc ON c.parent_id = pc.id
                LEFT JOIN vendors v ON p.vendor_id = v.id
                WHERE p.status = 'PUBLISHED'
                  AND p.stock_quantity > 0
                  AND p.vendor_id = $1
                  AND p.id != $2
                ORDER BY p.created_at DESC
                LIMIT 8
                `,
                [product.vendor_id, product.id]
            );
            relatedByVendor = related.rows.map(normalizeProductCard);
        }

        res.json({
            ...product,
            vendor: product.vendor_id_meta
                ? {
                      id: product.vendor_id_meta,
                      name: product.vendor_name,
                      slug: product.vendor_slug,
                      logo_url: product.vendor_logo_url,
                  }
                : null,
            category_meta: product.category_id_meta
                ? {
                      id: product.category_id_meta,
                      name: product.category_name,
                      slug: product.category_slug,
                      parentName: product.parent_category_name,
                      parentSlug: product.parent_category_slug,
                  }
                : null,
            relatedByVendor,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

module.exports = router;

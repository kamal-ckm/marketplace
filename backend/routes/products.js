const express = require('express');
const router = express.Router();
const db = require('../db');
const slugify = require('slugify');
const { requireAuth } = require('../lib/auth');

// --- Helper Functions ---

// Generate a unique slug
// excludeId is used when updating a product to exclude itself from uniqueness check
async function generateUniqueSlug(name, excludeId = null) {
    let slug = slugify(name, { lower: true, strict: true, trim: true });
    let originalSlug = slug;
    let counter = 1;

    while (true) {
        // Check if slug exists
        let query = 'SELECT id FROM products WHERE slug = $1';
        let params = [slug];

        if (excludeId) {
            query += ' AND id != $2';
            params.push(excludeId);
        }

        const result = await db.query(query, params);

        if (result.rows.length === 0) {
            break;
        }

        counter++;
        slug = `${originalSlug}-${counter}`;
    }
    return slug;
}

// --- Routes ---

// 1. Create Product (POST /api/products)
router.post('/products', requireAuth, async (req, res) => {
    try {
        const { name, description, price, mrp, stock_quantity, images, category, slug: providedSlug } = req.body;

        // Validation
        if (!name || price === undefined || mrp === undefined || !category) {
            return res.status(400).json({ error: 'Name, Price, MRP, and Category are required.' });
        }
        if (stock_quantity < 0) {
            return res.status(400).json({ error: 'Stock quantity must be non-negative.' });
        }

        // Slug Logic
        let finalSlug;
        if (providedSlug) {
            finalSlug = await generateUniqueSlug(providedSlug);
        } else {
            finalSlug = await generateUniqueSlug(name);
        }

        const status = 'DRAFT'; // Default
        const imageArray = Array.isArray(images) ? images : [];

        const query = `
      INSERT INTO products (name, slug, description, price, mrp, stock_quantity, images, category, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

        const values = [name, finalSlug, description, price, mrp, stock_quantity || 0, imageArray, category, status];
        const { rows } = await db.query(query, values);

        res.status(201).json(rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// 2. Update Product (PUT /api/products/:id)
router.put('/products/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, mrp, stock_quantity, images, category, status, slug } = req.body;

        // Check if product exists
        const checkProduct = await db.query('SELECT * FROM products WHERE id = $1', [id]);
        if (checkProduct.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const currentProduct = checkProduct.rows[0];

        // Slug Logic
        let finalSlug = currentProduct.slug;
        if (slug && slug !== currentProduct.slug) {
            finalSlug = await generateUniqueSlug(slug, id);
        }

        const query = `
      UPDATE products 
      SET name = $1, slug = $2, description = $3, price = $4, mrp = $5, stock_quantity = $6, images = $7, category = $8, status = $9
      WHERE id = $10
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
            category || currentProduct.category,
            status || currentProduct.status,
            id
        ];

        const { rows } = await db.query(query, values);
        res.json(rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// 3. List Admin Products (GET /api/admin/products)
router.get('/admin/products', requireAuth, async (req, res) => {
    try {
        const query = 'SELECT * FROM products ORDER BY created_at DESC';
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// A-2.1: Get Single Admin Product (GET /api/admin/products/:id)
router.get('/admin/products/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT * FROM products WHERE id = $1';
        const { rows } = await db.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// --- Storefront Public APIs ---

// 4. List Published Products (GET /api/products)
router.get('/products', async (req, res) => {
    try {
        const { category, q } = req.query;
        let query = "SELECT * FROM products WHERE status = 'PUBLISHED' AND stock_quantity > 0";
        const params = [];
        let paramIndex = 1;

        // Filter by Category
        if (category) {
            query += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        // Search (Name or Description)
        if (q) {
            query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
            params.push(`%${q}%`);
            paramIndex++;
        }

        query += ' ORDER BY created_at DESC';

        const { rows } = await db.query(query, params);

        // Return simplified "card" objects (though full object is fine for MVP)
        const cards = rows.map(p => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            mrp: p.mrp,
            images: p.images,
            category: p.category
        }));

        res.json(cards);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// 5. Get Product Detail (GET /api/products/:slug)
router.get('/products/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        // ONLY return if PUBLISHED. Drafts are 404 for public.
        const query = "SELECT * FROM products WHERE slug = $1 AND status = 'PUBLISHED'";
        const { rows } = await db.query(query, [slug]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});


module.exports = router;

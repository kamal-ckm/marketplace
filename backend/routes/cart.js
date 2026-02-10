const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../lib/auth');

// Helper: Get active cart for user
async function getActiveCart(userId) {
    const { rows } = await db.query(
        `SELECT id FROM carts WHERE user_id = $1 AND status = 'ACTIVE' LIMIT 1`,
        [userId]
    );
    if (rows.length > 0) return rows[0];

    // Create new cart if none exists
    const newCart = await db.query(
        `INSERT INTO carts (user_id, status) VALUES ($1, 'ACTIVE') RETURNING id`,
        [userId]
    );
    return newCart.rows[0];
}

// GET /api/cart
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await getActiveCart(userId);

        // Fetch items with product details
        const { rows: items } = await db.query(
            `
      SELECT 
        ci.id, 
        ci.product_id, 
        ci.quantity,
        p.name, 
        p.price, 
        p.mrp, 
        p.images, 
        p.stock_quantity,
        (p.price * ci.quantity) as total_price
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = $1
      ORDER BY ci.added_at DESC
      `,
            [cart.id]
        );

        // Calculate summary
        const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

        res.json({
            cartId: cart.id,
            items,
            summary: {
                totalAmount,
                totalItems,
            }
        });

    } catch (err) {
        console.error('Get Cart Error:', err);
        res.status(500).json({ error: 'Failed to fetch cart.' });
    }
});

// POST /api/cart (Add Item)
router.post('/', requireAuth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user.id;
        const qty = parseInt(quantity) || 1;

        if (!productId) return res.status(400).json({ error: 'Product ID is required.' });
        if (qty < 1) return res.status(400).json({ error: 'Quantity must be at least 1.' });

        const cart = await getActiveCart(userId);

        // Check if product exists and is published
        const productCheck = await db.query(
            "SELECT id, status, stock_quantity FROM products WHERE id = $1 AND status = 'PUBLISHED'",
            [productId]
        );

        if (productCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found or unavailable.' });
        }

        // Check if item already in cart
        const existingItem = await db.query(
            'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
            [cart.id, productId]
        );

        if (existingItem.rows.length > 0) {
            const newQty = existingItem.rows[0].quantity + qty;
            await db.query(
                'UPDATE cart_items SET quantity = $1 WHERE id = $2',
                [newQty, existingItem.rows[0].id]
            );
        } else {
            await db.query(
                'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)',
                [cart.id, productId, qty]
            );
        }

        res.json({ success: true, message: 'Item added to cart.' });

    } catch (err) {
        console.error('Add to Cart Error:', err);
        res.status(500).json({ error: 'Failed to add item to cart.' });
    }
});

// PUT /api/cart/:itemId (Update Quantity)
router.put('/:itemId', requireAuth, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        const qty = parseInt(quantity);

        if (qty < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1.' });
        }

        // Verify item belongs to user's cart
        const cart = await getActiveCart(req.user.id);

        const update = await db.query(
            'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND cart_id = $3 RETURNING id',
            [qty, itemId, cart.id]
        );

        if (update.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found in your cart.' });
        }

        res.json({ success: true, message: 'Cart updated.' });

    } catch (err) {
        console.error('Update Cart Error:', err);
        res.status(500).json({ error: 'Failed to update cart.' });
    }
});

// DELETE /api/cart/:itemId (Remove Item)
router.delete('/:itemId', requireAuth, async (req, res) => {
    try {
        const { itemId } = req.params;
        const cart = await getActiveCart(req.user.id);

        const del = await db.query(
            'DELETE FROM cart_items WHERE id = $1 AND cart_id = $2 RETURNING id',
            [itemId, cart.id]
        );

        if (del.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found in your cart.' });
        }

        res.json({ success: true, message: 'Item removed from cart.' });

    } catch (err) {
        console.error('Remove Item Error:', err);
        res.status(500).json({ error: 'Failed to remove item.' });
    }
});

module.exports = router;

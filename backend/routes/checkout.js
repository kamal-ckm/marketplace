const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../lib/auth');

router.post('/', requireAuth, async (req, res) => {
    const { shippingAddress } = req.body;
    const userId = req.user.id;

    if (!shippingAddress) {
        return res.status(400).json({ error: 'Shipping address is required.' });
    }

    let client;

    try {
        client = await db.getClient();
        await client.query('BEGIN');

        const cartRes = await client.query(
            `SELECT id FROM carts WHERE user_id = $1 AND status = 'ACTIVE' LIMIT 1`,
            [userId]
        );

        if (cartRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No active cart found.' });
        }
        const cartId = cartRes.rows[0].id;

        const itemsRes = await client.query(
            `
      SELECT 
        ci.product_id, 
        ci.quantity,
        p.name,
        p.price,
        p.stock_quantity
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = $1
      FOR UPDATE OF p
      `,
            [cartId]
        );

        const items = itemsRes.rows;

        if (items.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Cart is empty.' });
        }

        let totalAmount = 0;
        const errors = [];

        for (const item of items) {
            if (item.stock_quantity < item.quantity) {
                errors.push(`Insufficient stock for \"${item.name}\". Available: ${item.stock_quantity}`);
            }
            totalAmount += parseFloat(item.price) * item.quantity;
        }

        if (errors.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Stock validation failed', details: errors });
        }

        const orderRes = await client.query(
            `
      INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method)
      VALUES ($1, $2, 'CREATED', $3, 'COD')
      RETURNING id
      `,
            [userId, totalAmount, shippingAddress]
        );
        const orderId = orderRes.rows[0].id;

        for (const item of items) {
            await client.query(
                `
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, product_name_snapshot)
        VALUES ($1, $2, $3, $4, $5)
        `,
                [orderId, item.product_id, item.quantity, item.price, item.name]
            );

            await client.query(
                `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
                [item.quantity, item.product_id]
            );
        }

        await client.query(
            `UPDATE carts SET status = 'CONVERTED' WHERE id = $1`,
            [cartId]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            orderId,
            message: 'Order placed successfully!'
        });

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Checkout Error:', err);
        res.status(500).json({ error: 'Checkout failed. Please try again.' });
    } finally {
        if (client) client.release();
    }
});

module.exports = router;

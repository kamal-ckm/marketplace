/**
 * Admin Management Routes
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../lib/auth');

// GET /api/admin/stats - Dashboard Metrics
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
    try {
        // 1. Total Revenue (from orders)
        const revenueRes = await db.query('SELECT SUM(total_amount) as total FROM orders WHERE status != $1', ['CANCELLED']);
        const totalRevenue = parseFloat(revenueRes.rows[0].total || 0);

        // 2. Total Orders
        const ordersCountRes = await db.query('SELECT COUNT(*) as count FROM orders');
        const totalOrders = parseInt(ordersCountRes.rows[0].count);

        // 3. Wallet Utilization (Total wallet amount spent)
        const walletUtilRes = await db.query('SELECT SUM(wallet_amount) as total FROM orders');
        const walletUtilization = parseFloat(walletUtilRes.rows[0].total || 0);

        // 4. Rewards Redeemed
        const rewardsUtilRes = await db.query('SELECT SUM(rewards_amount) as total FROM orders');
        const rewardsUtilization = parseFloat(rewardsUtilRes.rows[0].total || 0);

        // 5. Recent Orders
        const recentOrdersRes = await db.query(`
            SELECT o.id, o.total_amount, o.status, o.created_at, u.name as user_name 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            ORDER BY o.created_at DESC 
            LIMIT 5
        `);

        // 6. Revenue Trends (Group by day for last 7 days)
        const trendsRes = await db.query(`
            SELECT DATE_TRUNC('day', created_at) as day, SUM(total_amount) as amount
            FROM orders
            WHERE created_at > NOW() - INTERVAL '7 days'
            GROUP BY day
            ORDER BY day ASC
        `);

        res.json({
            metrics: {
                totalRevenue,
                totalOrders,
                walletUtilization,
                rewardsUtilization
            },
            recentOrders: recentOrdersRes.rows,
            trends: trendsRes.rows
        });

    } catch (err) {
        console.error('Admin Stats Error:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
    }
});

// GET /api/admin/orders - List all orders
router.get('/orders', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { rows: orders } = await db.query(`
            SELECT 
                o.id, 
                o.total_amount, 
                o.wallet_amount, 
                o.rewards_amount, 
                o.cash_amount,
                o.status, 
                o.shipping_address, 
                o.payment_method, 
                o.beneficiary_name, 
                o.created_at,
                u.name as user_name,
                u.email as user_email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);
        res.json(orders);
    } catch (err) {
        console.error('Admin Orders Error:', err);
        res.status(500).json({ error: 'Failed to fetch orders.' });
    }
});

module.exports = router;

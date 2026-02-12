/**
 * Customer Auth Routes
 * 
 * POST /api/auth/customer/register — Register new customer
 * POST /api/auth/customer/login    — Login customer
 * GET  /api/auth/customer/me       — Get current customer info
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { generateToken, requireAuth } = require('../lib/auth');

// POST /api/auth/customer/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }

        // Check if user exists
        const check = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email.' });
        }

        // Hash password
        const hash = await bcrypt.hash(password, 10);

        // Create user
        const { rows } = await db.query(
            `INSERT INTO users (email, password_hash, name, wallet_balance, rewards_balance)
       VALUES ($1, $2, $3, 0, 0)
       RETURNING id, email, name, wallet_balance, rewards_balance`,
            [email.toLowerCase().trim(), hash, name]
        );

        const user = rows[0];

        // Auto-login after registration
        const token = generateToken({
            id: user.id,
            email: user.email,
            name: user.name,
            role: 'customer', // Distinct from admin
        });

        res.status(201).json({ token, user });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// POST /api/auth/customer/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Find user
        const { rows } = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = rows[0];

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Generate JWT
        const token = generateToken({
            id: user.id,
            email: user.email,
            name: user.name,
            role: 'customer',
        });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                wallet_balance: user.wallet_balance,
                rewards_balance: user.rewards_balance,
                employer_name: user.employer_name,
            },
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// GET /api/auth/customer/me
router.get('/me', requireAuth, async (req, res) => {
    try {
        // Only allow customers
        if (req.user.role !== 'customer') {
            return res.status(403).json({ error: 'Access denied. Customers only.' });
        }

        const { rows } = await db.query(
            'SELECT id, email, name, wallet_balance, rewards_balance, employer_name FROM users WHERE id = $1',
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Auth check error:', err);
        res.status(500).json({ error: 'Failed to verify authentication.' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { generateToken, requireAuth } = require('../lib/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Find user
        const { rows } = await db.query(
            'SELECT * FROM admin_users WHERE email = $1 AND is_active = true',
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

        // Update last login
        await db.query(
            'UPDATE admin_users SET last_login_at = NOW() WHERE id = $1',
            [user.id]
        );

        // Generate JWT
        const token = generateToken({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT id, email, name, role, last_login_at FROM admin_users WHERE id = $1',
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

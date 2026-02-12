/**
 * Seed Script: Create Default Admin User
 * 
 * Usage: node lib/seed.js
 * 
 * Creates a default admin account if none exists.
 * Safe to run multiple times (idempotent).
 */

const bcrypt = require('bcrypt');
const db = require('../db');

const DEFAULT_ADMIN = {
    email: 'admin@healthi.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'super_admin',
};

// Convenience demo customer account (storefront login)
// Safe to keep for demo/staging. Remove/rotate for real production.
const DEFAULT_CUSTOMER = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test Customer',
};

async function seed() {
    console.log('\n🌱 Seeding database...\n');

    try {
        // -----------------------------------------------------------------
        // Admin seed
        // -----------------------------------------------------------------
        // Check if admin already exists
        const { rows } = await db.query(
            'SELECT id FROM admin_users WHERE email = $1',
            [DEFAULT_ADMIN.email]
        );

        if (rows.length > 0) {
            console.log(`  ✓ Admin user "${DEFAULT_ADMIN.email}" already exists. Skipping.\n`);
        } else {
            // Hash password
            const hash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

            // Insert
            await db.query(
                `INSERT INTO admin_users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)`,
                [DEFAULT_ADMIN.email, hash, DEFAULT_ADMIN.name, DEFAULT_ADMIN.role]
            );

            console.log(`  ✅ Created admin user:`);
            console.log(`     Email:    ${DEFAULT_ADMIN.email}`);
            console.log(`     Password: ${DEFAULT_ADMIN.password}`);
            console.log(`     Role:     ${DEFAULT_ADMIN.role}`);
            console.log(`\n  ⚠️  Change the default password in production!\n`);
        }

        // -----------------------------------------------------------------
        // Customer seed (demo)
        // -----------------------------------------------------------------
        const existingCustomer = await db.query(
            'SELECT id FROM users WHERE email = $1',
            [DEFAULT_CUSTOMER.email.toLowerCase().trim()]
        );

        if (existingCustomer.rows.length > 0) {
            console.log(`  ✓ Customer "${DEFAULT_CUSTOMER.email}" already exists. Skipping.\n`);
        } else {
            const customerHash = await bcrypt.hash(DEFAULT_CUSTOMER.password, 10);

            await db.query(
                `INSERT INTO users (email, password_hash, name, wallet_balance, rewards_balance)
       VALUES ($1, $2, $3, 0, 0)`,
                [DEFAULT_CUSTOMER.email.toLowerCase().trim(), customerHash, DEFAULT_CUSTOMER.name]
            );

            console.log(`  ✅ Created demo customer user:`);
            console.log(`     Email:    ${DEFAULT_CUSTOMER.email}`);
            console.log(`     Password: ${DEFAULT_CUSTOMER.password}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('  ❌ Seed failed:', err.message);
        process.exit(1);
    }
}

seed();

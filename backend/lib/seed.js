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

async function seed() {
    console.log('\n🌱 Seeding database...\n');

    try {
        // Check if admin already exists
        const { rows } = await db.query(
            'SELECT id FROM admin_users WHERE email = $1',
            [DEFAULT_ADMIN.email]
        );

        if (rows.length > 0) {
            console.log(`  ✓ Admin user "${DEFAULT_ADMIN.email}" already exists. Skipping.\n`);
            process.exit(0);
        }

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

        process.exit(0);
    } catch (err) {
        console.error('  ❌ Seed failed:', err.message);
        process.exit(1);
    }
}

seed();

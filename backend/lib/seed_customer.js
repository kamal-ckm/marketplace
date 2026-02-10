require('dotenv').config();
const db = require('../db');
const bcrypt = require('bcrypt');

(async () => {
    try {
        console.log('Seeding customer user...');
        const email = 'test@example.com';
        const password = 'password123';
        const hash = await bcrypt.hash(password, 10);

        await db.query(`
            INSERT INTO users (email, password_hash, name, wallet_balance, rewards_balance)
            VALUES ($1, $2, $3, 12500.00, 850)
            ON CONFLICT (email) DO UPDATE SET password_hash = $2
        `, [email, hash, 'Test Customer']);

        console.log('✅ Seeded customer: test@example.com / password123');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
})();

require('dotenv').config();
const db = require('../db');

(async () => {
    try {
        console.log('Seeding product...');
        const res = await db.query(`
            INSERT INTO products (name, slug, price, mrp, stock_quantity, status, category, images)
            VALUES ('Test Yoga Mat', 'test-yoga-mat', 999.00, 1200.00, 50, 'PUBLISHED', 'Fitness', ARRAY['https://via.placeholder.com/300'])
            ON CONFLICT (slug) DO UPDATE SET stock_quantity = 50
            RETURNING *
        `);
        console.log('Seeded:', res.rows[0].name);
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
})();

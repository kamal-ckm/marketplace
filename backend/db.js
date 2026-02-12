const { Pool } = require('pg');
require('dotenv').config();

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

const poolConfig = hasDatabaseUrl
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER || 'admin',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'healthi_marketplace',
      password: process.env.DB_PASSWORD || 'password',
      port: Number(process.env.DB_PORT || 5432),
    };

// Managed Postgres providers (Neon/Supabase/etc.) require TLS in production.
if (hasDatabaseUrl || process.env.VERCEL || process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};

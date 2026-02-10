/**
 * Database Migration Runner
 * 
 * A lightweight, zero-dependency migration system for PostgreSQL.
 * Reads .sql files from the /migrations directory and applies them in order.
 * 
 * Features:
 *   - Sequential, versioned migrations (001_, 002_, etc.)
 *   - Tracks applied migrations in a `_migrations` table
 *   - Prevents re-running already-applied migrations
 *   - Supports UP migrations (DOWN/rollback planned for Phase 3)
 * 
 * Usage:
 *   node lib/migrate.js          # Apply all pending migrations
 *   node lib/migrate.js status   # Show migration status
 */

const fs = require('fs');
const path = require('path');
const db = require('../db');

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');
const MIGRATIONS_TABLE = '_migrations';

// ---------------------------------------------------------------------------
// Ensure migrations tracking table exists
// ---------------------------------------------------------------------------
async function ensureMigrationsTable() {
    await db.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

// ---------------------------------------------------------------------------
// Get list of already-applied migrations
// ---------------------------------------------------------------------------
async function getAppliedMigrations() {
    const { rows } = await db.query(
        `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY name`
    );
    return rows.map(r => r.name);
}

// ---------------------------------------------------------------------------
// Get list of migration files on disk
// ---------------------------------------------------------------------------
function getMigrationFiles() {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
        fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
        return [];
    }

    return fs.readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort(); // Lexicographic sort ensures 001_ < 002_ < ...
}

// ---------------------------------------------------------------------------
// Apply a single migration
// ---------------------------------------------------------------------------
async function applyMigration(filename) {
    const filePath = path.join(MIGRATIONS_DIR, filename);
    const sql = fs.readFileSync(filePath, 'utf-8');

    // Run in a transaction for atomicity
    const client = await require('../db').query ? null : null; // We use pool.query
    try {
        await db.query('BEGIN');
        await db.query(sql);
        await db.query(
            `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`,
            [filename]
        );
        await db.query('COMMIT');
        console.log(`  ✅ Applied: ${filename}`);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(`  ❌ Failed: ${filename}`);
        console.error(`     Error: ${err.message}`);
        throw err; // Stop all further migrations
    }
}

// ---------------------------------------------------------------------------
// Main: Run all pending migrations
// ---------------------------------------------------------------------------
async function migrate() {
    console.log('\n🔄 Running database migrations...\n');

    await ensureMigrationsTable();

    const applied = await getAppliedMigrations();
    const files = getMigrationFiles();
    const pending = files.filter(f => !applied.includes(f));

    if (pending.length === 0) {
        console.log('  ✓ Database is up to date. No pending migrations.\n');
        return;
    }

    console.log(`  Found ${pending.length} pending migration(s):\n`);

    for (const file of pending) {
        await applyMigration(file);
    }

    console.log(`\n✅ All migrations applied successfully.\n`);
}

// ---------------------------------------------------------------------------
// Status: Show which migrations are applied vs pending
// ---------------------------------------------------------------------------
async function status() {
    console.log('\n📊 Migration Status\n');

    await ensureMigrationsTable();

    const applied = await getAppliedMigrations();
    const files = getMigrationFiles();

    if (files.length === 0) {
        console.log('  No migration files found.\n');
        return;
    }

    for (const file of files) {
        const isApplied = applied.includes(file);
        console.log(`  ${isApplied ? '✅' : '⏳'} ${file} ${isApplied ? '(applied)' : '(pending)'}`);
    }

    const pending = files.filter(f => !applied.includes(f));
    console.log(`\n  Total: ${files.length} | Applied: ${applied.length} | Pending: ${pending.length}\n`);
}

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------
const command = process.argv[2];

if (command === 'status') {
    status()
        .then(() => process.exit(0))
        .catch((err) => { console.error(err); process.exit(1); });
} else {
    migrate()
        .then(() => process.exit(0))
        .catch((err) => { console.error(err); process.exit(1); });
}

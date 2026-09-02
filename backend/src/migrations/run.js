// Migration runner: runs every .sql file in this folder in order.
// Usage: `npm run migrate`   (reads DATABASE_URL or local DB_* env vars)
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function runMigrations() {
  const dir = __dirname;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('ℹ️  ไม่พบ migration files');
    process.exit(0);
  }

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    await pool.query(sql);
    console.log(`✅ Applied migration: ${file}`);
  }

  console.log('🎉 All migrations applied successfully');
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

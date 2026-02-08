#!/usr/bin/env node

/**
 * Run V2 Migration Against Vercel Postgres
 *
 * Usage:
 * 1. Set DATABASE_URL environment variable (from Vercel)
 * 2. Run: node scripts/migrate-v2.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    console.log('\nTo run migration against Vercel Postgres:');
    console.log('1. Get DATABASE_URL from Vercel project settings');
    console.log('2. Run: DATABASE_URL="postgres://..." node scripts/migrate-v2.js');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Connected to database');

    const migrationPath = path.join(__dirname, '../migrations/002_v2_priority_lanes.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Running V2 migration...');
    await client.query(sql);
    console.log('✓ Migration completed successfully');

    // Verify migration
    const result = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tasks' AND column_name IN ('assignee', 'assignee_type', 'position', 'completed_at')
    `);

    console.log(`\n✓ Verified ${result.rows.length}/4 new columns added:`);
    result.rows.forEach(row => console.log(`  - ${row.column_name}`));

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();

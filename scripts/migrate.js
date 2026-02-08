#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get migration file from command line args, or run all
    const migrationFile = process.argv[2];
    const migrationsDir = path.join(__dirname, '../migrations');

    let migrationFiles = [];
    if (migrationFile) {
      migrationFiles = [migrationFile];
    } else {
      // Run all migrations in order
      migrationFiles = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();
    }

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      if (!fs.existsSync(migrationPath)) {
        console.error(`Migration file not found: ${file}`);
        continue;
      }

      const sql = fs.readFileSync(migrationPath, 'utf-8');
      console.log(`Running migration: ${file}...`);
      await client.query(sql);
      console.log(`✓ ${file} completed`);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();

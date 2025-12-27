#!/usr/bin/env node
/* Migration runner with tracking: executes SQL files and records completion */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const migrationsDir = path.join(process.cwd(), 'migrations');

const client = new Client({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5432,
  database: process.env.POSTGRES_DB || 'task_manager',
  user: process.env.POSTGRES_USER || 'task_user',
  password: process.env.POSTGRES_PASSWORD || 'task_pass',
});

/**
 * Calculate SHA-256 checksum of migration file content
 */
const calculateChecksum = (content) => {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
};

/**
 * Ensure the schema_migrations table exists
 */
const ensureMigrationTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
      execution_time_ms INTEGER,
      checksum VARCHAR(64)
    );
    CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);
  `;
  await client.query(createTableSQL);
};

/**
 * Get list of already applied migrations
 */
const getAppliedMigrations = async () => {
  const result = await client.query(
    'SELECT version, checksum FROM schema_migrations ORDER BY version'
  );
  return new Map(result.rows.map(row => [row.version, row.checksum]));
};

/**
 * Record a migration as applied
 */
const recordMigration = async (version, name, executionTime, checksum) => {
  await client.query(
    `INSERT INTO schema_migrations (version, name, execution_time_ms, checksum)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (version) DO NOTHING`,
    [version, name, executionTime, checksum]
  );
};

/**
 * Extract version and name from migration filename
 * e.g., "001_create_tables.sql" -> { version: "001", name: "create_tables" }
 */
const parseMigrationFilename = (filename) => {
  const match = filename.match(/^(\d+)_(.+)\.sql$/);
  if (!match) return null;
  return { version: match[1], name: match[2] };
};

const run = async () => {
  await client.connect();
  console.log('🔄 Starting database migrations...\n');
  
  try {
    // Ensure migration tracking table exists
    await ensureMigrationTable();
    
    // Get list of applied migrations
    const appliedMigrations = await getAppliedMigrations();
    console.log(`📊 Found ${appliedMigrations.size} previously applied migration(s)\n`);
    
    // Get all migration files (excluding seed files)
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql') && !f.includes('seed'))
      .sort();
    
    let appliedCount = 0;
    let skippedCount = 0;
    
    for (const file of files) {
      const parsed = parseMigrationFilename(file);
      if (!parsed) {
        console.log(`⚠️  Skipping invalid filename: ${file}`);
        continue;
      }
      
      const { version, name } = parsed;
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      const checksum = calculateChecksum(sql);
      
      // Check if already applied
      if (appliedMigrations.has(version)) {
        const existingChecksum = appliedMigrations.get(version);
        if (existingChecksum !== checksum) {
          console.error(`❌ ERROR: Migration ${file} has been modified after being applied!`);
          console.error(`   Expected checksum: ${existingChecksum}`);
          console.error(`   Current checksum:  ${checksum}`);
          console.error(`   This is dangerous and should be investigated.\n`);
          process.exitCode = 1;
          return;
        }
        console.log(`⏭️  Skipping ${file} (already applied)`);
        skippedCount++;
        continue;
      }
      
      // Apply migration
      console.log(`🔧 Applying ${file}...`);
      const startTime = Date.now();
      
      try {
        await client.query('BEGIN');
        await client.query(sql);
        const executionTime = Date.now() - startTime;
        await recordMigration(version, name, executionTime, checksum);
        await client.query('COMMIT');
        
        console.log(`✅ Applied ${file} (${executionTime}ms)\n`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error(`❌ Failed to apply ${file}:`, err.message);
        throw err;
      }
    }
    
    console.log('━'.repeat(50));
    console.log(`✨ Migration complete!`);
    console.log(`   Applied: ${appliedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total:   ${files.length}`);
    console.log('━'.repeat(50));
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
};

run();

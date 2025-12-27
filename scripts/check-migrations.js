#!/usr/bin/env node
/* Check migration status: shows which migrations have been applied */
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const client = new Client({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5432,
  database: process.env.POSTGRES_DB || 'task_manager',
  user: process.env.POSTGRES_USER || 'task_user',
  password: process.env.POSTGRES_PASSWORD || 'task_pass',
});

const checkStatus = async () => {
  try {
    await client.connect();
    console.log('📊 Database Migration Status\n');
    console.log('━'.repeat(80));
    
    // Check if migration table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('⚠️  No migration tracking table found. Run migrations first.');
      console.log('   Command: npm run db:migrate\n');
      return;
    }
    
    // Get all applied migrations
    const result = await client.query(`
      SELECT 
        version,
        name,
        applied_at,
        execution_time_ms,
        checksum
      FROM schema_migrations 
      ORDER BY version ASC
    `);
    
    if (result.rows.length === 0) {
      console.log('ℹ️  No migrations have been applied yet.');
      console.log('   Command: npm run db:migrate\n');
      return;
    }
    
    console.log(`Total Applied Migrations: ${result.rows.length}\n`);
    
    // Display table header
    console.log('Version | Name                          | Applied At           | Time (ms)');
    console.log('━'.repeat(80));
    
    // Display each migration
    result.rows.forEach(row => {
      const version = row.version.padEnd(7);
      const name = row.name.padEnd(30).substring(0, 30);
      const appliedAt = new Date(row.applied_at).toLocaleString().padEnd(20);
      const time = row.execution_time_ms ? String(row.execution_time_ms).padStart(9) : '       N/A';
      
      console.log(`${version} | ${name} | ${appliedAt} | ${time}`);
    });
    
    console.log('━'.repeat(80));
    
    // Show latest migration
    const latest = result.rows[result.rows.length - 1];
    console.log(`\n✅ Latest Migration: ${latest.version}_${latest.name}.sql`);
    console.log(`   Applied: ${new Date(latest.applied_at).toLocaleString()}`);
    console.log();
    
  } catch (err) {
    console.error('❌ Error checking migration status:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
};

checkStatus();

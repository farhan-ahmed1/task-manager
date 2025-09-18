#!/usr/bin/env node
/* Simple migration runner: executes SQL files in migrations/ in lexical order */
import fs from 'fs';
import path from 'path';
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

const run = async () => {
  await client.connect();
  try {
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      // wrap each migration in a transaction
      console.log(`Applying ${file}...`);
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
    }
    console.log('Migrations applied successfully');
  } catch (err) {
    console.error('Migration failed', err);
    await client.query('ROLLBACK').catch(() => {});
    process.exitCode = 1;
  } finally {
    await client.end();
  }
};

run();

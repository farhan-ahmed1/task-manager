#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const seedFile = path.join(process.cwd(), 'migrations', 'seed_dev.sql');

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
    const sql = fs.readFileSync(seedFile, 'utf8');
    console.log('Running seed script...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Seeding completed');
  } catch (err) {
    console.error('Seeding failed', err);
    await client.query('ROLLBACK').catch(() => {});
    process.exitCode = 1;
  } finally {
    await client.end();
  }
};

run();

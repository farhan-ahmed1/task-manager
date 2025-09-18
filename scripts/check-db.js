#!/usr/bin/env node
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

const run = async () => {
  try {
    await client.connect();
    const res = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
    console.log('Public tables:');
    res.rows.forEach((r) => console.log('- ' + r.table_name));
  } catch (err) {
    console.error('DB check failed', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
};

run();

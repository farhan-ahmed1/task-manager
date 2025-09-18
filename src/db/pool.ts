import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5432,
  database: process.env.POSTGRES_DB || 'task_manager',
  user: process.env.POSTGRES_USER || 'task_user',
  password: process.env.POSTGRES_PASSWORD || 'task_pass',
  max: process.env.PG_MAX_CLIENTS ? Number(process.env.PG_MAX_CLIENTS) : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;

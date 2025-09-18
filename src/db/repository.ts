import pool from './pool';

export type User = {
  id: string;
  email: string;
  name?: string;
};

export const createUser = async (email: string, passwordHash: string, name?: string) => {
  const res = await pool.query(
    `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name`,
    [email, passwordHash, name],
  );
  return res.rows[0] as User;
};

export const getUserByEmail = async (email: string) => {
  const res = await pool.query(
    `SELECT id, email, name, password_hash FROM users WHERE email = $1`,
    [email],
  );
  return res.rows[0] as (User & { password_hash?: string }) | null;
};

export const getUserById = async (id: string) => {
  const res = await pool.query(`SELECT id, email, name FROM users WHERE id = $1`, [id]);
  return res.rows[0] as User | null;
};

export const createProject = async (ownerId: string, name: string, description?: string) => {
  const res = await pool.query(
    `INSERT INTO projects (owner_id, name, description) VALUES ($1, $2, $3) RETURNING *`,
    [ownerId, name, description],
  );
  return res.rows[0];
};

export const createTask = async (
  projectId: string,
  title: string,
  description?: string,
  dueDate?: string,
) => {
  const res = await pool.query(
    `INSERT INTO tasks (project_id, title, description, due_date) VALUES ($1, $2, $3, $4) RETURNING *`,
    [projectId, title, description, dueDate],
  );
  return res.rows[0];
};

export const assignTask = async (taskId: string, userId: string) => {
  const res = await pool.query(
    `INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2) RETURNING *`,
    [taskId, userId],
  );
  return res.rows[0];
};

export const getTasksByUser = async (userId: string) => {
  const res = await pool.query(
    `SELECT t.* FROM tasks t JOIN task_assignments ta ON ta.task_id = t.id WHERE ta.user_id = $1`,
    [userId],
  );
  return res.rows;
};

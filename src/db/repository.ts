import pool from './pool';
import { Task, CreateTaskDto, UpdateTaskDto } from '../../types/task';
// --- Task CRUD Operations ---

export const createTask = async (userId: string, data: CreateTaskDto): Promise<Task> => {
  const {
    title,
    description = null,
    status = 'PENDING',
    priority = 'MEDIUM',
    due_date = null,
    project_id = null,
  } = data;
  const res = await pool.query(
    `INSERT INTO tasks (project_id, title, description, status, priority, due_date, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, now(), now())
     RETURNING *`,
    [project_id, title, description, status, priority, due_date],
  );
  const task = res.rows[0];
  // Assign task to user
  await pool.query(`INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2)`, [
    task.id,
    userId,
  ]);
  return task;
};

export const getTasks = async (userId: string): Promise<Task[]> => {
  const res = await pool.query(
    `SELECT t.* FROM tasks t
     JOIN task_assignments ta ON ta.task_id = t.id
     WHERE ta.user_id = $1
     ORDER BY t.created_at DESC`,
    [userId],
  );
  return res.rows;
};

export const getTaskById = async (userId: string, taskId: string): Promise<Task | null> => {
  const res = await pool.query(
    `SELECT t.* FROM tasks t
     JOIN task_assignments ta ON ta.task_id = t.id
     WHERE ta.user_id = $1 AND t.id = $2`,
    [userId, taskId],
  );
  return res.rows[0] || null;
};

export const updateTask = async (
  userId: string,
  taskId: string,
  updates: UpdateTaskDto,
): Promise<Task | null> => {
  // Build dynamic SET clause
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
  }

  if (fields.length === 0) return null;

  // Add updated_at
  fields.push(`updated_at = $${idx}`);
  values.push(new Date());
  idx++;

  // Add parameters for WHERE clause
  values.push(taskId); // $idx (for WHERE id = ...)
  values.push(userId); // $idx+1 (for user verification)

  const setClause = fields.join(', ');
  const res = await pool.query(
    `UPDATE tasks SET ${setClause}
     WHERE id = $${idx} AND id IN (
       SELECT t.id FROM tasks t
       JOIN task_assignments ta ON ta.task_id = t.id
       WHERE ta.user_id = $${idx + 1}
     )
     RETURNING *`,
    values,
  );
  return res.rows[0] || null;
};

export const deleteTask = async (userId: string, taskId: string): Promise<boolean> => {
  // Only allow delete if user is assigned
  const res = await pool.query(
    `DELETE FROM tasks WHERE id = $1 AND id IN (
      SELECT t.id FROM tasks t
      JOIN task_assignments ta ON ta.task_id = t.id
      WHERE ta.user_id = $2
    ) RETURNING id`,
    [taskId, userId],
  );
  return res.rowCount > 0;
};

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

export const getUserByIdWithPassword = async (id: string) => {
  const res = await pool.query(`SELECT id, email, name, password_hash FROM users WHERE id = $1`, [
    id,
  ]);
  return res.rows[0] as (User & { password_hash?: string }) | null;
};

export const updateUserProfile = async (id: string, name: string, email: string): Promise<User> => {
  const res = await pool.query(
    `UPDATE users SET name = $1, email = $2, updated_at = now() WHERE id = $3 RETURNING id, email, name, created_at, updated_at`,
    [name, email, id],
  );
  return res.rows[0] as User;
};

export const updateUserPassword = async (id: string, passwordHash: string): Promise<void> => {
  await pool.query(`UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`, [
    passwordHash,
    id,
  ]);
};

export const createProject = async (ownerId: string, name: string, description?: string) => {
  const res = await pool.query(
    `INSERT INTO projects (owner_id, name, description) VALUES ($1, $2, $3) RETURNING *`,
    [ownerId, name, description],
  );
  return res.rows[0];
};

export const getProjectsForOwner = async (ownerId: string) => {
  const res = await pool.query(
    `SELECT * FROM projects WHERE owner_id = $1 ORDER BY created_at DESC`,
    [ownerId],
  );
  return res.rows;
};

export const getProjectById = async (ownerId: string, projectId: string) => {
  const res = await pool.query(`SELECT * FROM projects WHERE id = $1 AND owner_id = $2`, [
    projectId,
    ownerId,
  ]);
  return res.rows[0] || null;
};

export const updateProject = async (
  ownerId: string,
  projectId: string,
  updates: { name?: string; description?: string },
) => {
  const fields: string[] = [];
  const values: (string | Date)[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
  }

  if (fields.length === 0) return null;

  // updated_at
  fields.push(`updated_at = $${idx}`);
  values.push(new Date());
  idx++;

  // where params
  values.push(projectId);
  values.push(ownerId);

  const setClause = fields.join(', ');
  const res = await pool.query(
    `UPDATE projects SET ${setClause} WHERE id = $${idx} AND owner_id = $${idx + 1} RETURNING *`,
    values,
  );
  return res.rows[0] || null;
};

export const deleteProject = async (ownerId: string, projectId: string) => {
  const res = await pool.query(
    `DELETE FROM projects WHERE id = $1 AND owner_id = $2 RETURNING id`,
    [projectId, ownerId],
  );
  return res.rowCount > 0;
};

// Return counts grouped by status for a given project (only owner can view)
export const getProjectStats = async (ownerId: string, projectId: string) => {
  const res = await pool.query(
    `SELECT t.status, COUNT(*)::int AS count
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
     WHERE p.id = $1 AND p.owner_id = $2
     GROUP BY t.status`,
    [projectId, ownerId],
  );

  // Normalize to object with statuses
  const stats: Record<string, number> = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 };
  for (const row of res.rows) {
    stats[row.status] = Number(row.count);
  }
  return stats;
};

// Update getTasks to accept optional project filter and status filter
export const getTasksByFilter = async (userId: string, projectId?: string, status?: string) => {
  const conditions = ['ta.user_id = $1'];
  const params = [userId];
  let paramIndex = 2;

  if (projectId) {
    conditions.push(`t.project_id = $${paramIndex}`);
    params.push(projectId);
    paramIndex++;
  }

  if (status) {
    conditions.push(`t.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  const res = await pool.query(
    `SELECT t.* FROM tasks t
     JOIN task_assignments ta ON ta.task_id = t.id
     WHERE ${whereClause}
     ORDER BY t.created_at DESC`,
    params,
  );
  return res.rows;
};

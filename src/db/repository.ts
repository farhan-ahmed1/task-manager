import pool from './pool';
import {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  Section,
  CreateSectionDto,
  UpdateSectionDto,
} from '../../types/task';
// --- Task CRUD Operations ---

export const createTask = async (userId: string, data: CreateTaskDto): Promise<Task> => {
  const {
    title,
    description = null,
    status = 'PENDING',
    priority = 'MEDIUM',
    due_date = null,
    project_id = null,
    section_id = null,
  } = data;
  const res = await pool.query(
    `INSERT INTO tasks (project_id, section_id, title, description, status, priority, due_date, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
     RETURNING *`,
    [project_id, section_id, title, description, status, priority, due_date],
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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create the project
    const projectRes = await client.query(
      `INSERT INTO projects (owner_id, name, description) VALUES ($1, $2, $3) RETURNING *`,
      [ownerId, name, description],
    );
    const project = projectRes.rows[0];

    // Add the owner as an OWNER member with ACCEPTED status
    await client.query(
      `INSERT INTO project_members (project_id, user_id, role, invited_by, accepted_at, status)
       VALUES ($1, $2, 'OWNER', $3, now(), 'ACCEPTED')`,
      [project.id, ownerId, ownerId],
    );

    await client.query('COMMIT');
    return project;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getProjectsForOwner = async (ownerId: string) => {
  // Use the new shared-aware function instead
  return getAccessibleProjects(ownerId);
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

// --- Project Sharing Operations ---

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  invited_by: string;
  invited_at: string;
  accepted_at?: string;
  user_email?: string;
  user_name?: string;
}

export interface ProjectInvitation {
  id: string;
  project_id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  token: string;
  expires_at: string;
  invited_by: string;
  invited_by_name?: string;
  project_name?: string;
}

// Get all members of a project (only accessible by project members)
export const getProjectMembers = async (
  userId: string,
  projectId: string,
): Promise<ProjectMember[]> => {
  // First verify user has access to this project
  const accessCheck = await pool.query(
    `SELECT 1 FROM project_members 
     WHERE project_id = $1 AND user_id = $2 AND status = 'ACCEPTED'`,
    [projectId, userId],
  );

  if (accessCheck.rows.length === 0) {
    throw new Error('Access denied to project');
  }

  const res = await pool.query(
    `SELECT pm.*, u.email as user_email, u.name as user_name
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1
     ORDER BY pm.role, pm.invited_at`,
    [projectId],
  );
  return res.rows;
};

// Invite user to project by email
export const inviteUserToProject = async (
  invitedBy: string,
  projectId: string,
  email: string,
  role: 'ADMIN' | 'MEMBER' | 'VIEWER' = 'MEMBER',
): Promise<ProjectInvitation> => {
  // Verify inviter has admin access
  const accessCheck = await pool.query(
    `SELECT role FROM project_members 
     WHERE project_id = $1 AND user_id = $2 AND status = 'ACCEPTED'`,
    [projectId, invitedBy],
  );

  if (accessCheck.rows.length === 0 || !['OWNER', 'ADMIN'].includes(accessCheck.rows[0].role)) {
    throw new Error('Insufficient permissions to invite users');
  }

  // Check if user is already a member
  const existingMember = await pool.query(
    `SELECT pm.* FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1 AND u.email = $2`,
    [projectId, email],
  );

  if (existingMember.rows.length > 0) {
    throw new Error('User is already a member of this project');
  }

  // Generate secure invitation token
  const crypto = await import('crypto');
  const token = crypto.randomBytes(32).toString('hex');

  // Create invitation
  const res = await pool.query(
    `INSERT INTO project_invitations (project_id, email, role, invited_by, token)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [projectId, email.toLowerCase(), role, invitedBy, token],
  );

  return res.rows[0];
};

// Accept project invitation
export const acceptProjectInvitation = async (
  token: string,
  userId: string,
): Promise<ProjectMember> => {
  // Get invitation details
  const invitationRes = await pool.query(
    `SELECT pi.*, p.name as project_name
     FROM project_invitations pi
     JOIN projects p ON p.id = pi.project_id
     WHERE pi.token = $1 AND pi.expires_at > now() AND pi.used_at IS NULL`,
    [token],
  );

  if (invitationRes.rows.length === 0) {
    throw new Error('Invalid or expired invitation');
  }

  const invitation = invitationRes.rows[0];

  // Verify user email matches invitation
  const user = await getUserById(userId);
  if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new Error('This invitation is not for your email address');
  }

  // Check if already a member
  const existingMember = await pool.query(
    `SELECT 1 FROM project_members 
     WHERE project_id = $1 AND user_id = $2`,
    [invitation.project_id, userId],
  );

  if (existingMember.rows.length > 0) {
    throw new Error('You are already a member of this project');
  }

  // Create membership and mark invitation as used
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add member
    const memberRes = await client.query(
      `INSERT INTO project_members (project_id, user_id, role, invited_by, accepted_at, status)
       VALUES ($1, $2, $3, $4, now(), 'ACCEPTED')
       RETURNING *`,
      [invitation.project_id, userId, invitation.role, invitation.invited_by],
    );

    // Mark invitation as used
    await client.query(`UPDATE project_invitations SET used_at = now() WHERE id = $1`, [
      invitation.id,
    ]);

    await client.query('COMMIT');
    return memberRes.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Remove member from project
export const removeProjectMember = async (
  removedBy: string,
  projectId: string,
  memberUserId: string,
): Promise<boolean> => {
  // Verify remover has admin access
  const accessCheck = await pool.query(
    `SELECT role FROM project_members 
     WHERE project_id = $1 AND user_id = $2 AND status = 'ACCEPTED'`,
    [projectId, removedBy],
  );

  if (accessCheck.rows.length === 0 || !['OWNER', 'ADMIN'].includes(accessCheck.rows[0].role)) {
    throw new Error('Insufficient permissions to remove members');
  }

  // Cannot remove project owner
  const memberCheck = await pool.query(
    `SELECT role FROM project_members 
     WHERE project_id = $1 AND user_id = $2`,
    [projectId, memberUserId],
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('User is not a member of this project');
  }

  if (memberCheck.rows[0].role === 'OWNER') {
    throw new Error('Cannot remove project owner');
  }

  const res = await pool.query(
    `DELETE FROM project_members 
     WHERE project_id = $1 AND user_id = $2 AND role != 'OWNER'
     RETURNING id`,
    [projectId, memberUserId],
  );

  return res.rowCount > 0;
};

// Get projects accessible to user (owned + shared)
export const getAccessibleProjects = async (userId: string) => {
  const res = await pool.query(
    `SELECT DISTINCT p.*, pm.role as user_role
     FROM projects p
     JOIN project_members pm ON pm.project_id = p.id
     WHERE pm.user_id = $1 AND pm.status = 'ACCEPTED'
     ORDER BY p.created_at DESC`,
    [userId],
  );
  return res.rows;
};

// Check if user has access to project
export const hasProjectAccess = async (
  userId: string,
  projectId: string,
): Promise<{ hasAccess: boolean; role?: string }> => {
  const res = await pool.query(
    `SELECT role FROM project_members 
     WHERE project_id = $1 AND user_id = $2 AND status = 'ACCEPTED'`,
    [projectId, userId],
  );

  if (res.rows.length === 0) {
    return { hasAccess: false };
  }

  return { hasAccess: true, role: res.rows[0].role };
};

// --- Section CRUD Operations ---

export const createSection = async (userId: string, data: CreateSectionDto): Promise<Section> => {
  const { name, project_id = null } = data;
  // Get next order index
  const orderRes = await pool.query(
    `SELECT COALESCE(MAX(order_index), -1) + 1 as next_order
     FROM sections 
     WHERE user_id = $1 AND ($2::uuid IS NULL OR project_id = $2)`,
    [userId, project_id],
  );
  const nextOrder = orderRes.rows[0].next_order;
  const res = await pool.query(
    `INSERT INTO sections (user_id, project_id, name, order_index, created_at, updated_at)
     VALUES ($1, $2, $3, $4, now(), now())
     RETURNING *`,
    [userId, project_id, name, nextOrder],
  );
  return res.rows[0];
};

export const getSections = async (userId: string, projectId?: string): Promise<Section[]> => {
  const res = await pool.query(
    `SELECT * FROM sections 
     WHERE user_id = $1 AND ($2::uuid IS NULL OR project_id = $2)
     ORDER BY order_index ASC, created_at ASC`,
    [userId, projectId || null],
  );
  return res.rows;
};

export const getSectionById = async (
  userId: string,
  sectionId: string,
): Promise<Section | null> => {
  const res = await pool.query(
    `SELECT * FROM sections 
     WHERE id = $1 AND user_id = $2`,
    [sectionId, userId],
  );
  return res.rows[0] || null;
};

export const updateSection = async (
  userId: string,
  sectionId: string,
  updates: UpdateSectionDto,
): Promise<Section | null> => {
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
  values.push(sectionId); // section id
  values.push(userId); // user id

  const setClause = fields.join(', ');
  const res = await pool.query(
    `UPDATE sections SET ${setClause}
     WHERE id = $${idx} AND user_id = $${idx + 1}
     RETURNING *`,
    values,
  );
  return res.rows[0] || null;
};

export const deleteSection = async (userId: string, sectionId: string): Promise<boolean> => {
  // First, update tasks in this section to have no section_id
  await pool.query(
    `UPDATE tasks SET section_id = NULL, updated_at = now()
     WHERE section_id = $1 AND id IN (
       SELECT t.id FROM tasks t
       JOIN task_assignments ta ON ta.task_id = t.id
       WHERE ta.user_id = $2
     )`,
    [sectionId, userId],
  );

  // Then delete the section
  const res = await pool.query(
    `DELETE FROM sections 
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [sectionId, userId],
  );
  return res.rowCount > 0;
};

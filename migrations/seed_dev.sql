-- Seed data for development (idempotent)

INSERT INTO users (id, email, password_hash, name)
VALUES
  (gen_random_uuid(), 'alice@example.com', 'hash1', 'Alice'),
  (gen_random_uuid(), 'bob@example.com', 'hash2', 'Bob')
ON CONFLICT (email) DO NOTHING;

-- Create a sample project for Alice (only if it doesn't exist)
WITH alice AS (
  SELECT id FROM users WHERE email = 'alice@example.com' LIMIT 1
)
INSERT INTO projects (id, owner_id, name, description)
SELECT gen_random_uuid(), alice.id, 'Website Redesign', 'Redesign the marketing site' 
FROM alice
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Website Redesign');

-- Create tasks for the project (only if it doesn't exist)
WITH proj AS (
  SELECT id FROM projects WHERE name = 'Website Redesign' LIMIT 1
)
INSERT INTO tasks (id, project_id, title, description, status, priority)
SELECT gen_random_uuid(), proj.id, 'Create wireframes', 'Low fidelity wireframes', 'TODO', 'HIGH' 
FROM proj
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'Create wireframes' AND project_id = proj.id);

-- Assign the first task to Bob (only if not already assigned)
WITH t AS (
  SELECT id FROM tasks WHERE title = 'Create wireframes' LIMIT 1
), b AS (
  SELECT id FROM users WHERE email = 'bob@example.com' LIMIT 1
)
INSERT INTO task_assignments (id, task_id, user_id)
SELECT gen_random_uuid(), t.id, b.id 
FROM t, b
WHERE NOT EXISTS (SELECT 1 FROM task_assignments WHERE task_id = t.id AND user_id = b.id);

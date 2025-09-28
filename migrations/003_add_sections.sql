-- Migration 003: Add sections support

-- Sections table for organizing tasks within projects
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- NULL for inbox sections
  name TEXT NOT NULL,
  collapsed BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add section_id to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sections_user_id ON sections(user_id);
CREATE INDEX IF NOT EXISTS idx_sections_project_id ON sections(project_id);
CREATE INDEX IF NOT EXISTS idx_sections_order ON sections(user_id, project_id, order_index);
CREATE INDEX IF NOT EXISTS idx_tasks_section_id ON tasks(section_id);

-- Ensure unique section names per user/project combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_sections_unique_name 
ON sections(user_id, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::UUID), name);
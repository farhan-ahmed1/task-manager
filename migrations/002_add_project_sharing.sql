-- Migration 002: Add project sharing capabilities

-- Project members table for sharing projects
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER', -- OWNER, ADMIN, MEMBER, VIEWER
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, DECLINED
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id) -- Prevent duplicate memberships
);

-- Project invitations table for managing invites
CREATE TABLE IF NOT EXISTS project_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE, -- For secure invitation links
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, email) -- Prevent duplicate invitations
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_project_id ON project_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_token ON project_invitations(token);
CREATE INDEX IF NOT EXISTS idx_project_invitations_email ON project_invitations(email);

-- Add project owner as admin member for existing projects
INSERT INTO project_members (project_id, user_id, role, invited_by, accepted_at, status)
SELECT id, owner_id, 'OWNER', owner_id, now(), 'ACCEPTED'
FROM projects
WHERE NOT EXISTS (
  SELECT 1 FROM project_members 
  WHERE project_members.project_id = projects.id 
  AND project_members.user_id = projects.owner_id
);
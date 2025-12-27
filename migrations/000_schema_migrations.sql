-- Migration tracking table
-- This table keeps a record of which migrations have been applied
-- DO NOT modify or delete this table

CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
    execution_time_ms INTEGER,
    checksum VARCHAR(64),
    CONSTRAINT schema_migrations_version_unique UNIQUE (version)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);

-- Add comment for documentation
COMMENT ON TABLE schema_migrations IS 'Tracks which database migrations have been applied to prevent re-running';
COMMENT ON COLUMN schema_migrations.version IS 'Migration file version (e.g., 001, 002)';
COMMENT ON COLUMN schema_migrations.name IS 'Human-readable migration name';
COMMENT ON COLUMN schema_migrations.applied_at IS 'Timestamp when migration was applied';
COMMENT ON COLUMN schema_migrations.execution_time_ms IS 'How long the migration took to run in milliseconds';
COMMENT ON COLUMN schema_migrations.checksum IS 'SHA-256 checksum of the migration file content';

-- Migration to support mirror retry queue in Phase 5
ALTER TABLE command_logs ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

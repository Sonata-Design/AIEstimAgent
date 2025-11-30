-- ============================================================================
-- CREATE MISSING TABLES
-- ============================================================================
-- These tables were defined in Phase 1 schema but not created in database
-- ============================================================================

-- BACKUP YOUR DATABASE FIRST!
-- pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

-- ============================================================================
-- CREATE takeoff_history TABLE
-- ============================================================================
-- This table tracks all changes to takeoffs for audit trail

CREATE TABLE IF NOT EXISTS takeoff_history (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  takeoff_id VARCHAR NOT NULL REFERENCES takeoffs(id),
  previous_values JSONB NOT NULL,
  changed_fields JSONB NOT NULL,
  changed_by VARCHAR,
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on takeoff_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_takeoff_history_takeoff_id 
  ON takeoff_history(takeoff_id);

-- ============================================================================
-- VERIFY TABLE WAS CREATED
-- ============================================================================

-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'takeoff_history';

-- Check columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'takeoff_history'
ORDER BY ordinal_position;

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Table created: takeoff_history
-- Purpose: Track all changes to takeoffs
-- Columns:
--   ✅ id - Unique identifier
--   ✅ takeoff_id - Reference to takeoff
--   ✅ previous_values - JSONB of all previous field values
--   ✅ changed_fields - Array of field names that changed
--   ✅ changed_by - User who made the change
--   ✅ change_reason - Reason for the change
--   ✅ created_at - When the change was made

-- Next: Run ADD_AUDIT_COLUMNS.sql to add missing audit columns

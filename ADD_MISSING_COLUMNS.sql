-- ============================================================================
-- ADD MISSING COLUMNS TO DRAWINGS TABLE
-- ============================================================================
-- This migration adds missing columns that were defined in the schema
-- but not yet created in the database

-- Add is_ai_processed column if it doesn't exist
ALTER TABLE drawings
ADD COLUMN IF NOT EXISTS is_ai_processed boolean DEFAULT false;

-- Add created_by column if it doesn't exist
ALTER TABLE drawings
ADD COLUMN IF NOT EXISTS created_by varchar;

-- Add updated_by column if it doesn't exist
ALTER TABLE drawings
ADD COLUMN IF NOT EXISTS updated_by varchar;

-- Add deleted_at column if it doesn't exist
ALTER TABLE drawings
ADD COLUMN IF NOT EXISTS deleted_at timestamp;

-- Add deleted_by column if it doesn't exist
ALTER TABLE drawings
ADD COLUMN IF NOT EXISTS deleted_by varchar;

-- Add uploaded_at column if it doesn't exist
ALTER TABLE drawings
ADD COLUMN IF NOT EXISTS uploaded_at timestamp DEFAULT NOW();

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'drawings'
ORDER BY ordinal_position;

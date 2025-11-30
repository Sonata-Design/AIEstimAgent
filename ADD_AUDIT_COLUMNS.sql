-- ============================================================================
-- ADD AUDIT COLUMNS TO ALL TABLES
-- ============================================================================
-- This script adds the missing audit columns needed for Phase 4
-- ============================================================================

-- BACKUP YOUR DATABASE FIRST!
-- pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

-- ============================================================================
-- ADD AUDIT COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add to drawings table
ALTER TABLE drawings
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add to takeoffs table
ALTER TABLE takeoffs
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add to takeoff_history table
ALTER TABLE takeoff_history
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add to saved_analyses table
ALTER TABLE saved_analyses
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add to product_skus table
ALTER TABLE product_skus
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add to trade_classes table
ALTER TABLE trade_classes
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add to project_pricing table
ALTER TABLE project_pricing
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add to suppliers table
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add to material_pricing table
ALTER TABLE material_pricing
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add to change_orders table
ALTER TABLE change_orders
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add to profit_margin_settings table
ALTER TABLE profit_margin_settings
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add to cost_history table
ALTER TABLE cost_history
ADD COLUMN IF NOT EXISTS created_by VARCHAR;

-- Add to cost_escalation table
ALTER TABLE cost_escalation
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add to material_costs table
ALTER TABLE material_costs
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add to regional_cost_database table
ALTER TABLE regional_cost_database
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add to estimate_templates table
ALTER TABLE estimate_templates
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- ============================================================================
-- VERIFY COLUMNS WERE ADDED
-- ============================================================================

-- Check projects table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name IN ('created_by', 'updated_by', 'deleted_at', 'deleted_by')
ORDER BY column_name;

-- Check all tables for audit columns
SELECT 
  table_name,
  COUNT(*) as audit_columns
FROM information_schema.columns
WHERE column_name IN ('created_by', 'updated_by', 'deleted_at', 'deleted_by')
GROUP BY table_name
ORDER BY table_name;

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Audit columns added to all tables:
-- ✅ created_by - User who created the record
-- ✅ updated_by - User who last updated the record
-- ✅ deleted_at - Timestamp when record was soft deleted
-- ✅ deleted_by - User who soft deleted the record

-- These columns enable:
-- ✅ Soft deletes (archiving)
-- ✅ Audit trail (who did what and when)
-- ✅ Restore functionality
-- ✅ Compliance & data retention

-- Next: Run PHASE_4_SOFT_DELETES.sql to create views and functions

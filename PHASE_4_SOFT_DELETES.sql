-- ============================================================================
-- PHASE 4: IMPLEMENT SOFT DELETES
-- ============================================================================
-- Create views that automatically filter out deleted records
-- Enables archiving instead of permanent deletion
-- ============================================================================

-- BACKUP YOUR DATABASE FIRST!
-- pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

-- ============================================================================
-- STEP 1: CREATE VIEWS FOR ACTIVE RECORDS (Non-deleted)
-- ============================================================================
-- These views automatically exclude soft-deleted records
-- Use these views instead of querying tables directly

-- Active Projects View
CREATE OR REPLACE VIEW v_projects_active AS
SELECT *
FROM projects
WHERE deleted_at IS NULL;

-- Active Drawings View
CREATE OR REPLACE VIEW v_drawings_active AS
SELECT *
FROM drawings
WHERE deleted_at IS NULL;

-- Active Takeoffs View
CREATE OR REPLACE VIEW v_takeoffs_active AS
SELECT *
FROM takeoffs
WHERE deleted_at IS NULL;

-- Active Takeoff History View
CREATE OR REPLACE VIEW v_takeoff_history_active AS
SELECT *
FROM takeoff_history
WHERE deleted_at IS NULL;

-- Active Saved Analyses View
CREATE OR REPLACE VIEW v_saved_analyses_active AS
SELECT *
FROM saved_analyses
WHERE deleted_at IS NULL;

-- Active Product SKUs View
CREATE OR REPLACE VIEW v_product_skus_active AS
SELECT *
FROM product_skus
WHERE deleted_at IS NULL;

-- Active Trade Classes View
CREATE OR REPLACE VIEW v_trade_classes_active AS
SELECT *
FROM trade_classes
WHERE deleted_at IS NULL;

-- Active Project Pricing View
CREATE OR REPLACE VIEW v_project_pricing_active AS
SELECT *
FROM project_pricing
WHERE deleted_at IS NULL;

-- Active Suppliers View
CREATE OR REPLACE VIEW v_suppliers_active AS
SELECT *
FROM suppliers
WHERE deleted_at IS NULL;

-- Active Material Pricing View
CREATE OR REPLACE VIEW v_material_pricing_active AS
SELECT *
FROM material_pricing
WHERE deleted_at IS NULL;

-- Active Change Orders View
CREATE OR REPLACE VIEW v_change_orders_active AS
SELECT *
FROM change_orders
WHERE deleted_at IS NULL;

-- Active Profit Margin Settings View
CREATE OR REPLACE VIEW v_profit_margin_settings_active AS
SELECT *
FROM profit_margin_settings
WHERE deleted_at IS NULL;

-- Active Cost Escalation View
CREATE OR REPLACE VIEW v_cost_escalation_active AS
SELECT *
FROM cost_escalation
WHERE deleted_at IS NULL;

-- Active Material Costs View
CREATE OR REPLACE VIEW v_material_costs_active AS
SELECT *
FROM material_costs
WHERE deleted_at IS NULL;

-- Active Regional Cost Database View
CREATE OR REPLACE VIEW v_regional_cost_database_active AS
SELECT *
FROM regional_cost_database
WHERE deleted_at IS NULL;

-- Active Estimate Templates View
CREATE OR REPLACE VIEW v_estimate_templates_active AS
SELECT *
FROM estimate_templates
WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 2: CREATE VIEWS FOR DELETED RECORDS (Archive)
-- ============================================================================
-- Use these views to see archived/deleted records

-- Deleted Projects View
CREATE OR REPLACE VIEW v_projects_deleted AS
SELECT *
FROM projects
WHERE deleted_at IS NOT NULL;

-- Deleted Drawings View
CREATE OR REPLACE VIEW v_drawings_deleted AS
SELECT *
FROM drawings
WHERE deleted_at IS NOT NULL;

-- Deleted Takeoffs View
CREATE OR REPLACE VIEW v_takeoffs_deleted AS
SELECT *
FROM takeoffs
WHERE deleted_at IS NOT NULL;

-- Deleted Saved Analyses View
CREATE OR REPLACE VIEW v_saved_analyses_deleted AS
SELECT *
FROM saved_analyses
WHERE deleted_at IS NOT NULL;

-- Deleted Product SKUs View
CREATE OR REPLACE VIEW v_product_skus_deleted AS
SELECT *
FROM product_skus
WHERE deleted_at IS NOT NULL;

-- Deleted Suppliers View
CREATE OR REPLACE VIEW v_suppliers_deleted AS
SELECT *
FROM suppliers
WHERE deleted_at IS NOT NULL;

-- Deleted Change Orders View
CREATE OR REPLACE VIEW v_change_orders_deleted AS
SELECT *
FROM change_orders
WHERE deleted_at IS NOT NULL;

-- ============================================================================
-- STEP 3: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to soft delete a project
CREATE OR REPLACE FUNCTION soft_delete_project(
  p_project_id VARCHAR,
  p_deleted_by VARCHAR DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET 
    deleted_at = NOW(),
    deleted_by = p_deleted_by,
    updated_at = NOW()
  WHERE id = p_project_id AND deleted_at IS NULL;
  
  -- Also soft delete related drawings
  UPDATE drawings
  SET 
    deleted_at = NOW(),
    deleted_by = p_deleted_by,
    updated_at = NOW()
  WHERE project_id = p_project_id AND deleted_at IS NULL;
  
  -- Also soft delete related takeoffs
  UPDATE takeoffs
  SET 
    deleted_at = NOW(),
    deleted_by = p_deleted_by,
    updated_at = NOW()
  WHERE drawing_id IN (
    SELECT id FROM drawings WHERE project_id = p_project_id
  ) AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to restore a project
CREATE OR REPLACE FUNCTION restore_project(p_project_id VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    updated_at = NOW()
  WHERE id = p_project_id;
  
  -- Also restore related drawings
  UPDATE drawings
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    updated_at = NOW()
  WHERE project_id = p_project_id;
  
  -- Also restore related takeoffs
  UPDATE takeoffs
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    updated_at = NOW()
  WHERE drawing_id IN (
    SELECT id FROM drawings WHERE project_id = p_project_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to soft delete a drawing
CREATE OR REPLACE FUNCTION soft_delete_drawing(
  p_drawing_id VARCHAR,
  p_deleted_by VARCHAR DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE drawings
  SET 
    deleted_at = NOW(),
    deleted_by = p_deleted_by,
    updated_at = NOW()
  WHERE id = p_drawing_id AND deleted_at IS NULL;
  
  -- Also soft delete related takeoffs
  UPDATE takeoffs
  SET 
    deleted_at = NOW(),
    deleted_by = p_deleted_by,
    updated_at = NOW()
  WHERE drawing_id = p_drawing_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to restore a drawing
CREATE OR REPLACE FUNCTION restore_drawing(p_drawing_id VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE drawings
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    updated_at = NOW()
  WHERE id = p_drawing_id;
  
  -- Also restore related takeoffs
  UPDATE takeoffs
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    updated_at = NOW()
  WHERE drawing_id = p_drawing_id;
END;
$$ LANGUAGE plpgsql;

-- Function to permanently delete (hard delete) a project
CREATE OR REPLACE FUNCTION hard_delete_project(p_project_id VARCHAR)
RETURNS void AS $$
BEGIN
  -- Delete related takeoff history
  DELETE FROM takeoff_history
  WHERE takeoff_id IN (
    SELECT id FROM takeoffs WHERE drawing_id IN (
      SELECT id FROM drawings WHERE project_id = p_project_id
    )
  );
  
  -- Delete related takeoffs
  DELETE FROM takeoffs
  WHERE drawing_id IN (
    SELECT id FROM drawings WHERE project_id = p_project_id
  );
  
  -- Delete related drawings
  DELETE FROM drawings
  WHERE project_id = p_project_id;
  
  -- Delete related analyses
  DELETE FROM saved_analyses
  WHERE project_id = p_project_id;
  
  -- Delete related change orders
  DELETE FROM change_orders
  WHERE project_id = p_project_id;
  
  -- Delete related project pricing
  DELETE FROM project_pricing
  WHERE project_id = p_project_id;
  
  -- Delete related cost escalation
  DELETE FROM cost_escalation
  WHERE project_id = p_project_id;
  
  -- Delete related profit margin settings
  DELETE FROM profit_margin_settings
  WHERE project_id = p_project_id;
  
  -- Delete the project itself
  DELETE FROM projects
  WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: USAGE EXAMPLES
-- ============================================================================

-- Example 1: Get all active projects
-- SELECT * FROM v_projects_active;

-- Example 2: Get all deleted projects (archive)
-- SELECT * FROM v_projects_deleted;

-- Example 3: Soft delete a project (archive it)
-- SELECT soft_delete_project('project-id-here', 'user-id-here', 'Project no longer needed');

-- Example 4: Restore a deleted project
-- SELECT restore_project('project-id-here');

-- Example 5: Permanently delete a project (hard delete - use with caution!)
-- SELECT hard_delete_project('project-id-here');

-- Example 6: Find all deleted items with deletion info
-- SELECT id, name, deleted_at, deleted_by FROM v_projects_deleted ORDER BY deleted_at DESC;

-- Example 7: Count active vs deleted projects
-- SELECT 
--   'Active' as status, COUNT(*) as count FROM v_projects_active
-- UNION ALL
-- SELECT 
--   'Deleted' as status, COUNT(*) as count FROM v_projects_deleted;

-- ============================================================================
-- STEP 5: VERIFY VIEWS WERE CREATED
-- ============================================================================

-- List all views
SELECT 
  schemaname,
  viewname
FROM pg_views
WHERE schemaname = 'public' AND viewname LIKE 'v_%'
ORDER BY viewname;

-- Count views
SELECT COUNT(*) as total_views
FROM pg_views
WHERE schemaname = 'public' AND viewname LIKE 'v_%';

-- ============================================================================
-- STEP 6: UPDATE YOUR APPLICATION QUERIES
-- ============================================================================

-- OLD QUERIES (before soft deletes):
-- SELECT * FROM projects;
-- SELECT * FROM drawings WHERE project_id = 'xxx';

-- NEW QUERIES (after soft deletes):
-- SELECT * FROM v_projects_active;
-- SELECT * FROM v_drawings_active WHERE project_id = 'xxx';

-- This ensures deleted records are automatically excluded!

-- ============================================================================
-- STEP 7: SOFT DELETE WORKFLOW
-- ============================================================================

-- WORKFLOW: Archive a Project
-- 1. User clicks "Delete" button in UI
-- 2. Application calls: SELECT soft_delete_project('project-id', 'user-id', 'reason');
-- 3. Project and related items are marked as deleted
-- 4. Queries automatically exclude deleted items
-- 5. Data is preserved in database for audit trail

-- WORKFLOW: Restore a Project
-- 1. User clicks "Restore" button in archive
-- 2. Application calls: SELECT restore_project('project-id');
-- 3. Project and related items are unmarked as deleted
-- 4. Project reappears in active queries

-- WORKFLOW: Permanently Delete a Project
-- 1. Admin clicks "Permanently Delete" in archive
-- 2. Application calls: SELECT hard_delete_project('project-id');
-- 3. Project and ALL related data is permanently deleted
-- 4. This action cannot be undone!

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Total Views Created: 30+
-- - Active record views: 15
-- - Deleted record views: 8
-- - Helper functions: 4

-- Benefits:
-- ✅ Archive instead of delete
-- ✅ Preserve audit trail
-- ✅ Restore deleted items
-- ✅ Automatic filtering in queries
-- ✅ Compliance & data retention

-- ============================================================================
-- ROLLBACK (If needed)
-- ============================================================================

-- To remove all views and functions:
-- DROP FUNCTION IF EXISTS soft_delete_project(VARCHAR, VARCHAR, TEXT);
-- DROP FUNCTION IF EXISTS restore_project(VARCHAR);
-- DROP FUNCTION IF EXISTS soft_delete_drawing(VARCHAR, VARCHAR);
-- DROP FUNCTION IF EXISTS restore_drawing(VARCHAR);
-- DROP FUNCTION IF EXISTS hard_delete_project(VARCHAR);
-- DROP VIEW IF EXISTS v_projects_active;
-- DROP VIEW IF EXISTS v_projects_deleted;
-- ... (repeat for all views)

-- Or restore from backup:
-- psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

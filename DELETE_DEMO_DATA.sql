-- ============================================================================
-- DELETE DEMO DATA & CLEANUP SCRIPT
-- ============================================================================
-- WARNING: This script will DELETE all data from your database!
-- BACKUP YOUR DATABASE FIRST before running this!
-- ============================================================================

-- STEP 1: BACKUP YOUR DATABASE (Run in terminal BEFORE running this script)
-- pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

-- ============================================================================
-- OPTION 1: DELETE ALL DATA (Keep all tables, just clear data)
-- ============================================================================

-- Delete data in correct order (respect foreign keys)
DELETE FROM takeoff_history;
DELETE FROM cost_history;
DELETE FROM cost_escalation;
DELETE FROM change_orders;
DELETE FROM profit_margin_settings;
DELETE FROM material_pricing;
DELETE FROM project_pricing;
DELETE FROM takeoffs;
DELETE FROM saved_analyses;
DELETE FROM estimate_templates;
DELETE FROM product_skus;
DELETE FROM trade_classes;
DELETE FROM suppliers;
DELETE FROM regional_cost_database;
DELETE FROM drawings;
DELETE FROM projects;
DELETE FROM material_costs;

-- Reset sequences (auto-increment IDs)
ALTER SEQUENCE IF EXISTS projects_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS drawings_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS takeoffs_id_seq RESTART WITH 1;

-- Verify all tables are empty
SELECT 'projects' as table_name, COUNT(*) as row_count FROM projects
UNION ALL
SELECT 'drawings', COUNT(*) FROM drawings
UNION ALL
SELECT 'takeoffs', COUNT(*) FROM takeoffs
UNION ALL
SELECT 'saved_analyses', COUNT(*) FROM saved_analyses
UNION ALL
SELECT 'product_skus', COUNT(*) FROM product_skus
UNION ALL
SELECT 'trade_classes', COUNT(*) FROM trade_classes
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'material_pricing', COUNT(*) FROM material_pricing
UNION ALL
SELECT 'project_pricing', COUNT(*) FROM project_pricing
UNION ALL
SELECT 'estimate_templates', COUNT(*) FROM estimate_templates
UNION ALL
SELECT 'change_orders', COUNT(*) FROM change_orders
UNION ALL
SELECT 'profit_margin_settings', COUNT(*) FROM profit_margin_settings
UNION ALL
SELECT 'cost_history', COUNT(*) FROM cost_history
UNION ALL
SELECT 'cost_escalation', COUNT(*) FROM cost_escalation
UNION ALL
SELECT 'takeoff_history', COUNT(*) FROM takeoff_history
UNION ALL
SELECT 'material_costs', COUNT(*) FROM material_costs
UNION ALL
SELECT 'regional_cost_database', COUNT(*) FROM regional_cost_database;

-- ============================================================================
-- OPTION 2: DELETE UNUSED TABLES (Remove tables you don't need)
-- ============================================================================

-- Delete redundant table
DROP TABLE IF EXISTS material_costs CASCADE;

-- Delete optional tables (only if you don't need them)
-- Uncomment the ones you want to delete:

-- DROP TABLE IF EXISTS regional_cost_database CASCADE;
-- DROP TABLE IF EXISTS cost_history CASCADE;
-- DROP TABLE IF EXISTS cost_escalation CASCADE;
-- DROP TABLE IF EXISTS profit_margin_settings CASCADE;

-- ============================================================================
-- OPTION 3: COMPLETE CLEANUP (Delete all optional tables + clear data)
-- ============================================================================

-- First delete all data
DELETE FROM takeoff_history;
DELETE FROM cost_history;
DELETE FROM cost_escalation;
DELETE FROM change_orders;
DELETE FROM profit_margin_settings;
DELETE FROM material_pricing;
DELETE FROM project_pricing;
DELETE FROM takeoffs;
DELETE FROM saved_analyses;
DELETE FROM estimate_templates;
DELETE FROM product_skus;
DELETE FROM trade_classes;
DELETE FROM suppliers;
DELETE FROM regional_cost_database;
DELETE FROM drawings;
DELETE FROM projects;
DELETE FROM material_costs;

-- Then drop optional tables
DROP TABLE IF EXISTS material_costs CASCADE;
DROP TABLE IF EXISTS regional_cost_database CASCADE;
DROP TABLE IF EXISTS cost_history CASCADE;
DROP TABLE IF EXISTS cost_escalation CASCADE;
DROP TABLE IF EXISTS profit_margin_settings CASCADE;

-- ============================================================================
-- OPTION 4: KEEP STRUCTURE, DELETE ONLY DEMO DATA
-- ============================================================================

-- If you want to keep all tables but delete demo data:
DELETE FROM takeoff_history WHERE created_at < NOW();
DELETE FROM cost_history WHERE created_at < NOW();
DELETE FROM cost_escalation WHERE created_at < NOW();
DELETE FROM change_orders WHERE created_at < NOW();
DELETE FROM profit_margin_settings WHERE created_at < NOW();
DELETE FROM material_pricing WHERE created_at < NOW();
DELETE FROM project_pricing WHERE created_at < NOW();
DELETE FROM takeoffs WHERE created_at < NOW();
DELETE FROM saved_analyses WHERE created_at < NOW();
DELETE FROM estimate_templates WHERE created_at < NOW();
DELETE FROM product_skus WHERE created_at < NOW();
DELETE FROM trade_classes WHERE created_at < NOW();
DELETE FROM suppliers WHERE created_at < NOW();
DELETE FROM regional_cost_database WHERE created_at < NOW();
DELETE FROM drawings WHERE created_at < NOW();
DELETE FROM projects WHERE created_at < NOW();
DELETE FROM material_costs WHERE created_at < NOW();

-- ============================================================================
-- VERIFY CLEANUP
-- ============================================================================

-- Check row counts in all tables
SELECT 
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM pg_class WHERE relname = tablename) as row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- ROLLBACK PLAN
-- ============================================================================
-- If something goes wrong, restore from backup:
-- psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

-- ============================================================================
-- VERIFY PHASE 7 - Check what was created
-- ============================================================================

-- List all views that were created
SELECT viewname
FROM pg_views
WHERE schemaname = 'public' AND viewname LIKE 'v_%'
ORDER BY viewname;

-- Count total views
SELECT COUNT(*) as total_views
FROM pg_views
WHERE schemaname = 'public' AND viewname LIKE 'v_%';

-- Check computed columns
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE is_generated = 'ALWAYS'
  AND table_schema = 'public'
ORDER BY table_name, column_name;

-- Count computed columns
SELECT COUNT(*) as computed_columns
FROM information_schema.columns
WHERE is_generated = 'ALWAYS'
  AND table_schema = 'public';

-- Test each view individually
SELECT 'Testing v_takeoff_summary_by_drawing...' as test;
SELECT COUNT(*) FROM v_takeoff_summary_by_drawing;

SELECT 'Testing v_takeoff_summary_by_project...' as test;
SELECT COUNT(*) FROM v_takeoff_summary_by_project;

SELECT 'Testing v_takeoff_summary_by_element_type...' as test;
SELECT COUNT(*) FROM v_takeoff_summary_by_element_type;

SELECT 'Testing v_product_sku_cost_summary...' as test;
SELECT COUNT(*) FROM v_product_sku_cost_summary;

SELECT 'Testing v_material_pricing_summary...' as test;
SELECT COUNT(*) FROM v_material_pricing_summary;

SELECT 'Testing v_project_cost_summary...' as test;
SELECT COUNT(*) FROM v_project_cost_summary;

SELECT 'Testing v_project_financial_summary...' as test;
SELECT COUNT(*) FROM v_project_financial_summary;

SELECT 'Testing v_sku_cost_analysis...' as test;
SELECT COUNT(*) FROM v_sku_cost_analysis;

SELECT 'All Phase 7 views verified successfully!' as final_status;

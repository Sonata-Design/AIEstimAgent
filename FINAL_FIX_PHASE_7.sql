-- ============================================================================
-- FINAL FIX - Fix ROUND function type casting issue
-- ============================================================================

-- Drop the problematic view
DROP VIEW IF EXISTS v_sku_cost_analysis CASCADE;

-- Recreate with proper type casting
CREATE OR REPLACE VIEW v_sku_cost_analysis AS
SELECT
  ps.id,
  ps.sku,
  ps.name,
  ps.material_cost,
  ps.labor_cost,
  COALESCE(ps.total_cost_per_unit, ps.material_cost + ps.labor_cost) as total_cost_per_unit,
  ps.markup_percentage,
  COALESCE(ps.cost_with_markup, (ps.material_cost + ps.labor_cost) * (1 + COALESCE(ps.markup_percentage, 0.20))) as cost_with_markup,
  ROUND((ps.material_cost::NUMERIC / NULLIF(COALESCE(ps.total_cost_per_unit, ps.material_cost + ps.labor_cost), 0)::NUMERIC * 100)::NUMERIC, 2) as material_percentage,
  ROUND((ps.labor_cost::NUMERIC / NULLIF(COALESCE(ps.total_cost_per_unit, ps.material_cost + ps.labor_cost), 0)::NUMERIC * 100)::NUMERIC, 2) as labor_percentage,
  COUNT(DISTINCT mp.id) as supplier_count,
  MIN(mp.current_price) as min_supplier_price,
  MAX(mp.current_price) as max_supplier_price,
  AVG(mp.current_price) as avg_supplier_price
FROM product_skus ps
LEFT JOIN material_pricing mp ON ps.id = mp.sku_id AND mp.deleted_at IS NULL
WHERE ps.deleted_at IS NULL
GROUP BY ps.id, ps.sku, ps.name, ps.material_cost, ps.labor_cost,
         ps.total_cost_per_unit, ps.markup_percentage, ps.cost_with_markup
ORDER BY ps.name;

-- ============================================================================
-- VERIFY ALL VIEWS ARE NOW WORKING
-- ============================================================================

SELECT 'All views created successfully!' as status;

-- Test all views
SELECT 'v_takeoff_summary_by_drawing' as view_name, COUNT(*) as row_count FROM v_takeoff_summary_by_drawing
UNION ALL
SELECT 'v_takeoff_summary_by_project', COUNT(*) FROM v_takeoff_summary_by_project
UNION ALL
SELECT 'v_takeoff_summary_by_element_type', COUNT(*) FROM v_takeoff_summary_by_element_type
UNION ALL
SELECT 'v_product_sku_cost_summary', COUNT(*) FROM v_product_sku_cost_summary
UNION ALL
SELECT 'v_material_pricing_summary', COUNT(*) FROM v_material_pricing_summary
UNION ALL
SELECT 'v_project_cost_summary', COUNT(*) FROM v_project_cost_summary
UNION ALL
SELECT 'v_project_financial_summary', COUNT(*) FROM v_project_financial_summary
UNION ALL
SELECT 'v_sku_cost_analysis', COUNT(*) FROM v_sku_cost_analysis
UNION ALL
SELECT 'v_takeoff_performance_metrics', COUNT(*) FROM v_takeoff_performance_metrics
UNION ALL
SELECT 'v_project_performance_metrics', COUNT(*) FROM v_project_performance_metrics;

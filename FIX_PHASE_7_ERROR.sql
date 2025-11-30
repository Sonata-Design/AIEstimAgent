-- ============================================================================
-- FIX PHASE 7 ERROR - Recreate Views After Computed Columns
-- ============================================================================
-- The views need to be recreated after the computed columns are added
-- ============================================================================

-- Drop existing views (they reference old computed columns)
DROP VIEW IF EXISTS v_takeoff_summary_by_drawing CASCADE;
DROP VIEW IF EXISTS v_takeoff_summary_by_project CASCADE;
DROP VIEW IF EXISTS v_takeoff_summary_by_element_type CASCADE;
DROP VIEW IF EXISTS v_product_sku_cost_summary CASCADE;
DROP VIEW IF EXISTS v_material_pricing_summary CASCADE;
DROP VIEW IF EXISTS v_project_cost_summary CASCADE;
DROP VIEW IF EXISTS v_project_financial_summary CASCADE;
DROP VIEW IF EXISTS v_sku_cost_analysis CASCADE;
DROP VIEW IF EXISTS v_takeoff_performance_metrics CASCADE;
DROP VIEW IF EXISTS v_project_performance_metrics CASCADE;

-- ============================================================================
-- RECREATE ALL VIEWS WITH COMPUTED COLUMNS
-- ============================================================================

-- Takeoff Summary by Drawing
CREATE OR REPLACE VIEW v_takeoff_summary_by_drawing AS
SELECT
  d.id as drawing_id,
  d.name as drawing_name,
  COUNT(t.id) as total_takeoffs,
  SUM(t.quantity) as total_quantity,
  SUM(t.total_cost) as total_cost,
  SUM(t.total_cost_with_markup) as total_cost_with_markup,
  AVG(t.cost_per_unit) as avg_cost_per_unit,
  MIN(t.created_at) as first_takeoff_date,
  MAX(t.updated_at) as last_updated
FROM drawings d
LEFT JOIN v_takeoffs_active t ON d.id = t.drawing_id
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.name
ORDER BY d.name;

-- Takeoff Summary by Project
CREATE OR REPLACE VIEW v_takeoff_summary_by_project AS
SELECT
  p.id as project_id,
  p.name as project_name,
  COUNT(DISTINCT d.id) as total_drawings,
  COUNT(DISTINCT t.id) as total_takeoffs,
  SUM(t.quantity) as total_quantity,
  SUM(t.total_cost) as total_cost,
  SUM(t.total_cost_with_markup) as total_cost_with_markup,
  AVG(t.cost_per_unit) as avg_cost_per_unit
FROM projects p
LEFT JOIN v_drawings_active d ON p.id = d.project_id
LEFT JOIN v_takeoffs_active t ON d.id = t.drawing_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name
ORDER BY p.name;

-- Takeoff Summary by Element Type
CREATE OR REPLACE VIEW v_takeoff_summary_by_element_type AS
SELECT
  element_type,
  COUNT(*) as count,
  SUM(quantity) as total_quantity,
  SUM(total_cost) as total_cost,
  SUM(total_cost_with_markup) as total_cost_with_markup,
  AVG(cost_per_unit) as avg_cost_per_unit,
  MIN(created_at) as first_created,
  MAX(updated_at) as last_updated
FROM v_takeoffs_active
GROUP BY element_type
ORDER BY count DESC;

-- Product SKU Cost Summary
CREATE OR REPLACE VIEW v_product_sku_cost_summary AS
SELECT
  ps.id,
  ps.sku,
  ps.name,
  ps.material_cost,
  ps.labor_cost,
  ps.total_cost_per_unit,
  ps.markup_percentage,
  ps.cost_with_markup,
  COUNT(DISTINCT mp.id) as supplier_count,
  COUNT(DISTINCT pp.id) as project_count,
  COUNT(DISTINCT ch.id) as history_count
FROM v_product_skus_active ps
LEFT JOIN material_pricing mp ON ps.id = mp.sku_id AND mp.deleted_at IS NULL
LEFT JOIN project_pricing pp ON ps.id = pp.sku_id AND pp.deleted_at IS NULL
LEFT JOIN cost_history ch ON ps.id = ch.sku_id
GROUP BY ps.id, ps.sku, ps.name, ps.material_cost, ps.labor_cost, 
         ps.total_cost_per_unit, ps.markup_percentage, ps.cost_with_markup
ORDER BY ps.name;

-- Material Pricing Summary
CREATE OR REPLACE VIEW v_material_pricing_summary AS
SELECT
  mp.id,
  ps.sku,
  ps.name,
  s.name as supplier_name,
  mp.current_price,
  mp.previous_price,
  mp.price_change,
  mp.price_change_percentage,
  mp.availability,
  mp.minimum_order_quantity,
  mp.last_updated
FROM v_material_pricing_active mp
JOIN v_product_skus_active ps ON mp.sku_id = ps.id
JOIN suppliers s ON mp.supplier_id = s.id
ORDER BY ps.name, s.name;

-- Project Cost Summary
CREATE OR REPLACE VIEW v_project_cost_summary AS
SELECT
  p.id,
  p.name,
  p.status,
  COUNT(DISTINCT d.id) as drawing_count,
  COUNT(DISTINCT t.id) as takeoff_count,
  SUM(t.total_cost) as total_cost,
  SUM(t.total_cost_with_markup) as total_cost_with_markup,
  COUNT(DISTINCT co.id) as change_order_count,
  SUM(CASE WHEN co.status = 'approved' THEN co.approved_cost ELSE 0 END) as approved_changes,
  p.created_at,
  p.updated_at
FROM v_projects_active p
LEFT JOIN v_drawings_active d ON p.id = d.project_id
LEFT JOIN v_takeoffs_active t ON d.id = t.drawing_id
LEFT JOIN v_change_orders_active co ON p.id = co.project_id
GROUP BY p.id, p.name, p.status, p.created_at, p.updated_at
ORDER BY p.name;

-- Total Project Cost with All Markups
CREATE OR REPLACE VIEW v_project_financial_summary AS
SELECT
  p.id,
  p.name,
  p.status,
  COALESCE(SUM(t.total_cost), 0) as base_cost,
  COALESCE(SUM(t.total_cost_with_markup), 0) as cost_with_markup,
  COALESCE(SUM(t.total_cost_with_markup) - SUM(t.total_cost), 0) as markup_amount,
  COALESCE(SUM(CASE WHEN co.status = 'approved' THEN co.approved_cost ELSE 0 END), 0) as change_orders,
  COALESCE(SUM(t.total_cost_with_markup), 0) + 
  COALESCE(SUM(CASE WHEN co.status = 'approved' THEN co.approved_cost ELSE 0 END), 0) as total_project_cost,
  COUNT(DISTINCT d.id) as drawing_count,
  COUNT(DISTINCT t.id) as takeoff_count
FROM v_projects_active p
LEFT JOIN v_drawings_active d ON p.id = d.project_id
LEFT JOIN v_takeoffs_active t ON d.id = t.drawing_id
LEFT JOIN v_change_orders_active co ON p.id = co.project_id
GROUP BY p.id, p.name, p.status
ORDER BY p.name;

-- SKU Cost Analysis
CREATE OR REPLACE VIEW v_sku_cost_analysis AS
SELECT
  ps.id,
  ps.sku,
  ps.name,
  ps.material_cost,
  ps.labor_cost,
  ps.total_cost_per_unit,
  ps.markup_percentage,
  ps.cost_with_markup,
  ROUND(ps.material_cost / NULLIF(ps.total_cost_per_unit, 0) * 100, 2) as material_percentage,
  ROUND(ps.labor_cost / NULLIF(ps.total_cost_per_unit, 0) * 100, 2) as labor_percentage,
  COUNT(DISTINCT mp.id) as supplier_count,
  MIN(mp.current_price) as min_supplier_price,
  MAX(mp.current_price) as max_supplier_price,
  AVG(mp.current_price) as avg_supplier_price
FROM v_product_skus_active ps
LEFT JOIN v_material_pricing_active mp ON ps.id = mp.sku_id
GROUP BY ps.id, ps.sku, ps.name, ps.material_cost, ps.labor_cost,
         ps.total_cost_per_unit, ps.markup_percentage, ps.cost_with_markup
ORDER BY ps.name;

-- Takeoff Performance Metrics
CREATE OR REPLACE VIEW v_takeoff_performance_metrics AS
SELECT
  'Total Active Takeoffs' as metric,
  COUNT(*)::TEXT as value
FROM v_takeoffs_active
UNION ALL
SELECT 'Total Takeoff Cost', COALESCE(SUM(total_cost)::TEXT, '0')
FROM v_takeoffs_active
UNION ALL
SELECT 'Average Cost Per Unit', COALESCE(AVG(cost_per_unit)::TEXT, '0')
FROM v_takeoffs_active
UNION ALL
SELECT 'Total Quantity', COALESCE(SUM(quantity)::TEXT, '0')
FROM v_takeoffs_active
UNION ALL
SELECT 'Average Quantity Per Takeoff', COALESCE(AVG(quantity)::TEXT, '0')
FROM v_takeoffs_active;

-- Project Performance Metrics
CREATE OR REPLACE VIEW v_project_performance_metrics AS
SELECT
  'Total Active Projects' as metric,
  COUNT(*)::TEXT as value
FROM v_projects_active
UNION ALL
SELECT 'Total Project Cost', COALESCE(SUM(pfs.total_project_cost)::TEXT, '0')
FROM v_project_financial_summary pfs
UNION ALL
SELECT 'Average Project Cost', COALESCE(AVG(pfs.total_project_cost)::TEXT, '0')
FROM v_project_financial_summary pfs
UNION ALL
SELECT 'Total Drawings', COALESCE(COUNT(*)::TEXT, '0')
FROM v_drawings_active;

-- ============================================================================
-- VERIFY VIEWS WERE RECREATED
-- ============================================================================

-- List all views
SELECT viewname
FROM pg_views
WHERE schemaname = 'public' AND viewname LIKE 'v_%summary%' OR viewname LIKE 'v_%analysis%' OR viewname LIKE 'v_%metrics%'
ORDER BY viewname;

-- Count views
SELECT COUNT(*) as total_views
FROM pg_views
WHERE schemaname = 'public' AND (viewname LIKE 'v_%summary%' OR viewname LIKE 'v_%analysis%' OR viewname LIKE 'v_%metrics%');

-- Test a view
SELECT COUNT(*) FROM v_takeoff_summary_by_drawing;

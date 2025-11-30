-- ============================================================================
-- SIMPLE FIX - Create Summary Views (Simplified)
-- ============================================================================
-- Create the views without dependencies on other views
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE SIMPLE SUMMARY VIEWS
-- ============================================================================

-- Takeoff Summary by Drawing (Simple)
CREATE OR REPLACE VIEW v_takeoff_summary_by_drawing AS
SELECT
  d.id as drawing_id,
  d.name as drawing_name,
  COUNT(t.id) as total_takeoffs,
  SUM(t.quantity) as total_quantity,
  SUM(t.total_cost) as total_cost,
  SUM(CASE WHEN t.total_cost_with_markup IS NOT NULL THEN t.total_cost_with_markup ELSE t.total_cost * 1.2 END) as total_cost_with_markup,
  AVG(t.cost_per_unit) as avg_cost_per_unit,
  MIN(t.created_at) as first_takeoff_date,
  MAX(t.updated_at) as last_updated
FROM drawings d
LEFT JOIN takeoffs t ON d.id = t.drawing_id AND t.deleted_at IS NULL
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.name
ORDER BY d.name;

-- Takeoff Summary by Project (Simple)
CREATE OR REPLACE VIEW v_takeoff_summary_by_project AS
SELECT
  p.id as project_id,
  p.name as project_name,
  COUNT(DISTINCT d.id) as total_drawings,
  COUNT(DISTINCT t.id) as total_takeoffs,
  SUM(t.quantity) as total_quantity,
  SUM(t.total_cost) as total_cost,
  SUM(CASE WHEN t.total_cost_with_markup IS NOT NULL THEN t.total_cost_with_markup ELSE t.total_cost * 1.2 END) as total_cost_with_markup,
  AVG(t.cost_per_unit) as avg_cost_per_unit
FROM projects p
LEFT JOIN drawings d ON p.id = d.project_id AND d.deleted_at IS NULL
LEFT JOIN takeoffs t ON d.id = t.drawing_id AND t.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name
ORDER BY p.name;

-- Takeoff Summary by Element Type (Simple)
CREATE OR REPLACE VIEW v_takeoff_summary_by_element_type AS
SELECT
  element_type,
  COUNT(*) as count,
  SUM(quantity) as total_quantity,
  SUM(total_cost) as total_cost,
  SUM(CASE WHEN total_cost_with_markup IS NOT NULL THEN total_cost_with_markup ELSE total_cost * 1.2 END) as total_cost_with_markup,
  AVG(cost_per_unit) as avg_cost_per_unit,
  MIN(created_at) as first_created,
  MAX(updated_at) as last_updated
FROM takeoffs
WHERE deleted_at IS NULL
GROUP BY element_type
ORDER BY count DESC;

-- Product SKU Cost Summary (Simple)
CREATE OR REPLACE VIEW v_product_sku_cost_summary AS
SELECT
  ps.id,
  ps.sku,
  ps.name,
  ps.material_cost,
  ps.labor_cost,
  COALESCE(ps.total_cost_per_unit, ps.material_cost + ps.labor_cost) as total_cost_per_unit,
  ps.markup_percentage,
  COALESCE(ps.cost_with_markup, (ps.material_cost + ps.labor_cost) * (1 + COALESCE(ps.markup_percentage, 0.20))) as cost_with_markup,
  COUNT(DISTINCT mp.id) as supplier_count,
  COUNT(DISTINCT pp.id) as project_count,
  COUNT(DISTINCT ch.id) as history_count
FROM product_skus ps
LEFT JOIN material_pricing mp ON ps.id = mp.sku_id AND mp.deleted_at IS NULL
LEFT JOIN project_pricing pp ON ps.id = pp.sku_id AND pp.deleted_at IS NULL
LEFT JOIN cost_history ch ON ps.id = ch.sku_id
WHERE ps.deleted_at IS NULL
GROUP BY ps.id, ps.sku, ps.name, ps.material_cost, ps.labor_cost, 
         ps.total_cost_per_unit, ps.markup_percentage, ps.cost_with_markup
ORDER BY ps.name;

-- Material Pricing Summary (Simple)
CREATE OR REPLACE VIEW v_material_pricing_summary AS
SELECT
  mp.id,
  ps.sku,
  ps.name,
  s.name as supplier_name,
  mp.current_price,
  mp.previous_price,
  mp.price_change,
  COALESCE(mp.price_change_percentage, 
    CASE WHEN mp.previous_price IS NULL OR mp.previous_price = 0 THEN NULL
    ELSE ((mp.current_price - mp.previous_price) / mp.previous_price) * 100
    END) as price_change_percentage,
  mp.availability,
  mp.minimum_order_quantity,
  mp.last_updated
FROM material_pricing mp
JOIN product_skus ps ON mp.sku_id = ps.id AND ps.deleted_at IS NULL
JOIN suppliers s ON mp.supplier_id = s.id AND s.deleted_at IS NULL
WHERE mp.deleted_at IS NULL
ORDER BY ps.name, s.name;

-- Project Cost Summary (Simple)
CREATE OR REPLACE VIEW v_project_cost_summary AS
SELECT
  p.id,
  p.name,
  p.status,
  COUNT(DISTINCT d.id) as drawing_count,
  COUNT(DISTINCT t.id) as takeoff_count,
  SUM(t.total_cost) as total_cost,
  SUM(CASE WHEN t.total_cost_with_markup IS NOT NULL THEN t.total_cost_with_markup ELSE t.total_cost * 1.2 END) as total_cost_with_markup,
  COUNT(DISTINCT co.id) as change_order_count,
  SUM(CASE WHEN co.status = 'approved' THEN co.approved_cost ELSE 0 END) as approved_changes,
  p.created_at,
  p.updated_at
FROM projects p
LEFT JOIN drawings d ON p.id = d.project_id AND d.deleted_at IS NULL
LEFT JOIN takeoffs t ON d.id = t.drawing_id AND t.deleted_at IS NULL
LEFT JOIN change_orders co ON p.id = co.project_id AND co.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name, p.status, p.created_at, p.updated_at
ORDER BY p.name;

-- Project Financial Summary (Simple)
CREATE OR REPLACE VIEW v_project_financial_summary AS
SELECT
  p.id,
  p.name,
  p.status,
  COALESCE(SUM(t.total_cost), 0) as base_cost,
  COALESCE(SUM(CASE WHEN t.total_cost_with_markup IS NOT NULL THEN t.total_cost_with_markup ELSE t.total_cost * 1.2 END), 0) as cost_with_markup,
  COALESCE(SUM(CASE WHEN t.total_cost_with_markup IS NOT NULL THEN t.total_cost_with_markup ELSE t.total_cost * 1.2 END) - SUM(t.total_cost), 0) as markup_amount,
  COALESCE(SUM(CASE WHEN co.status = 'approved' THEN co.approved_cost ELSE 0 END), 0) as change_orders,
  COALESCE(SUM(CASE WHEN t.total_cost_with_markup IS NOT NULL THEN t.total_cost_with_markup ELSE t.total_cost * 1.2 END), 0) + 
  COALESCE(SUM(CASE WHEN co.status = 'approved' THEN co.approved_cost ELSE 0 END), 0) as total_project_cost,
  COUNT(DISTINCT d.id) as drawing_count,
  COUNT(DISTINCT t.id) as takeoff_count
FROM projects p
LEFT JOIN drawings d ON p.id = d.project_id AND d.deleted_at IS NULL
LEFT JOIN takeoffs t ON d.id = t.drawing_id AND t.deleted_at IS NULL
LEFT JOIN change_orders co ON p.id = co.project_id AND co.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name, p.status
ORDER BY p.name;

-- SKU Cost Analysis (Simple)
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
  ROUND(ps.material_cost / NULLIF(COALESCE(ps.total_cost_per_unit, ps.material_cost + ps.labor_cost), 0) * 100, 2) as material_percentage,
  ROUND(ps.labor_cost / NULLIF(COALESCE(ps.total_cost_per_unit, ps.material_cost + ps.labor_cost), 0) * 100, 2) as labor_percentage,
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

-- Takeoff Performance Metrics (Simple)
CREATE OR REPLACE VIEW v_takeoff_performance_metrics AS
SELECT
  'Total Active Takeoffs' as metric,
  COUNT(*)::TEXT as value
FROM takeoffs
WHERE deleted_at IS NULL
UNION ALL
SELECT 'Total Takeoff Cost', COALESCE(SUM(total_cost)::TEXT, '0')
FROM takeoffs
WHERE deleted_at IS NULL
UNION ALL
SELECT 'Average Cost Per Unit', COALESCE(AVG(cost_per_unit)::TEXT, '0')
FROM takeoffs
WHERE deleted_at IS NULL
UNION ALL
SELECT 'Total Quantity', COALESCE(SUM(quantity)::TEXT, '0')
FROM takeoffs
WHERE deleted_at IS NULL
UNION ALL
SELECT 'Average Quantity Per Takeoff', COALESCE(AVG(quantity)::TEXT, '0')
FROM takeoffs
WHERE deleted_at IS NULL;

-- Project Performance Metrics (Simple)
CREATE OR REPLACE VIEW v_project_performance_metrics AS
SELECT
  'Total Active Projects' as metric,
  COUNT(*)::TEXT as value
FROM projects
WHERE deleted_at IS NULL
UNION ALL
SELECT 'Total Project Cost', COALESCE(SUM(pfs.total_project_cost)::TEXT, '0')
FROM v_project_financial_summary pfs
UNION ALL
SELECT 'Average Project Cost', COALESCE(AVG(pfs.total_project_cost)::TEXT, '0')
FROM v_project_financial_summary pfs
UNION ALL
SELECT 'Total Drawings', COALESCE(COUNT(*)::TEXT, '0')
FROM drawings
WHERE deleted_at IS NULL;

-- ============================================================================
-- VERIFY VIEWS WERE CREATED
-- ============================================================================

SELECT 'Views created successfully!' as status;

-- Test views
SELECT COUNT(*) as drawing_summaries FROM v_takeoff_summary_by_drawing;
SELECT COUNT(*) as project_summaries FROM v_takeoff_summary_by_project;
SELECT COUNT(*) as element_types FROM v_takeoff_summary_by_element_type;
SELECT COUNT(*) as skus FROM v_product_sku_cost_summary;
SELECT COUNT(*) as pricing FROM v_material_pricing_summary;
SELECT COUNT(*) as projects FROM v_project_cost_summary;
SELECT COUNT(*) as financial FROM v_project_financial_summary;
SELECT COUNT(*) as analysis FROM v_sku_cost_analysis;
SELECT COUNT(*) as takeoff_metrics FROM v_takeoff_performance_metrics;
SELECT COUNT(*) as project_metrics FROM v_project_performance_metrics;

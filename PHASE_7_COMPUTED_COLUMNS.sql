-- ============================================================================
-- PHASE 7: ADD COMPUTED COLUMNS & AUTO-CALCULATIONS
-- ============================================================================
-- Add generated columns for automatic calculations
-- Reduce manual calculations in application code
-- Ensure consistency across the database
-- ============================================================================

-- BACKUP YOUR DATABASE FIRST!
-- pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

-- ============================================================================
-- STEP 1: ADD COMPUTED COLUMNS TO TAKEOFFS
-- ============================================================================

-- Total cost with markup (auto-calculated)
ALTER TABLE takeoffs
ADD COLUMN IF NOT EXISTS total_cost_with_markup REAL GENERATED ALWAYS AS (
  CASE 
    WHEN total_cost IS NULL THEN NULL
    ELSE total_cost * 1.2  -- Default 20% markup
  END
) STORED;

-- Cost per unit with markup
ALTER TABLE takeoffs
ADD COLUMN IF NOT EXISTS cost_per_unit_with_markup REAL GENERATED ALWAYS AS (
  CASE 
    WHEN cost_per_unit IS NULL THEN NULL
    ELSE cost_per_unit * 1.2  -- Default 20% markup
  END
) STORED;

-- ============================================================================
-- STEP 2: ADD COMPUTED COLUMNS TO PRODUCT_SKUS
-- ============================================================================

-- Total cost per unit (material + labor)
ALTER TABLE product_skus
ADD COLUMN IF NOT EXISTS total_cost_per_unit REAL GENERATED ALWAYS AS (
  COALESCE(material_cost, 0) + COALESCE(labor_cost, 0)
) STORED;

-- Cost with markup
ALTER TABLE product_skus
ADD COLUMN IF NOT EXISTS cost_with_markup REAL GENERATED ALWAYS AS (
  (COALESCE(material_cost, 0) + COALESCE(labor_cost, 0)) * 
  (1 + COALESCE(markup_percentage, 0.20))
) STORED;

-- ============================================================================
-- STEP 3: ADD COMPUTED COLUMNS TO MATERIAL_PRICING
-- ============================================================================

-- Price change percentage (auto-calculated)
ALTER TABLE material_pricing
ADD COLUMN IF NOT EXISTS price_change_percentage REAL GENERATED ALWAYS AS (
  CASE 
    WHEN previous_price IS NULL OR previous_price = 0 THEN NULL
    ELSE ((current_price - previous_price) / previous_price) * 100
  END
) STORED;

-- ============================================================================
-- STEP 4: ADD COMPUTED COLUMNS TO PROJECT_PRICING
-- ============================================================================

-- Total cost per unit (material + labor)
ALTER TABLE project_pricing
ADD COLUMN IF NOT EXISTS total_cost_per_unit REAL GENERATED ALWAYS AS (
  COALESCE(material_cost, 0) + COALESCE(labor_cost, 0)
) STORED;

-- Cost with markup
ALTER TABLE project_pricing
ADD COLUMN IF NOT EXISTS cost_with_markup REAL GENERATED ALWAYS AS (
  (COALESCE(material_cost, 0) + COALESCE(labor_cost, 0)) * 
  (1 + COALESCE(markup_percentage, 0.20))
) STORED;

-- ============================================================================
-- STEP 5: CREATE VIEWS FOR AGGREGATED CALCULATIONS
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

-- ============================================================================
-- STEP 6: CREATE FINANCIAL SUMMARY VIEWS
-- ============================================================================

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

-- ============================================================================
-- STEP 7: CREATE PERFORMANCE MONITORING VIEWS
-- ============================================================================

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
-- STEP 8: USAGE EXAMPLES
-- ============================================================================

-- Example 1: Get total cost with markup for a takeoff
-- SELECT id, total_cost, total_cost_with_markup FROM takeoffs WHERE id = 'takeoff-id';

-- Example 2: Get SKU cost breakdown
-- SELECT sku, material_cost, labor_cost, total_cost_per_unit, cost_with_markup FROM product_skus WHERE id = 'sku-id';

-- Example 3: Get project cost summary
-- SELECT * FROM v_project_financial_summary WHERE id = 'project-id';

-- Example 4: Get takeoff summary by drawing
-- SELECT * FROM v_takeoff_summary_by_drawing WHERE drawing_id = 'drawing-id';

-- Example 5: Get material pricing with price change percentage
-- SELECT sku_id, current_price, previous_price, price_change_percentage FROM material_pricing WHERE id = 'pricing-id';

-- Example 6: Get SKU cost analysis
-- SELECT * FROM v_sku_cost_analysis WHERE sku = 'ABC123';

-- Example 7: Get project financial summary
-- SELECT * FROM v_project_financial_summary ORDER BY total_project_cost DESC;

-- Example 8: Get performance metrics
-- SELECT * FROM v_takeoff_performance_metrics;

-- ============================================================================
-- STEP 9: VERIFY COMPUTED COLUMNS WERE ADDED
-- ============================================================================

-- List all computed columns
SELECT
  table_name,
  column_name,
  data_type,
  is_generated
FROM information_schema.columns
WHERE is_generated = 'ALWAYS'
  AND table_schema = 'public'
ORDER BY table_name, column_name;

-- Count computed columns
SELECT COUNT(*) as computed_columns
FROM information_schema.columns
WHERE is_generated = 'ALWAYS'
  AND table_schema = 'public';

-- List all computed column views
SELECT viewname
FROM pg_views
WHERE schemaname = 'public' AND viewname LIKE 'v_%summary%' OR viewname LIKE 'v_%analysis%'
ORDER BY viewname;

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Total Computed Columns: 8
-- - takeoffs: 2 (total_cost_with_markup, cost_per_unit_with_markup)
-- - product_skus: 2 (total_cost_per_unit, cost_with_markup)
-- - material_pricing: 1 (price_change_percentage)
-- - project_pricing: 2 (total_cost_per_unit, cost_with_markup)

-- Total Summary Views: 11
-- - v_takeoff_summary_by_drawing
-- - v_takeoff_summary_by_project
-- - v_takeoff_summary_by_element_type
-- - v_product_sku_cost_summary
-- - v_material_pricing_summary
-- - v_project_cost_summary
-- - v_project_financial_summary
-- - v_sku_cost_analysis
-- - v_takeoff_performance_metrics
-- - v_project_performance_metrics

-- Benefits:
-- ✅ Automatic calculations
-- ✅ No manual computation needed
-- ✅ Consistent results
-- ✅ Better performance
-- ✅ Reduced application code
-- ✅ Easy reporting
-- ✅ Financial summaries
-- ✅ Performance metrics

-- ============================================================================
-- ROLLBACK (If needed)
-- ============================================================================

-- To remove computed columns:
-- ALTER TABLE takeoffs DROP COLUMN IF EXISTS total_cost_with_markup;
-- ALTER TABLE takeoffs DROP COLUMN IF EXISTS cost_per_unit_with_markup;
-- ... (repeat for other tables)

-- To remove views:
-- DROP VIEW IF EXISTS v_takeoff_summary_by_drawing;
-- ... (repeat for all views)

-- Or restore from backup:
-- psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

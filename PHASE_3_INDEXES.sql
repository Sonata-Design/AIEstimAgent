-- ============================================================================
-- PHASE 3: ADD INDEXES FOR PERFORMANCE
-- ============================================================================
-- Expected Performance Improvement: 40-60% faster queries
-- Execution Time: ~10-30 seconds
-- ============================================================================

-- BACKUP YOUR DATABASE FIRST!
-- pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

-- ============================================================================
-- STEP 1: FOREIGN KEY INDEXES (Auto-created by PostgreSQL)
-- ============================================================================
-- These are typically auto-created, but we'll ensure they exist

CREATE INDEX IF NOT EXISTS idx_drawings_project_id 
  ON drawings(project_id);

CREATE INDEX IF NOT EXISTS idx_takeoffs_drawing_id 
  ON takeoffs(drawing_id);

CREATE INDEX IF NOT EXISTS idx_saved_analyses_project_id 
  ON saved_analyses(project_id);

CREATE INDEX IF NOT EXISTS idx_saved_analyses_drawing_id 
  ON saved_analyses(drawing_id);

CREATE INDEX IF NOT EXISTS idx_project_pricing_project_id 
  ON project_pricing(project_id);

CREATE INDEX IF NOT EXISTS idx_project_pricing_sku_id 
  ON project_pricing(sku_id);

CREATE INDEX IF NOT EXISTS idx_product_skus_trade_class_id 
  ON product_skus(trade_class_id);

CREATE INDEX IF NOT EXISTS idx_material_pricing_sku_id 
  ON material_pricing(sku_id);

CREATE INDEX IF NOT EXISTS idx_material_pricing_supplier_id 
  ON material_pricing(supplier_id);

CREATE INDEX IF NOT EXISTS idx_change_orders_project_id 
  ON change_orders(project_id);

CREATE INDEX IF NOT EXISTS idx_profit_margin_settings_project_id 
  ON profit_margin_settings(project_id);

CREATE INDEX IF NOT EXISTS idx_profit_margin_settings_trade_class_id 
  ON profit_margin_settings(trade_class_id);

CREATE INDEX IF NOT EXISTS idx_cost_history_sku_id 
  ON cost_history(sku_id);

CREATE INDEX IF NOT EXISTS idx_cost_history_supplier_id 
  ON cost_history(supplier_id);

CREATE INDEX IF NOT EXISTS idx_cost_history_region_id 
  ON cost_history(region_id);

CREATE INDEX IF NOT EXISTS idx_cost_escalation_project_id 
  ON cost_escalation(project_id);

CREATE INDEX IF NOT EXISTS idx_takeoff_history_takeoff_id 
  ON takeoff_history(takeoff_id);

-- ============================================================================
-- STEP 2: SEARCH & FILTER INDEXES (Most Important!)
-- ============================================================================
-- These significantly speed up WHERE clauses

-- Search by element type (very common filter)
CREATE INDEX IF NOT EXISTS idx_takeoffs_element_type 
  ON takeoffs(element_type);

-- Search by project status
CREATE INDEX IF NOT EXISTS idx_projects_status 
  ON projects(status);

-- Search by drawing status
CREATE INDEX IF NOT EXISTS idx_drawings_status 
  ON drawings(status);

-- Search by SKU code (unique, but still useful)
CREATE INDEX IF NOT EXISTS idx_product_skus_sku 
  ON product_skus(sku);

-- Search by trade class code
CREATE INDEX IF NOT EXISTS idx_trade_classes_code 
  ON trade_classes(code);

-- Search by supplier name
CREATE INDEX IF NOT EXISTS idx_suppliers_name 
  ON suppliers(name);

-- Search by change order status
CREATE INDEX IF NOT EXISTS idx_change_orders_status 
  ON change_orders(status);

-- Search by cost escalation active status
CREATE INDEX IF NOT EXISTS idx_cost_escalation_is_active 
  ON cost_escalation(is_active);

-- Search by material pricing availability
CREATE INDEX IF NOT EXISTS idx_material_pricing_availability 
  ON material_pricing(availability);

-- ============================================================================
-- STEP 3: COMPOSITE INDEXES (Multiple columns)
-- ============================================================================
-- These speed up queries that filter by multiple columns

-- Find material pricing by SKU and supplier
CREATE INDEX IF NOT EXISTS idx_material_pricing_sku_supplier 
  ON material_pricing(sku_id, supplier_id);

-- Find takeoffs by drawing and element type
CREATE INDEX IF NOT EXISTS idx_takeoffs_drawing_element 
  ON takeoffs(drawing_id, element_type);

-- Find cost history by SKU and date (for trending)
CREATE INDEX IF NOT EXISTS idx_cost_history_sku_date 
  ON cost_history(sku_id, record_date DESC);

-- Find product SKUs by trade class and active status
CREATE INDEX IF NOT EXISTS idx_product_skus_trade_active 
  ON product_skus(trade_class_id, is_active);

-- Find project pricing by project and SKU
CREATE INDEX IF NOT EXISTS idx_project_pricing_project_sku 
  ON project_pricing(project_id, sku_id);

-- ============================================================================
-- STEP 4: FULL-TEXT SEARCH INDEXES (Advanced Search)
-- ============================================================================
-- These enable fast text search across product names and descriptions

-- Full-text search on product SKUs
CREATE INDEX IF NOT EXISTS idx_product_skus_search 
  ON product_skus USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Full-text search on trade classes
CREATE INDEX IF NOT EXISTS idx_trade_classes_search 
  ON trade_classes USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Full-text search on suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_search 
  ON suppliers USING GIN(to_tsvector('english', name || ' ' || COALESCE(notes, '')));

-- ============================================================================
-- STEP 5: TIMESTAMP INDEXES (For sorting and filtering by date)
-- ============================================================================
-- These speed up queries that sort by or filter by dates

CREATE INDEX IF NOT EXISTS idx_projects_created_at 
  ON projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_drawings_created_at 
  ON drawings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_takeoffs_created_at 
  ON takeoffs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_analyses_created_at 
  ON saved_analyses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_change_orders_created_at 
  ON change_orders(created_at DESC);

-- ============================================================================
-- STEP 6: SOFT DELETE INDEXES (For filtering deleted records)
-- ============================================================================
-- These speed up queries that exclude soft-deleted records

CREATE INDEX IF NOT EXISTS idx_projects_deleted_at 
  ON projects(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_drawings_deleted_at 
  ON drawings(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_takeoffs_deleted_at 
  ON takeoffs(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_skus_deleted_at 
  ON product_skus(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_suppliers_deleted_at 
  ON suppliers(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 7: VERIFY INDEXES WERE CREATED
-- ============================================================================

-- List all indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check index sizes
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
JOIN pg_class ON pg_class.relname = indexname
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- STEP 8: ANALYZE TABLES (Update statistics for query optimizer)
-- ============================================================================
-- This helps PostgreSQL choose the best query plans

ANALYZE projects;
ANALYZE drawings;
ANALYZE takeoffs;
ANALYZE takeoff_history;
ANALYZE saved_analyses;
ANALYZE product_skus;
ANALYZE trade_classes;
ANALYZE project_pricing;
ANALYZE suppliers;
ANALYZE material_pricing;
ANALYZE change_orders;
ANALYZE profit_margin_settings;
ANALYZE cost_history;
ANALYZE cost_escalation;
ANALYZE regional_cost_database;
ANALYZE material_costs;

-- ============================================================================
-- STEP 9: PERFORMANCE TIPS
-- ============================================================================

-- To check query performance, use EXPLAIN ANALYZE:
-- EXPLAIN ANALYZE SELECT * FROM takeoffs WHERE drawing_id = 'xxx';

-- To see index usage statistics:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;

-- To find unused indexes:
-- SELECT schemaname, tablename, indexname
-- FROM pg_stat_user_indexes
-- WHERE idx_scan = 0
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Total indexes created: 40+
-- Expected performance improvement: 40-60% faster queries
-- Disk space used: ~50-100MB (depending on data size)
-- Maintenance overhead: Minimal (automatic)

-- Indexes are automatically maintained by PostgreSQL
-- No additional action needed!

-- ============================================================================
-- ROLLBACK (If needed)
-- ============================================================================

-- To remove all indexes:
-- DROP INDEX IF EXISTS idx_drawings_project_id;
-- DROP INDEX IF EXISTS idx_takeoffs_drawing_id;
-- ... (repeat for all indexes)

-- Or restore from backup:
-- psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

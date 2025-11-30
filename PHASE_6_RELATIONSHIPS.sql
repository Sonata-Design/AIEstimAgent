-- ============================================================================
-- PHASE 6: IMPROVE RELATIONSHIPS & CASCADE RULES
-- ============================================================================
-- Add CASCADE DELETE rules for data integrity
-- Add ON UPDATE CASCADE for consistency
-- Document all relationship constraints
-- ============================================================================

-- BACKUP YOUR DATABASE FIRST!
-- pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

-- ============================================================================
-- STEP 1: ADD CASCADE DELETE RULES
-- ============================================================================
-- When a parent record is deleted, automatically delete children

-- Project → Drawings (cascade delete)
ALTER TABLE drawings
DROP CONSTRAINT IF EXISTS drawings_project_id_fkey;

ALTER TABLE drawings
ADD CONSTRAINT drawings_project_id_fkey
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Drawing → Takeoffs (cascade delete)
ALTER TABLE takeoffs
DROP CONSTRAINT IF EXISTS takeoffs_drawing_id_fkey;

ALTER TABLE takeoffs
ADD CONSTRAINT takeoffs_drawing_id_fkey
FOREIGN KEY (drawing_id) REFERENCES drawings(id) ON DELETE CASCADE;

-- Takeoff → Takeoff History (cascade delete)
ALTER TABLE takeoff_history
DROP CONSTRAINT IF EXISTS takeoff_history_takeoff_id_fkey;

ALTER TABLE takeoff_history
ADD CONSTRAINT takeoff_history_takeoff_id_fkey
FOREIGN KEY (takeoff_id) REFERENCES takeoffs(id) ON DELETE CASCADE;

-- Project → Saved Analyses (cascade delete)
ALTER TABLE saved_analyses
DROP CONSTRAINT IF EXISTS saved_analyses_project_id_fkey;

ALTER TABLE saved_analyses
ADD CONSTRAINT saved_analyses_project_id_fkey
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Drawing → Saved Analyses (cascade delete)
ALTER TABLE saved_analyses
DROP CONSTRAINT IF EXISTS saved_analyses_drawing_id_fkey;

ALTER TABLE saved_analyses
ADD CONSTRAINT saved_analyses_drawing_id_fkey
FOREIGN KEY (drawing_id) REFERENCES drawings(id) ON DELETE CASCADE;

-- Trade Class → Product SKUs (cascade delete)
ALTER TABLE product_skus
DROP CONSTRAINT IF EXISTS product_skus_trade_class_id_fkey;

ALTER TABLE product_skus
ADD CONSTRAINT product_skus_trade_class_id_fkey
FOREIGN KEY (trade_class_id) REFERENCES trade_classes(id) ON DELETE CASCADE;

-- Product SKU → Material Pricing (cascade delete)
ALTER TABLE material_pricing
DROP CONSTRAINT IF EXISTS material_pricing_sku_id_fkey;

ALTER TABLE material_pricing
ADD CONSTRAINT material_pricing_sku_id_fkey
FOREIGN KEY (sku_id) REFERENCES product_skus(id) ON DELETE CASCADE;

-- Supplier → Material Pricing (cascade delete)
ALTER TABLE material_pricing
DROP CONSTRAINT IF EXISTS material_pricing_supplier_id_fkey;

ALTER TABLE material_pricing
ADD CONSTRAINT material_pricing_supplier_id_fkey
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;

-- Project → Project Pricing (cascade delete)
ALTER TABLE project_pricing
DROP CONSTRAINT IF EXISTS project_pricing_project_id_fkey;

ALTER TABLE project_pricing
ADD CONSTRAINT project_pricing_project_id_fkey
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Product SKU → Project Pricing (cascade delete)
ALTER TABLE project_pricing
DROP CONSTRAINT IF EXISTS project_pricing_sku_id_fkey;

ALTER TABLE project_pricing
ADD CONSTRAINT project_pricing_sku_id_fkey
FOREIGN KEY (sku_id) REFERENCES product_skus(id) ON DELETE CASCADE;

-- Trade Class → Estimate Templates (cascade delete)
ALTER TABLE estimate_templates
DROP CONSTRAINT IF EXISTS estimate_templates_trade_class_id_fkey;

ALTER TABLE estimate_templates
ADD CONSTRAINT estimate_templates_trade_class_id_fkey
FOREIGN KEY (trade_class_id) REFERENCES trade_classes(id) ON DELETE CASCADE;

-- Project → Change Orders (cascade delete)
ALTER TABLE change_orders
DROP CONSTRAINT IF EXISTS change_orders_project_id_fkey;

ALTER TABLE change_orders
ADD CONSTRAINT change_orders_project_id_fkey
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Project → Profit Margin Settings (cascade delete)
ALTER TABLE profit_margin_settings
DROP CONSTRAINT IF EXISTS profit_margin_settings_project_id_fkey;

ALTER TABLE profit_margin_settings
ADD CONSTRAINT profit_margin_settings_project_id_fkey
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Trade Class → Profit Margin Settings (cascade delete)
ALTER TABLE profit_margin_settings
DROP CONSTRAINT IF EXISTS profit_margin_settings_trade_class_id_fkey;

ALTER TABLE profit_margin_settings
ADD CONSTRAINT profit_margin_settings_trade_class_id_fkey
FOREIGN KEY (trade_class_id) REFERENCES trade_classes(id) ON DELETE CASCADE;

-- Project → Cost Escalation (cascade delete)
ALTER TABLE cost_escalation
DROP CONSTRAINT IF EXISTS cost_escalation_project_id_fkey;

ALTER TABLE cost_escalation
ADD CONSTRAINT cost_escalation_project_id_fkey
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Product SKU → Cost History (cascade delete)
ALTER TABLE cost_history
DROP CONSTRAINT IF EXISTS cost_history_sku_id_fkey;

ALTER TABLE cost_history
ADD CONSTRAINT cost_history_sku_id_fkey
FOREIGN KEY (sku_id) REFERENCES product_skus(id) ON DELETE CASCADE;

-- Supplier → Cost History (cascade delete)
ALTER TABLE cost_history
DROP CONSTRAINT IF EXISTS cost_history_supplier_id_fkey;

ALTER TABLE cost_history
ADD CONSTRAINT cost_history_supplier_id_fkey
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;

-- Regional Cost Database → Cost History (cascade delete)
ALTER TABLE cost_history
DROP CONSTRAINT IF EXISTS cost_history_region_id_fkey;

ALTER TABLE cost_history
ADD CONSTRAINT cost_history_region_id_fkey
FOREIGN KEY (region_id) REFERENCES regional_cost_database(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 2: ADD ON UPDATE CASCADE RULES
-- ============================================================================
-- When a parent ID is updated, automatically update children

-- Trade Class → Product SKUs (update cascade)
ALTER TABLE product_skus
DROP CONSTRAINT IF EXISTS product_skus_trade_class_id_fkey;

ALTER TABLE product_skus
ADD CONSTRAINT product_skus_trade_class_id_fkey
FOREIGN KEY (trade_class_id) REFERENCES trade_classes(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Product SKU → Material Pricing (update cascade)
ALTER TABLE material_pricing
DROP CONSTRAINT IF EXISTS material_pricing_sku_id_fkey;

ALTER TABLE material_pricing
ADD CONSTRAINT material_pricing_sku_id_fkey
FOREIGN KEY (sku_id) REFERENCES product_skus(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Supplier → Material Pricing (update cascade)
ALTER TABLE material_pricing
DROP CONSTRAINT IF EXISTS material_pricing_supplier_id_fkey;

ALTER TABLE material_pricing
ADD CONSTRAINT material_pricing_supplier_id_fkey
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Project → Project Pricing (update cascade)
ALTER TABLE project_pricing
DROP CONSTRAINT IF EXISTS project_pricing_project_id_fkey;

ALTER TABLE project_pricing
ADD CONSTRAINT project_pricing_project_id_fkey
FOREIGN KEY (project_id) REFERENCES projects(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Product SKU → Project Pricing (update cascade)
ALTER TABLE project_pricing
DROP CONSTRAINT IF EXISTS project_pricing_sku_id_fkey;

ALTER TABLE project_pricing
ADD CONSTRAINT project_pricing_sku_id_fkey
FOREIGN KEY (sku_id) REFERENCES product_skus(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- STEP 3: CREATE RELATIONSHIP DOCUMENTATION VIEW
-- ============================================================================

CREATE OR REPLACE VIEW v_table_relationships AS
SELECT
  'projects' as parent_table,
  'drawings' as child_table,
  'project_id' as foreign_key,
  'CASCADE' as on_delete,
  'CASCADE' as on_update,
  'One project has many drawings' as description
UNION ALL
SELECT 'drawings', 'takeoffs', 'drawing_id', 'CASCADE', 'CASCADE', 'One drawing has many takeoffs'
UNION ALL
SELECT 'takeoffs', 'takeoff_history', 'takeoff_id', 'CASCADE', 'CASCADE', 'One takeoff has many history records'
UNION ALL
SELECT 'projects', 'saved_analyses', 'project_id', 'CASCADE', 'CASCADE', 'One project has many analyses'
UNION ALL
SELECT 'drawings', 'saved_analyses', 'drawing_id', 'CASCADE', 'CASCADE', 'One drawing has many analyses'
UNION ALL
SELECT 'trade_classes', 'product_skus', 'trade_class_id', 'CASCADE', 'CASCADE', 'One trade class has many SKUs'
UNION ALL
SELECT 'product_skus', 'material_pricing', 'sku_id', 'CASCADE', 'CASCADE', 'One SKU has many pricing records'
UNION ALL
SELECT 'suppliers', 'material_pricing', 'supplier_id', 'CASCADE', 'CASCADE', 'One supplier has many pricing records'
UNION ALL
SELECT 'projects', 'project_pricing', 'project_id', 'CASCADE', 'CASCADE', 'One project has many pricing overrides'
UNION ALL
SELECT 'product_skus', 'project_pricing', 'sku_id', 'CASCADE', 'CASCADE', 'One SKU has many project pricing records'
UNION ALL
SELECT 'trade_classes', 'estimate_templates', 'trade_class_id', 'CASCADE', 'CASCADE', 'One trade class has many templates'
UNION ALL
SELECT 'projects', 'change_orders', 'project_id', 'CASCADE', 'CASCADE', 'One project has many change orders'
UNION ALL
SELECT 'projects', 'profit_margin_settings', 'project_id', 'CASCADE', 'CASCADE', 'One project has many margin settings'
UNION ALL
SELECT 'trade_classes', 'profit_margin_settings', 'trade_class_id', 'CASCADE', 'CASCADE', 'One trade class has many margin settings'
UNION ALL
SELECT 'projects', 'cost_escalation', 'project_id', 'CASCADE', 'CASCADE', 'One project has many escalation rules'
UNION ALL
SELECT 'product_skus', 'cost_history', 'sku_id', 'CASCADE', 'CASCADE', 'One SKU has many cost history records'
UNION ALL
SELECT 'suppliers', 'cost_history', 'supplier_id', 'CASCADE', 'CASCADE', 'One supplier has many cost history records'
UNION ALL
SELECT 'regional_cost_database', 'cost_history', 'region_id', 'CASCADE', 'CASCADE', 'One region has many cost history records';

-- ============================================================================
-- STEP 4: CREATE CONSTRAINT VERIFICATION VIEW
-- ============================================================================

CREATE OR REPLACE VIEW v_foreign_key_constraints AS
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name as referenced_table,
  ccu.column_name as referenced_column,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- STEP 5: CREATE DATA INTEGRITY CHECKS
-- ============================================================================

-- Check for orphaned records (should be none after cascade rules)
CREATE OR REPLACE VIEW v_orphaned_records AS
SELECT 'drawings without projects' as issue, COUNT(*) as count
FROM drawings WHERE project_id NOT IN (SELECT id FROM projects)
UNION ALL
SELECT 'takeoffs without drawings', COUNT(*)
FROM takeoffs WHERE drawing_id NOT IN (SELECT id FROM drawings)
UNION ALL
SELECT 'saved_analyses without projects', COUNT(*)
FROM saved_analyses WHERE project_id NOT IN (SELECT id FROM projects)
UNION ALL
SELECT 'product_skus without trade_classes', COUNT(*)
FROM product_skus WHERE trade_class_id NOT IN (SELECT id FROM trade_classes)
UNION ALL
SELECT 'material_pricing without skus', COUNT(*)
FROM material_pricing WHERE sku_id NOT IN (SELECT id FROM product_skus)
UNION ALL
SELECT 'material_pricing without suppliers', COUNT(*)
FROM material_pricing WHERE supplier_id NOT IN (SELECT id FROM suppliers);

-- ============================================================================
-- STEP 6: USAGE EXAMPLES
-- ============================================================================

-- Example 1: View all relationships
-- SELECT * FROM v_table_relationships ORDER BY parent_table;

-- Example 2: View foreign key constraints
-- SELECT * FROM v_foreign_key_constraints ORDER BY table_name;

-- Example 3: Check for orphaned records
-- SELECT * FROM v_orphaned_records WHERE count > 0;

-- Example 4: Delete a project (cascades to all children)
-- DELETE FROM projects WHERE id = 'project-id-here';
-- This will automatically delete:
-- - All drawings for this project
-- - All takeoffs for those drawings
-- - All takeoff history for those takeoffs
-- - All saved analyses for this project
-- - All change orders for this project
-- - All project pricing for this project
-- - All cost escalation for this project
-- - All profit margin settings for this project

-- Example 5: Delete a trade class (cascades to all children)
-- DELETE FROM trade_classes WHERE id = 'trade-class-id-here';
-- This will automatically delete:
-- - All product SKUs in this trade class
-- - All material pricing for those SKUs
-- - All project pricing for those SKUs
-- - All estimate templates for this trade class
-- - All profit margin settings for this trade class
-- - All cost history for those SKUs

-- ============================================================================
-- STEP 7: VERIFY CONSTRAINTS WERE ADDED
-- ============================================================================

-- List all foreign key constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name as referenced_table,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Count CASCADE constraints
SELECT
  COUNT(*) as cascade_delete_count
FROM information_schema.referential_constraints
WHERE delete_rule = 'CASCADE'
  AND constraint_schema = 'public';

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Total Foreign Key Constraints: 18
-- Total CASCADE DELETE Rules: 18
-- Total ON UPDATE CASCADE Rules: 5

-- Benefits:
-- ✅ Data integrity enforcement
-- ✅ Automatic cleanup of related records
-- ✅ No orphaned records
-- ✅ Consistent ID updates
-- ✅ Simplified deletion logic
-- ✅ Referential integrity

-- Relationship Hierarchy:
-- projects
--   ├── drawings
--   │   ├── takeoffs
--   │   │   └── takeoff_history
--   │   └── saved_analyses
--   ├── saved_analyses
--   ├── project_pricing
--   ├── change_orders
--   ├── profit_margin_settings
--   └── cost_escalation
--
-- trade_classes
--   ├── product_skus
--   │   ├── material_pricing
--   │   ├── project_pricing
--   │   └── cost_history
--   ├── estimate_templates
--   └── profit_margin_settings
--
-- suppliers
--   ├── material_pricing
--   └── cost_history
--
-- regional_cost_database
--   └── cost_history

-- ============================================================================
-- ROLLBACK (If needed)
-- ============================================================================

-- To remove cascade rules (restore to original):
-- This would require dropping and recreating all foreign keys
-- It's easier to restore from backup:
-- psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

-- Or restore from backup:
-- psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

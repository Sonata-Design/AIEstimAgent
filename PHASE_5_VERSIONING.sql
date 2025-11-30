-- ============================================================================
-- PHASE 5: ADD VERSIONING FOR CRITICAL DATA
-- ============================================================================
-- Track all changes to pricing and specifications
-- Enable rollback to previous versions
-- Complete audit trail of all modifications
-- ============================================================================

-- BACKUP YOUR DATABASE FIRST!
-- pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

-- ============================================================================
-- STEP 1: CREATE VERSIONING TABLES
-- ============================================================================

-- Product SKU Versions - Track all changes to product SKUs
CREATE TABLE IF NOT EXISTS product_skus_versions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sku_id VARCHAR NOT NULL REFERENCES product_skus(id),
  version_number INTEGER NOT NULL,
  
  -- Store previous values
  sku TEXT,
  name TEXT,
  description TEXT,
  trade_class_id VARCHAR,
  category TEXT,
  subcategory TEXT,
  unit TEXT,
  unit_size REAL,
  unit_description TEXT,
  material_cost REAL,
  labor_cost REAL,
  markup_percentage REAL,
  tags JSONB,
  specifications JSONB,
  vendor TEXT,
  vendor_sku TEXT,
  is_active BOOLEAN,
  
  -- Audit info
  changed_by VARCHAR,
  change_reason TEXT,
  changed_at TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Material Pricing Versions - Track all price changes
CREATE TABLE IF NOT EXISTS material_pricing_versions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  material_pricing_id VARCHAR NOT NULL REFERENCES material_pricing(id),
  version_number INTEGER NOT NULL,
  
  -- Store previous values
  sku_id VARCHAR,
  supplier_id VARCHAR,
  current_price REAL,
  previous_price REAL,
  price_change REAL,
  minimum_order_quantity INTEGER,
  volume_discounts JSONB,
  availability TEXT,
  price_valid_until TIMESTAMP,
  
  -- Audit info
  changed_by VARCHAR,
  change_reason TEXT,
  changed_at TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Project Pricing Versions - Track project-specific pricing changes
CREATE TABLE IF NOT EXISTS project_pricing_versions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_pricing_id VARCHAR NOT NULL REFERENCES project_pricing(id),
  version_number INTEGER NOT NULL,
  
  -- Store previous values
  project_id VARCHAR,
  sku_id VARCHAR,
  custom_sku TEXT,
  item_name TEXT,
  unit TEXT,
  material_cost REAL,
  labor_cost REAL,
  markup_percentage REAL,
  notes TEXT,
  is_custom BOOLEAN,
  
  -- Audit info
  changed_by VARCHAR,
  change_reason TEXT,
  changed_at TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Profit Margin Settings Versions - Track markup changes
CREATE TABLE IF NOT EXISTS profit_margin_settings_versions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profit_margin_settings_id VARCHAR NOT NULL REFERENCES profit_margin_settings(id),
  version_number INTEGER NOT NULL,
  
  -- Store previous values
  project_id VARCHAR,
  trade_class_id VARCHAR,
  scope TEXT,
  material_markup REAL,
  labor_markup REAL,
  equipment_markup REAL,
  subcontractor_markup REAL,
  general_conditions REAL,
  bond_insurance REAL,
  contingency REAL,
  profit REAL,
  is_active BOOLEAN,
  notes TEXT,
  
  -- Audit info
  changed_by VARCHAR,
  change_reason TEXT,
  changed_at TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: CREATE INDEXES FOR VERSIONING TABLES
-- ============================================================================

-- Product SKU Versions indexes
CREATE INDEX IF NOT EXISTS idx_product_skus_versions_sku_id 
  ON product_skus_versions(sku_id);

CREATE INDEX IF NOT EXISTS idx_product_skus_versions_version 
  ON product_skus_versions(sku_id, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_product_skus_versions_changed_at 
  ON product_skus_versions(changed_at DESC);

-- Material Pricing Versions indexes
CREATE INDEX IF NOT EXISTS idx_material_pricing_versions_pricing_id 
  ON material_pricing_versions(material_pricing_id);

CREATE INDEX IF NOT EXISTS idx_material_pricing_versions_version 
  ON material_pricing_versions(material_pricing_id, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_material_pricing_versions_changed_at 
  ON material_pricing_versions(changed_at DESC);

-- Project Pricing Versions indexes
CREATE INDEX IF NOT EXISTS idx_project_pricing_versions_pricing_id 
  ON project_pricing_versions(project_pricing_id);

CREATE INDEX IF NOT EXISTS idx_project_pricing_versions_version 
  ON project_pricing_versions(project_pricing_id, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_project_pricing_versions_changed_at 
  ON project_pricing_versions(changed_at DESC);

-- Profit Margin Settings Versions indexes
CREATE INDEX IF NOT EXISTS idx_profit_margin_settings_versions_settings_id 
  ON profit_margin_settings_versions(profit_margin_settings_id);

CREATE INDEX IF NOT EXISTS idx_profit_margin_settings_versions_version 
  ON profit_margin_settings_versions(profit_margin_settings_id, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_profit_margin_settings_versions_changed_at 
  ON profit_margin_settings_versions(changed_at DESC);

-- ============================================================================
-- STEP 3: CREATE HELPER FUNCTIONS FOR VERSIONING
-- ============================================================================

-- Function to create a new version of product SKU
CREATE OR REPLACE FUNCTION create_product_sku_version(
  p_sku_id VARCHAR,
  p_changed_by VARCHAR DEFAULT NULL,
  p_change_reason TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_version_number INTEGER;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
  FROM product_skus_versions
  WHERE sku_id = p_sku_id;
  
  -- Insert version record
  INSERT INTO product_skus_versions (
    sku_id, version_number, sku, name, description, trade_class_id,
    category, subcategory, unit, unit_size, unit_description,
    material_cost, labor_cost, markup_percentage, tags, specifications,
    vendor, vendor_sku, is_active, changed_by, change_reason
  )
  SELECT
    id, v_version_number, sku, name, description, trade_class_id,
    category, subcategory, unit, unit_size, unit_description,
    material_cost, labor_cost, markup_percentage, tags, specifications,
    vendor, vendor_sku, is_active, p_changed_by, p_change_reason
  FROM product_skus
  WHERE id = p_sku_id;
  
  RETURN v_version_number;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new version of material pricing
CREATE OR REPLACE FUNCTION create_material_pricing_version(
  p_material_pricing_id VARCHAR,
  p_changed_by VARCHAR DEFAULT NULL,
  p_change_reason TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_version_number INTEGER;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
  FROM material_pricing_versions
  WHERE material_pricing_id = p_material_pricing_id;
  
  -- Insert version record
  INSERT INTO material_pricing_versions (
    material_pricing_id, version_number, sku_id, supplier_id,
    current_price, previous_price, price_change, minimum_order_quantity,
    volume_discounts, availability, price_valid_until,
    changed_by, change_reason
  )
  SELECT
    id, v_version_number, sku_id, supplier_id,
    current_price, previous_price, price_change, minimum_order_quantity,
    volume_discounts, availability, price_valid_until,
    p_changed_by, p_change_reason
  FROM material_pricing
  WHERE id = p_material_pricing_id;
  
  RETURN v_version_number;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new version of project pricing
CREATE OR REPLACE FUNCTION create_project_pricing_version(
  p_project_pricing_id VARCHAR,
  p_changed_by VARCHAR DEFAULT NULL,
  p_change_reason TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_version_number INTEGER;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
  FROM project_pricing_versions
  WHERE project_pricing_id = p_project_pricing_id;
  
  -- Insert version record
  INSERT INTO project_pricing_versions (
    project_pricing_id, version_number, project_id, sku_id,
    custom_sku, item_name, unit, material_cost, labor_cost,
    markup_percentage, notes, is_custom, changed_by, change_reason
  )
  SELECT
    id, v_version_number, project_id, sku_id,
    custom_sku, item_name, unit, material_cost, labor_cost,
    markup_percentage, notes, is_custom, p_changed_by, p_change_reason
  FROM project_pricing
  WHERE id = p_project_pricing_id;
  
  RETURN v_version_number;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new version of profit margin settings
CREATE OR REPLACE FUNCTION create_profit_margin_settings_version(
  p_profit_margin_settings_id VARCHAR,
  p_changed_by VARCHAR DEFAULT NULL,
  p_change_reason TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_version_number INTEGER;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
  FROM profit_margin_settings_versions
  WHERE profit_margin_settings_id = p_profit_margin_settings_id;
  
  -- Insert version record
  INSERT INTO profit_margin_settings_versions (
    profit_margin_settings_id, version_number, project_id, trade_class_id,
    scope, material_markup, labor_markup, equipment_markup,
    subcontractor_markup, general_conditions, bond_insurance,
    contingency, profit, is_active, notes, changed_by, change_reason
  )
  SELECT
    id, v_version_number, project_id, trade_class_id,
    scope, material_markup, labor_markup, equipment_markup,
    subcontractor_markup, general_conditions, bond_insurance,
    contingency, profit, is_active, notes, p_changed_by, p_change_reason
  FROM profit_margin_settings
  WHERE id = p_profit_margin_settings_id;
  
  RETURN v_version_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: CREATE VIEWS FOR VERSION HISTORY
-- ============================================================================

-- View: Product SKU Version History
CREATE OR REPLACE VIEW v_product_skus_version_history AS
SELECT
  sku_id,
  version_number,
  name,
  material_cost,
  labor_cost,
  markup_percentage,
  changed_by,
  change_reason,
  changed_at
FROM product_skus_versions
ORDER BY sku_id, version_number DESC;

-- View: Material Pricing Version History
CREATE OR REPLACE VIEW v_material_pricing_version_history AS
SELECT
  material_pricing_id,
  version_number,
  current_price,
  previous_price,
  price_change,
  availability,
  changed_by,
  change_reason,
  changed_at
FROM material_pricing_versions
ORDER BY material_pricing_id, version_number DESC;

-- View: Project Pricing Version History
CREATE OR REPLACE VIEW v_project_pricing_version_history AS
SELECT
  project_pricing_id,
  version_number,
  item_name,
  material_cost,
  labor_cost,
  markup_percentage,
  changed_by,
  change_reason,
  changed_at
FROM project_pricing_versions
ORDER BY project_pricing_id, version_number DESC;

-- View: Profit Margin Settings Version History
CREATE OR REPLACE VIEW v_profit_margin_settings_version_history AS
SELECT
  profit_margin_settings_id,
  version_number,
  material_markup,
  labor_markup,
  equipment_markup,
  changed_by,
  change_reason,
  changed_at
FROM profit_margin_settings_versions
ORDER BY profit_margin_settings_id, version_number DESC;

-- ============================================================================
-- STEP 5: USAGE EXAMPLES
-- ============================================================================

-- Example 1: Create a version when updating product SKU
-- SELECT create_product_sku_version('sku-id-here', 'user-id', 'Updated pricing');
-- UPDATE product_skus SET material_cost = 100 WHERE id = 'sku-id-here';

-- Example 2: View version history
-- SELECT * FROM v_product_skus_version_history WHERE sku_id = 'sku-id-here';

-- Example 3: Create a version when updating material pricing
-- SELECT create_material_pricing_version('pricing-id-here', 'user-id', 'Price increase');
-- UPDATE material_pricing SET current_price = 50 WHERE id = 'pricing-id-here';

-- Example 4: View all price changes for a material
-- SELECT version_number, current_price, changed_by, changed_at
-- FROM v_material_pricing_version_history
-- WHERE material_pricing_id = 'pricing-id-here'
-- ORDER BY version_number DESC;

-- Example 5: Compare versions
-- SELECT * FROM product_skus_versions
-- WHERE sku_id = 'sku-id-here' AND version_number IN (1, 2)
-- ORDER BY version_number;

-- ============================================================================
-- STEP 6: VERIFY VERSIONING TABLES WERE CREATED
-- ============================================================================

-- List all versioning tables
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE '%_versions'
ORDER BY table_name;

-- Count versioning tables
SELECT COUNT(*) as versioning_tables
FROM information_schema.tables
WHERE table_name LIKE '%_versions';

-- List all versioning views
SELECT viewname
FROM pg_views
WHERE viewname LIKE 'v_%_version%'
ORDER BY viewname;

-- Count versioning views
SELECT COUNT(*) as versioning_views
FROM pg_views
WHERE viewname LIKE 'v_%_version%';

-- ============================================================================
-- STEP 7: VERSIONING WORKFLOW
-- ============================================================================

-- WORKFLOW: Track a Price Change
-- 1. Create version BEFORE updating: SELECT create_material_pricing_version('id', 'user', 'reason');
-- 2. Update the record: UPDATE material_pricing SET current_price = 50 WHERE id = 'id';
-- 3. View history: SELECT * FROM v_material_pricing_version_history WHERE material_pricing_id = 'id';

-- WORKFLOW: Compare Two Versions
-- SELECT * FROM material_pricing_versions
-- WHERE material_pricing_id = 'id'
-- ORDER BY version_number DESC
-- LIMIT 2;

-- WORKFLOW: Find All Changes by User
-- SELECT * FROM product_skus_versions
-- WHERE changed_by = 'user-id'
-- ORDER BY changed_at DESC;

-- WORKFLOW: Find All Changes in Date Range
-- SELECT * FROM material_pricing_versions
-- WHERE changed_at BETWEEN '2024-01-01' AND '2024-12-31'
-- ORDER BY changed_at DESC;

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Total Versioning Tables: 4
-- - product_skus_versions
-- - material_pricing_versions
-- - project_pricing_versions
-- - profit_margin_settings_versions

-- Total Versioning Views: 4
-- - v_product_skus_version_history
-- - v_material_pricing_version_history
-- - v_project_pricing_version_history
-- - v_profit_margin_settings_version_history

-- Total Versioning Functions: 4
-- - create_product_sku_version()
-- - create_material_pricing_version()
-- - create_project_pricing_version()
-- - create_profit_margin_settings_version()

-- Benefits:
-- ✅ Track all changes to pricing
-- ✅ Complete audit trail
-- ✅ Compare versions
-- ✅ Find who changed what and when
-- ✅ Analyze pricing trends
-- ✅ Compliance & reporting

-- ============================================================================
-- ROLLBACK (If needed)
-- ============================================================================

-- To remove all versioning tables and functions:
-- DROP FUNCTION IF EXISTS create_product_sku_version(VARCHAR, VARCHAR, TEXT);
-- DROP FUNCTION IF EXISTS create_material_pricing_version(VARCHAR, VARCHAR, TEXT);
-- DROP FUNCTION IF EXISTS create_project_pricing_version(VARCHAR, VARCHAR, TEXT);
-- DROP FUNCTION IF EXISTS create_profit_margin_settings_version(VARCHAR, VARCHAR, TEXT);
-- DROP VIEW IF EXISTS v_product_skus_version_history;
-- DROP VIEW IF EXISTS v_material_pricing_version_history;
-- DROP VIEW IF EXISTS v_project_pricing_version_history;
-- DROP VIEW IF EXISTS v_profit_margin_settings_version_history;
-- DROP TABLE IF EXISTS product_skus_versions;
-- DROP TABLE IF EXISTS material_pricing_versions;
-- DROP TABLE IF EXISTS project_pricing_versions;
-- DROP TABLE IF EXISTS profit_margin_settings_versions;

-- Or restore from backup:
-- psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

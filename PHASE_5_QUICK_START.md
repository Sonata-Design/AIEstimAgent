# Phase 5: Add Versioning - Quick Start

## 📊 What This Does

Tracks all changes to critical pricing data:
- ✅ Product SKU changes
- ✅ Material pricing changes
- ✅ Project pricing changes
- ✅ Profit margin changes
- ✅ Complete audit trail
- ✅ Version comparison
- ✅ Change history

**Time:** 10-15 seconds
**Risk:** Very Low (non-destructive)
**Reversible:** Yes

---

## ⚡ Quick Steps

### Step 1: Backup (Optional)
```bash
# Go to https://console.neon.tech → Backups → Create backup
```

### Step 2: Execute SQL
1. Go to https://console.neon.tech
2. Click **"SQL Editor"**
3. Copy entire content from `PHASE_5_VERSIONING.sql`
4. Paste into SQL Editor
5. Click **"Execute"**

### Step 3: Verify
```sql
-- Check versioning tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name LIKE '%_versions';
-- Should show 4

-- Check versioning views
SELECT COUNT(*) FROM pg_views 
WHERE viewname LIKE 'v_%_version%';
-- Should show 4
```

### Step 4: Done! ✅
Your database now tracks all pricing changes!

---

## 📊 What Gets Created

### Versioning Tables (4)
- product_skus_versions
- material_pricing_versions
- project_pricing_versions
- profit_margin_settings_versions

### Versioning Views (4)
- v_product_skus_version_history
- v_material_pricing_version_history
- v_project_pricing_version_history
- v_profit_margin_settings_version_history

### Versioning Functions (4)
- create_product_sku_version()
- create_material_pricing_version()
- create_project_pricing_version()
- create_profit_margin_settings_version()

### Indexes (12)
- Version lookups
- Date range searches
- Change tracking

---

## 🔄 Versioning Workflow

### Track a Price Change

```sql
-- Step 1: Create version BEFORE updating
SELECT create_material_pricing_version('pricing-id', 'user-id', 'Price increase');

-- Step 2: Update the record
UPDATE material_pricing 
SET current_price = 50 
WHERE id = 'pricing-id';

-- Step 3: View history
SELECT * FROM v_material_pricing_version_history 
WHERE material_pricing_id = 'pricing-id';
```

### View Version History

```sql
-- See all versions of a product SKU
SELECT * FROM v_product_skus_version_history 
WHERE sku_id = 'sku-id-here'
ORDER BY version_number DESC;

-- See all price changes
SELECT version_number, current_price, changed_by, changed_at
FROM v_material_pricing_version_history
WHERE material_pricing_id = 'pricing-id'
ORDER BY version_number DESC;
```

### Compare Versions

```sql
-- Compare two versions
SELECT * FROM product_skus_versions
WHERE sku_id = 'sku-id-here'
  AND version_number IN (1, 2)
ORDER BY version_number;

-- Find differences
SELECT 
  v1.version_number as old_version,
  v2.version_number as new_version,
  v1.material_cost as old_cost,
  v2.material_cost as new_cost,
  v2.changed_by,
  v2.changed_at
FROM product_skus_versions v1
JOIN product_skus_versions v2 ON v1.sku_id = v2.sku_id
WHERE v1.sku_id = 'sku-id-here'
  AND v2.version_number = v1.version_number + 1;
```

### Find All Changes by User

```sql
-- See all changes made by a user
SELECT * FROM product_skus_versions
WHERE changed_by = 'user-id'
ORDER BY changed_at DESC;

-- See all price changes by user
SELECT * FROM material_pricing_versions
WHERE changed_by = 'user-id'
ORDER BY changed_at DESC;
```

### Find Changes in Date Range

```sql
-- Find all changes in a date range
SELECT * FROM material_pricing_versions
WHERE changed_at BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY changed_at DESC;

-- Find recent changes
SELECT * FROM product_skus_versions
WHERE changed_at > NOW() - INTERVAL '7 days'
ORDER BY changed_at DESC;
```

---

## 📈 Use Cases

### 1. Price Audit
```sql
-- Track all price changes
SELECT 
  material_pricing_id,
  version_number,
  current_price,
  previous_price,
  changed_by,
  changed_at
FROM v_material_pricing_version_history
ORDER BY material_pricing_id, version_number DESC;
```

### 2. Compliance Report
```sql
-- Who changed what and when
SELECT 
  changed_by,
  COUNT(*) as changes,
  MIN(changed_at) as first_change,
  MAX(changed_at) as last_change
FROM product_skus_versions
GROUP BY changed_by
ORDER BY changes DESC;
```

### 3. Pricing Trends
```sql
-- Track pricing trends over time
SELECT 
  material_pricing_id,
  version_number,
  current_price,
  changed_at
FROM v_material_pricing_version_history
WHERE material_pricing_id = 'pricing-id'
ORDER BY version_number
LIMIT 10;
```

### 4. Change Analysis
```sql
-- Analyze what changed
SELECT 
  sku_id,
  version_number,
  CASE 
    WHEN material_cost IS DIFFERENT FROM previous_version.material_cost THEN 'Material Cost Changed'
    WHEN labor_cost IS DIFFERENT FROM previous_version.labor_cost THEN 'Labor Cost Changed'
    WHEN markup_percentage IS DIFFERENT FROM previous_version.markup_percentage THEN 'Markup Changed'
  END as change_type,
  changed_by,
  change_reason
FROM product_skus_versions;
```

---

## 💾 Data Preservation

### What Gets Versioned
- ✅ Product SKU details
- ✅ Material pricing
- ✅ Project pricing
- ✅ Profit margins
- ✅ All changes tracked

### Version Information Stored
- ✅ Version number
- ✅ All field values
- ✅ Who made the change
- ✅ When the change was made
- ✅ Why the change was made

---

## 🔍 Query Examples

### Get Latest Version
```sql
SELECT * FROM product_skus_versions
WHERE sku_id = 'sku-id'
ORDER BY version_number DESC
LIMIT 1;
```

### Get Version at Specific Time
```sql
SELECT * FROM material_pricing_versions
WHERE material_pricing_id = 'pricing-id'
  AND changed_at <= '2024-06-01'
ORDER BY version_number DESC
LIMIT 1;
```

### Compare Current vs Version 1
```sql
SELECT 
  current.material_cost as current_cost,
  v1.material_cost as original_cost,
  current.material_cost - v1.material_cost as difference
FROM product_skus current
JOIN product_skus_versions v1 ON current.id = v1.sku_id
WHERE current.id = 'sku-id' AND v1.version_number = 1;
```

---

## ✅ Verification

After running the SQL:

```sql
-- Count versioning tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name LIKE '%_versions';
-- Should show 4

-- Count versioning views
SELECT COUNT(*) FROM pg_views 
WHERE viewname LIKE 'v_%_version%';
-- Should show 4

-- Test a view
SELECT COUNT(*) FROM v_product_skus_version_history;
-- Should work!
```

---

## 🆘 Troubleshooting

### Error: "Table already exists"
**Solution:** Safe to ignore (tables already created)

### Error: "Function already exists"
**Solution:** Safe to ignore (functions already created)

### Want to Remove Versioning?
```sql
-- Drop all versioning objects
DROP FUNCTION IF EXISTS create_product_sku_version(VARCHAR, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS create_material_pricing_version(VARCHAR, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS create_project_pricing_version(VARCHAR, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS create_profit_margin_settings_version(VARCHAR, VARCHAR, TEXT);
DROP VIEW IF EXISTS v_product_skus_version_history;
DROP VIEW IF EXISTS v_material_pricing_version_history;
DROP VIEW IF EXISTS v_project_pricing_version_history;
DROP VIEW IF EXISTS v_profit_margin_settings_version_history;
DROP TABLE IF EXISTS product_skus_versions;
DROP TABLE IF EXISTS material_pricing_versions;
DROP TABLE IF EXISTS project_pricing_versions;
DROP TABLE IF EXISTS profit_margin_settings_versions;
```

---

## 📋 Summary

| Aspect | Details |
|--------|---------|
| **Tables** | 4 |
| **Views** | 4 |
| **Functions** | 4 |
| **Indexes** | 12 |
| **Audit Trail** | Yes |
| **Version Comparison** | Yes |
| **Change Tracking** | Yes |
| **Time to Execute** | 10-15s |
| **Risk Level** | Very Low |
| **Reversible** | Yes |

**Status:** ✅ Ready to implement!

---

## 🚀 Next Steps

After Phase 5:
- Phase 6: Improve Relationships (cascade rules)
- Phase 7: Add Computed Columns (auto-calculations)

**Phase 5 is complete!** ✅

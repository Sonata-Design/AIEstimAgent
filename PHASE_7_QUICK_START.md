# Phase 7: Add Computed Columns - Quick Start

## 🧮 What This Does

Auto-calculates values in the database:
- ✅ Total cost with markup
- ✅ Cost per unit calculations
- ✅ Price change percentages
- ✅ Financial summaries
- ✅ Performance metrics
- ✅ Reduce application code
- ✅ Ensure consistency

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
3. Copy entire content from `PHASE_7_COMPUTED_COLUMNS.sql`
4. Paste into SQL Editor
5. Click **"Execute"**

### Step 3: Verify
```sql
-- Check computed columns
SELECT COUNT(*) FROM information_schema.columns
WHERE is_generated = 'ALWAYS' AND table_schema = 'public';
-- Should show 8
```

### Step 4: Done! ✅
Your database now auto-calculates values!

---

## 📊 What Gets Created

### Computed Columns (8)
- takeoffs.total_cost_with_markup
- takeoffs.cost_per_unit_with_markup
- product_skus.total_cost_per_unit
- product_skus.cost_with_markup
- material_pricing.price_change_percentage
- project_pricing.total_cost_per_unit
- project_pricing.cost_with_markup

### Summary Views (11)
- v_takeoff_summary_by_drawing
- v_takeoff_summary_by_project
- v_takeoff_summary_by_element_type
- v_product_sku_cost_summary
- v_material_pricing_summary
- v_project_cost_summary
- v_project_financial_summary
- v_sku_cost_analysis
- v_takeoff_performance_metrics
- v_project_performance_metrics

---

## 🔄 Computed Column Examples

### Get Takeoff with Markup
```sql
SELECT 
  id,
  total_cost,
  total_cost_with_markup,  -- Auto-calculated!
  cost_per_unit,
  cost_per_unit_with_markup  -- Auto-calculated!
FROM takeoffs 
WHERE id = 'takeoff-id';
```

### Get Product SKU Costs
```sql
SELECT 
  sku,
  material_cost,
  labor_cost,
  total_cost_per_unit,  -- Auto-calculated (material + labor)
  markup_percentage,
  cost_with_markup  -- Auto-calculated with markup
FROM product_skus 
WHERE id = 'sku-id';
```

### Get Material Pricing with Change
```sql
SELECT 
  sku_id,
  current_price,
  previous_price,
  price_change,
  price_change_percentage  -- Auto-calculated!
FROM material_pricing 
WHERE id = 'pricing-id';
```

---

## 📈 Summary View Examples

### Takeoff Summary by Drawing
```sql
SELECT * FROM v_takeoff_summary_by_drawing 
WHERE drawing_id = 'drawing-id';

-- Returns:
-- - total_takeoffs
-- - total_quantity
-- - total_cost
-- - total_cost_with_markup
-- - avg_cost_per_unit
```

### Project Financial Summary
```sql
SELECT * FROM v_project_financial_summary 
WHERE id = 'project-id';

-- Returns:
-- - base_cost
-- - cost_with_markup
-- - markup_amount
-- - change_orders
-- - total_project_cost
-- - drawing_count
-- - takeoff_count
```

### SKU Cost Analysis
```sql
SELECT * FROM v_sku_cost_analysis 
WHERE sku = 'ABC123';

-- Returns:
-- - material_cost
-- - labor_cost
-- - total_cost_per_unit
-- - material_percentage
-- - labor_percentage
-- - supplier_count
-- - min/max/avg supplier price
```

### Project Cost Summary
```sql
SELECT * FROM v_project_cost_summary 
ORDER BY total_cost_with_markup DESC;

-- Returns:
-- - drawing_count
-- - takeoff_count
-- - total_cost
-- - total_cost_with_markup
-- - change_order_count
-- - approved_changes
```

---

## 💰 Financial Queries

### Get Total Project Cost
```sql
SELECT 
  name,
  base_cost,
  cost_with_markup,
  markup_amount,
  change_orders,
  total_project_cost
FROM v_project_financial_summary
ORDER BY total_project_cost DESC;
```

### Compare Costs by Element Type
```sql
SELECT 
  element_type,
  count,
  total_cost,
  total_cost_with_markup,
  avg_cost_per_unit
FROM v_takeoff_summary_by_element_type
ORDER BY total_cost DESC;
```

### Get Markup Analysis
```sql
SELECT 
  sku,
  material_cost,
  labor_cost,
  total_cost_per_unit,
  markup_percentage,
  cost_with_markup,
  ROUND((cost_with_markup - total_cost_per_unit) / total_cost_per_unit * 100, 2) as actual_markup_percent
FROM v_sku_cost_analysis
ORDER BY cost_with_markup DESC;
```

---

## 📊 Performance Metrics

### Get All Performance Metrics
```sql
SELECT * FROM v_takeoff_performance_metrics;
SELECT * FROM v_project_performance_metrics;

-- Returns:
-- - Total active takeoffs
-- - Total takeoff cost
-- - Average cost per unit
-- - Total quantity
-- - Total projects
-- - Total project cost
-- - Average project cost
```

---

## 🔍 Query Examples

### Find Most Expensive Takeoffs
```sql
SELECT 
  id,
  element_type,
  total_cost,
  total_cost_with_markup,
  quantity
FROM v_takeoffs_active
ORDER BY total_cost_with_markup DESC
LIMIT 10;
```

### Find Price Changes
```sql
SELECT 
  sku,
  supplier_name,
  current_price,
  previous_price,
  price_change_percentage
FROM v_material_pricing_summary
WHERE price_change_percentage > 10
ORDER BY price_change_percentage DESC;
```

### Get Project Budget Overview
```sql
SELECT 
  name,
  status,
  base_cost,
  cost_with_markup,
  markup_amount,
  change_orders,
  total_project_cost
FROM v_project_financial_summary
ORDER BY total_project_cost DESC;
```

---

## ✅ Verification

After running the SQL:

```sql
-- Count computed columns
SELECT COUNT(*) FROM information_schema.columns
WHERE is_generated = 'ALWAYS' AND table_schema = 'public';
-- Should show 8

-- List all computed columns
SELECT table_name, column_name
FROM information_schema.columns
WHERE is_generated = 'ALWAYS' AND table_schema = 'public'
ORDER BY table_name;

-- Test a summary view
SELECT * FROM v_project_financial_summary LIMIT 1;
```

---

## 🆘 Troubleshooting

### Error: "Column already exists"
**Solution:** Safe to ignore (columns already created)

### Error: "View already exists"
**Solution:** Safe to ignore (views already created)

### Computed Column Not Updating
**Solution:** Computed columns are STORED, they update automatically
- Check if the source columns are being updated
- Verify the formula is correct

### Want to Remove Computed Columns?
```sql
-- Drop computed columns
ALTER TABLE takeoffs DROP COLUMN IF EXISTS total_cost_with_markup;
ALTER TABLE takeoffs DROP COLUMN IF EXISTS cost_per_unit_with_markup;
-- ... etc

-- Or restore from backup
psql $DATABASE_URL < backup_YYYYMMDD.sql
```

---

## 📋 Summary

| Aspect | Details |
|--------|---------|
| **Computed Columns** | 8 |
| **Summary Views** | 11 |
| **Auto-Calculations** | Yes |
| **Financial Reports** | Yes |
| **Performance Metrics** | Yes |
| **Time to Execute** | 10-15s |
| **Risk Level** | Very Low |
| **Reversible** | Yes |

**Status:** ✅ Ready to implement!

---

## 🚀 Benefits

✅ Automatic calculations
✅ No manual computation
✅ Consistent results
✅ Better performance
✅ Reduced application code
✅ Easy reporting
✅ Financial summaries
✅ Performance metrics

---

## 🎯 Next Steps

After Phase 7:
- ✅ All 7 phases complete!
- ✅ Database fully optimized
- ✅ Ready for production

**Phase 7 is the final phase!** ✅

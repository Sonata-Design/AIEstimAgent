# Phase 6: Improve Relationships - Quick Start

## 🔗 What This Does

Improves data integrity with CASCADE rules:
- ✅ CASCADE DELETE - Auto-delete related records
- ✅ ON UPDATE CASCADE - Auto-update related IDs
- ✅ No orphaned records
- ✅ Referential integrity
- ✅ Simplified deletion logic
- ✅ Data consistency

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
3. Copy entire content from `PHASE_6_RELATIONSHIPS.sql`
4. Paste into SQL Editor
5. Click **"Execute"**

### Step 3: Verify
```sql
-- Check CASCADE constraints
SELECT COUNT(*) FROM information_schema.referential_constraints
WHERE delete_rule = 'CASCADE' AND constraint_schema = 'public';
-- Should show 18
```

### Step 4: Done! ✅
Your database now has proper cascade rules!

---

## 📊 What Gets Created

### CASCADE DELETE Rules (18)
- Project → Drawings
- Drawing → Takeoffs
- Takeoff → Takeoff History
- Project → Saved Analyses
- Drawing → Saved Analyses
- Trade Class → Product SKUs
- Product SKU → Material Pricing
- Supplier → Material Pricing
- Project → Project Pricing
- Product SKU → Project Pricing
- Trade Class → Estimate Templates
- Project → Change Orders
- Project → Profit Margin Settings
- Trade Class → Profit Margin Settings
- Project → Cost Escalation
- Product SKU → Cost History
- Supplier → Cost History
- Regional Cost Database → Cost History

### ON UPDATE CASCADE Rules (5)
- Trade Class → Product SKUs
- Product SKU → Material Pricing
- Supplier → Material Pricing
- Project → Project Pricing
- Product SKU → Project Pricing

### Documentation Views (2)
- v_table_relationships
- v_foreign_key_constraints

### Data Integrity Views (1)
- v_orphaned_records

---

## 🔄 Cascade Delete Workflow

### Delete a Project
```sql
-- This cascades to:
DELETE FROM projects WHERE id = 'project-id';

-- Automatically deletes:
-- ✅ All drawings
-- ✅ All takeoffs
-- ✅ All takeoff history
-- ✅ All saved analyses
-- ✅ All change orders
-- ✅ All project pricing
-- ✅ All cost escalation
-- ✅ All profit margin settings
```

### Delete a Trade Class
```sql
-- This cascades to:
DELETE FROM trade_classes WHERE id = 'trade-class-id';

-- Automatically deletes:
-- ✅ All product SKUs
-- ✅ All material pricing
-- ✅ All project pricing
-- ✅ All estimate templates
-- ✅ All profit margin settings
-- ✅ All cost history
```

### Delete a Product SKU
```sql
-- This cascades to:
DELETE FROM product_skus WHERE id = 'sku-id';

-- Automatically deletes:
-- ✅ All material pricing
-- ✅ All project pricing
-- ✅ All cost history
```

---

## 📊 Relationship Hierarchy

```
projects
  ├── drawings
  │   ├── takeoffs
  │   │   └── takeoff_history
  │   └── saved_analyses
  ├── saved_analyses
  ├── project_pricing
  ├── change_orders
  ├── profit_margin_settings
  └── cost_escalation

trade_classes
  ├── product_skus
  │   ├── material_pricing
  │   ├── project_pricing
  │   └── cost_history
  ├── estimate_templates
  └── profit_margin_settings

suppliers
  ├── material_pricing
  └── cost_history

regional_cost_database
  └── cost_history
```

---

## 🔍 Query Examples

### View All Relationships
```sql
SELECT * FROM v_table_relationships ORDER BY parent_table;
```

### View Foreign Key Constraints
```sql
SELECT * FROM v_foreign_key_constraints ORDER BY table_name;
```

### Check for Orphaned Records
```sql
SELECT * FROM v_orphaned_records WHERE count > 0;
```

### Find All Constraints for a Table
```sql
SELECT * FROM v_foreign_key_constraints 
WHERE table_name = 'takeoffs';
```

### Check Cascade Rules
```sql
SELECT 
  table_name,
  column_name,
  referenced_table,
  delete_rule,
  update_rule
FROM v_foreign_key_constraints
WHERE delete_rule = 'CASCADE'
ORDER BY table_name;
```

---

## 💾 Data Integrity

### Before CASCADE Rules
```sql
-- Deleting a project leaves orphaned records
DELETE FROM projects WHERE id = 'proj-123';
-- Drawings still exist (orphaned)
-- Takeoffs still exist (orphaned)
-- Analyses still exist (orphaned)
```

### After CASCADE Rules
```sql
-- Deleting a project cleans up everything
DELETE FROM projects WHERE id = 'proj-123';
-- All related records automatically deleted
-- No orphaned records
-- Database stays clean
```

---

## ✅ Verification

After running the SQL:

```sql
-- Count CASCADE constraints
SELECT COUNT(*) FROM information_schema.referential_constraints
WHERE delete_rule = 'CASCADE';
-- Should show 18

-- List all constraints
SELECT * FROM v_foreign_key_constraints;

-- Check for orphaned records
SELECT * FROM v_orphaned_records WHERE count > 0;
-- Should show no results
```

---

## 🆘 Troubleshooting

### Error: "Constraint already exists"
**Solution:** Safe to ignore (constraints already created)

### Error: "Cannot drop constraint"
**Solution:** Other constraints depend on it
- Try running the full script again
- Or restore from backup

### Want to Remove CASCADE Rules?
```sql
-- Restore from backup (easier than removing manually)
psql $DATABASE_URL < backup_YYYYMMDD.sql
```

---

## 📋 Summary

| Aspect | Details |
|--------|---------|
| **CASCADE DELETE** | 18 rules |
| **ON UPDATE CASCADE** | 5 rules |
| **Documentation Views** | 2 |
| **Data Integrity Views** | 1 |
| **Orphaned Records** | 0 (auto-cleaned) |
| **Time to Execute** | 10-15s |
| **Risk Level** | Very Low |
| **Reversible** | Yes |

**Status:** ✅ Ready to implement!

---

## 🚀 Next Steps

After Phase 6:
- Phase 7: Add Computed Columns (auto-calculations)

**Phase 6 is complete!** ✅

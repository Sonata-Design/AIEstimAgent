# Quick Cleanup Guide (TL;DR)

## 🚀 Fast Track

### Step 1: Backup (30 seconds)
```bash
# Go to https://console.neon.tech → Backups → Create backup
# OR run:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Choose Your Option

#### ✅ OPTION A: Delete All Data (Recommended for Dev)
```sql
-- Delete all demo data, keep tables
DELETE FROM takeoff_history;
DELETE FROM cost_history;
DELETE FROM cost_escalation;
DELETE FROM change_orders;
DELETE FROM profit_margin_settings;
DELETE FROM material_pricing;
DELETE FROM project_pricing;
DELETE FROM takeoffs;
DELETE FROM saved_analyses;
DELETE FROM estimate_templates;
DELETE FROM product_skus;
DELETE FROM trade_classes;
DELETE FROM suppliers;
DELETE FROM regional_cost_database;
DELETE FROM drawings;
DELETE FROM projects;
DELETE FROM material_costs;
```

#### ✅ OPTION B: Delete Unused Tables (Recommended for Prod)
```sql
-- Delete redundant table
DROP TABLE IF EXISTS material_costs CASCADE;

-- Optional: Delete other unused tables
-- DROP TABLE IF EXISTS regional_cost_database CASCADE;
-- DROP TABLE IF EXISTS cost_history CASCADE;
-- DROP TABLE IF EXISTS cost_escalation CASCADE;
-- DROP TABLE IF EXISTS profit_margin_settings CASCADE;
```

#### ✅ OPTION C: Delete Everything
```sql
-- Delete all data
DELETE FROM takeoff_history;
DELETE FROM cost_history;
DELETE FROM cost_escalation;
DELETE FROM change_orders;
DELETE FROM profit_margin_settings;
DELETE FROM material_pricing;
DELETE FROM project_pricing;
DELETE FROM takeoffs;
DELETE FROM saved_analyses;
DELETE FROM estimate_templates;
DELETE FROM product_skus;
DELETE FROM trade_classes;
DELETE FROM suppliers;
DELETE FROM regional_cost_database;
DELETE FROM drawings;
DELETE FROM projects;
DELETE FROM material_costs;

-- Delete unused tables
DROP TABLE IF EXISTS material_costs CASCADE;
DROP TABLE IF EXISTS regional_cost_database CASCADE;
DROP TABLE IF EXISTS cost_history CASCADE;
DROP TABLE IF EXISTS cost_escalation CASCADE;
DROP TABLE IF EXISTS profit_margin_settings CASCADE;
```

### Step 3: Execute
1. Go to https://console.neon.tech
2. Click "SQL Editor"
3. Paste the SQL above
4. Click "Execute"

### Step 4: Verify
```sql
-- Check if data is deleted
SELECT COUNT(*) FROM projects;  -- Should be 0
SELECT COUNT(*) FROM drawings;  -- Should be 0
```

### Step 5: Restart App
```bash
npm run dev
```

---

## 📊 Comparison

| What | Option A | Option B | Option C |
|------|----------|----------|----------|
| Delete Data | ✅ Yes | ❌ No | ✅ Yes |
| Delete Tables | ❌ No | ✅ Yes | ✅ Yes |
| Keep Structure | ✅ Yes | ✅ Yes | ❌ No |
| Risk | 🟢 Low | 🟢 Low | 🟡 Medium |
| Time | 5s | 5s | 5s |
| Reversible | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 🆘 Oops! Undo It

```bash
# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

---

## 💡 Recommendation

- **Development:** Use Option A (delete all data)
- **Production:** Use Option B (delete unused tables only)
- **Start Fresh:** Use Option C (delete everything)

---

## Full Guides

- `DELETE_DEMO_DATA.sql` - SQL scripts for all options
- `CLEANUP_INSTRUCTIONS.md` - Detailed step-by-step guide
- `DATABASE_CLEANUP_GUIDE.md` - Database structure guide

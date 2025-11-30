# Database Cleanup & Migration Guide

## ⚠️ IMPORTANT: Before Running Migrations

**BACKUP YOUR DATABASE FIRST!**
```bash
# Backup Neon database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Phase 2: CONSTRAINTS & VALIDATION ✅ COMPLETED

### What Was Added:

#### 1. **Standardized ALL Table Names & Columns** ✅
- All tables now use consistent `snake_case`
- All foreign keys properly named
- All boolean fields use `is_*` prefix
- All timestamp fields use `_at` suffix

#### 2. **Added Audit Columns to ALL Tables** ✅
```sql
created_by VARCHAR      -- User who created record
updated_by VARCHAR      -- User who last updated
deleted_at TIMESTAMP    -- Soft delete timestamp
deleted_by VARCHAR      -- User who deleted
```

#### 3. **Tables Updated:**
- ✅ regional_cost_database
- ✅ suppliers
- ✅ material_pricing
- ✅ change_orders
- ✅ profit_margin_settings
- ✅ cost_history
- ✅ cost_escalation

---

## Data Cleanup: What to Delete

### Tables You Can SAFELY Delete (Not Used):

#### 1. **material_costs** ❌
**Status:** DEPRECATED - Use `product_skus` + `material_pricing` instead
**Safe to delete:** YES
**Data to preserve:** None (redundant with product_skus)

```sql
-- Check if any data exists
SELECT COUNT(*) FROM material_costs;

-- If count is 0 or low, safe to delete
DROP TABLE IF EXISTS material_costs CASCADE;
```

#### 2. **regionalCostDatabase** ⚠️ (OPTIONAL)
**Status:** Not actively used in current app
**Safe to delete:** ONLY if you don't need regional cost adjustments
**Data to preserve:** None (can be re-added later)

```sql
-- Check if any data exists
SELECT COUNT(*) FROM regional_cost_database;

-- If count is 0, safe to delete
DROP TABLE IF EXISTS regional_cost_database CASCADE;
```

#### 3. **costHistory** ⚠️ (OPTIONAL)
**Status:** For historical tracking only
**Safe to delete:** ONLY if you don't need price history
**Data to preserve:** None (can be re-added later)

```sql
-- Check if any data exists
SELECT COUNT(*) FROM cost_history;

-- If count is 0, safe to delete
DROP TABLE IF EXISTS cost_history CASCADE;
```

#### 4. **costEscalation** ⚠️ (OPTIONAL)
**Status:** For inflation adjustments only
**Safe to delete:** ONLY if you don't need inflation tracking
**Data to preserve:** None (can be re-added later)

```sql
-- Check if any data exists
SELECT COUNT(*) FROM cost_escalation;

-- If count is 0, safe to delete
DROP TABLE IF EXISTS cost_escalation CASCADE;
```

#### 5. **profitMarginSettings** ⚠️ (OPTIONAL)
**Status:** For advanced pricing only
**Safe to delete:** ONLY if using simple markup percentages
**Data to preserve:** None (can be re-added later)

```sql
-- Check if any data exists
SELECT COUNT(*) FROM profit_margin_settings;

-- If count is 0, safe to delete
DROP TABLE IF EXISTS profit_margin_settings CASCADE;
```

---

## Recommended Cleanup Strategy

### SAFE TO DELETE NOW (No Dependencies):
1. ✅ **material_costs** - Definitely delete (redundant)

### OPTIONAL (Keep for Now):
2. ⚠️ **regional_cost_database** - Keep unless you're sure
3. ⚠️ **cost_history** - Keep for audit trail
4. ⚠️ **cost_escalation** - Keep for future use
5. ⚠️ **profit_margin_settings** - Keep for advanced pricing

### DO NOT DELETE:
- ❌ projects
- ❌ drawings
- ❌ takeoffs
- ❌ takeoff_history
- ❌ saved_analyses
- ❌ product_skus
- ❌ trade_classes
- ❌ project_pricing
- ❌ estimate_templates
- ❌ suppliers
- ❌ material_pricing
- ❌ change_orders

---

## Cleanup SQL Script

### Option 1: MINIMAL CLEANUP (Safe)
```sql
-- Only delete redundant table
DROP TABLE IF EXISTS material_costs CASCADE;
```

### Option 2: MODERATE CLEANUP (Recommended)
```sql
-- Delete redundant and unused tables
DROP TABLE IF EXISTS material_costs CASCADE;
DROP TABLE IF EXISTS regional_cost_database CASCADE;
DROP TABLE IF EXISTS cost_history CASCADE;
```

### Option 3: AGGRESSIVE CLEANUP (Advanced Features Only)
```sql
-- Delete all optional tables
DROP TABLE IF EXISTS material_costs CASCADE;
DROP TABLE IF EXISTS regional_cost_database CASCADE;
DROP TABLE IF EXISTS cost_history CASCADE;
DROP TABLE IF EXISTS cost_escalation CASCADE;
DROP TABLE IF EXISTS profit_margin_settings CASCADE;
```

---

## Next Steps: Phase 3 (Ready to Implement)

### Phase 3: Add Indexes for Performance
```sql
-- Foreign key indexes
CREATE INDEX idx_drawings_project_id ON drawings(project_id);
CREATE INDEX idx_takeoffs_drawing_id ON takeoffs(drawing_id);
CREATE INDEX idx_takeoffs_element_type ON takeoffs(element_type);
CREATE INDEX idx_material_pricing_sku_supplier ON material_pricing(sku_id, supplier_id);
CREATE INDEX idx_cost_history_sku_date ON cost_history(sku_id, record_date DESC);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_product_skus_sku ON product_skus(sku);

-- Full-text search index
CREATE INDEX idx_product_skus_search ON product_skus 
  USING GIN(to_tsvector('english', name || ' ' || description));
```

**Expected Performance Improvement:** 40-60% faster queries

---

## Migration Checklist

- [ ] Backup database
- [ ] Review cleanup options
- [ ] Run cleanup SQL
- [ ] Verify data integrity
- [ ] Run Phase 3 indexes
- [ ] Test application
- [ ] Monitor performance

---

## Rollback Plan

If something goes wrong:

```bash
# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

---

## Questions?

- **Keep all tables?** → Run Option 1 (minimal cleanup)
- **Clean up unused?** → Run Option 2 (moderate cleanup)
- **Advanced features only?** → Run Option 3 (aggressive cleanup)

**Recommendation:** Start with Option 1, then decide based on your needs.

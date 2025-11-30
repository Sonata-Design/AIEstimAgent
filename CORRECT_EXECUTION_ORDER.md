# Correct Execution Order - Database Migration

## ❌ What Went Wrong

Your schema.ts was updated (Phase 1) but the database wasn't migrated. Now we need to:

1. Create missing tables
2. Add missing audit columns
3. Then Phase 4 will work

---

## ✅ Correct Order (Execute in This Order)

### Step 1: Create Missing Tables
**File:** `CREATE_MISSING_TABLES.sql`
```sql
-- Creates takeoff_history table
-- Time: 5 seconds
```

1. Go to https://console.neon.tech → SQL Editor
2. Copy entire content from `CREATE_MISSING_TABLES.sql`
3. Paste & Execute
4. Verify: `SELECT COUNT(*) FROM takeoff_history;` (should return 0)

---

### Step 2: Add Audit Columns
**File:** `ADD_AUDIT_COLUMNS.sql`
```sql
-- Adds created_by, updated_by, deleted_at, deleted_by to all tables
-- Time: 5 seconds
```

1. Go to SQL Editor
2. Copy entire content from `ADD_AUDIT_COLUMNS.sql`
3. Paste & Execute
4. Verify columns exist

---

### Step 3: Create Soft Delete Views & Functions
**File:** `PHASE_4_SOFT_DELETES.sql`
```sql
-- Creates 30+ views and 4 helper functions
-- Time: 5 seconds
```

1. Go to SQL Editor
2. Copy entire content from `PHASE_4_SOFT_DELETES.sql`
3. Paste & Execute
4. Verify: `SELECT COUNT(*) FROM pg_views WHERE viewname LIKE 'v_%';` (should show 30+)

---

## 📋 Complete Checklist

- [ ] **Step 1:** Run `CREATE_MISSING_TABLES.sql`
  - [ ] Verify: `SELECT COUNT(*) FROM takeoff_history;`
  
- [ ] **Step 2:** Run `ADD_AUDIT_COLUMNS.sql`
  - [ ] Verify: `SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'deleted_at';`
  
- [ ] **Step 3:** Run `PHASE_4_SOFT_DELETES.sql`
  - [ ] Verify: `SELECT COUNT(*) FROM pg_views WHERE viewname LIKE 'v_%';`

---

## 🚀 Quick Execute (Copy & Paste)

### Execute All 3 in Sequence:

```sql
-- ============================================================================
-- STEP 1: CREATE MISSING TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS takeoff_history (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  takeoff_id VARCHAR NOT NULL REFERENCES takeoffs(id),
  previous_values JSONB NOT NULL,
  changed_fields JSONB NOT NULL,
  changed_by VARCHAR,
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_takeoff_history_takeoff_id 
  ON takeoff_history(takeoff_id);

-- ============================================================================
-- STEP 2: ADD AUDIT COLUMNS
-- ============================================================================

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

ALTER TABLE drawings
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

ALTER TABLE takeoffs
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

ALTER TABLE takeoff_history
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

ALTER TABLE saved_analyses
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

ALTER TABLE product_skus
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

ALTER TABLE trade_classes
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

ALTER TABLE project_pricing
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

ALTER TABLE material_pricing
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

ALTER TABLE change_orders
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

ALTER TABLE profit_margin_settings
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

ALTER TABLE cost_history
ADD COLUMN IF NOT EXISTS created_by VARCHAR;

ALTER TABLE cost_escalation
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

ALTER TABLE material_costs
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

ALTER TABLE regional_cost_database
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

ALTER TABLE estimate_templates
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- ============================================================================
-- VERIFY
-- ============================================================================

SELECT 'Tables created' as status;
SELECT COUNT(*) as audit_columns_added FROM information_schema.columns
WHERE column_name IN ('created_by', 'updated_by', 'deleted_at', 'deleted_by');
```

Then run `PHASE_4_SOFT_DELETES.sql` separately.

---

## 📊 Summary

| Step | File | Time | Status |
|------|------|------|--------|
| 1 | CREATE_MISSING_TABLES.sql | 5s | ⏳ DO THIS |
| 2 | ADD_AUDIT_COLUMNS.sql | 5s | ⏳ DO THIS |
| 3 | PHASE_4_SOFT_DELETES.sql | 5s | ⏳ THEN THIS |

**Total Time:** 15 seconds
**Total Risk:** Very Low

---

## ✅ After All 3 Steps

- ✅ takeoff_history table created
- ✅ All audit columns added
- ✅ 30+ views created
- ✅ 4 helper functions created
- ✅ Soft deletes fully functional

---

## 🚀 Next Steps

After completing all 3 steps:

1. Test soft delete: `SELECT soft_delete_project('id', 'user', 'reason');`
2. View deleted: `SELECT * FROM v_projects_deleted;`
3. Restore: `SELECT restore_project('id');`

**Phase 4 is complete!** ✅

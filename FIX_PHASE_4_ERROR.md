# Fix Phase 4 Error - Missing Audit Columns

## ❌ Error
```
ERROR: column "deleted_at" does not exist (SQLSTATE 42703)
```

## ✅ Solution

The audit columns (`deleted_at`, `deleted_by`, `created_by`, `updated_by`) don't exist in your database yet!

### Step 1: Add Audit Columns

1. Go to https://console.neon.tech
2. Click **"SQL Editor"**
3. Copy entire content from `ADD_AUDIT_COLUMNS.sql`
4. Paste into SQL Editor
5. Click **"Execute"**

### Step 2: Verify Columns Were Added

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND column_name IN ('created_by', 'updated_by', 'deleted_at', 'deleted_by')
ORDER BY column_name;

-- Should show 4 columns
```

### Step 3: Now Run Phase 4

After columns are added, run `PHASE_4_SOFT_DELETES.sql`:

1. Go to SQL Editor
2. Copy from `PHASE_4_SOFT_DELETES.sql`
3. Paste & Execute

---

## 📝 What's Happening

### Schema vs Database Mismatch

Your **schema.ts** file (Phase 1) defined the audit columns, but your **actual database** doesn't have them yet!

This is because:
1. Phase 1 updated the schema definition
2. But didn't run migrations to update the database
3. Phase 4 tries to use columns that don't exist

### Solution

Add the columns to your existing tables using `ADD_AUDIT_COLUMNS.sql`

---

## 🔄 Correct Order

1. ✅ **Phase 1:** Update schema.ts (DONE)
2. ✅ **Phase 2:** Standardize naming (DONE)
3. ✅ **Phase 3:** Add indexes (DONE)
4. ⏳ **ADD AUDIT COLUMNS:** Add missing columns (DO THIS NOW)
5. ⏳ **Phase 4:** Create soft delete views (DO AFTER)

---

## ⚡ Quick Fix (2 minutes)

```sql
-- Copy and paste this into SQL Editor:

-- Add audit columns to projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add audit columns to drawings
ALTER TABLE drawings
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add audit columns to takeoffs
ALTER TABLE takeoffs
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add audit columns to saved_analyses
ALTER TABLE saved_analyses
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add audit columns to product_skus
ALTER TABLE product_skus
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add audit columns to suppliers
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add audit columns to change_orders
ALTER TABLE change_orders
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add audit columns to material_pricing
ALTER TABLE material_pricing
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add audit columns to project_pricing
ALTER TABLE project_pricing
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add audit columns to trade_classes
ALTER TABLE trade_classes
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add audit columns to estimate_templates
ALTER TABLE estimate_templates
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add audit columns to cost_escalation
ALTER TABLE cost_escalation
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add audit columns to profit_margin_settings
ALTER TABLE profit_margin_settings
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add audit columns to material_costs
ALTER TABLE material_costs
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add audit columns to regional_cost_database
ALTER TABLE regional_cost_database
ADD COLUMN IF NOT EXISTS created_by VARCHAR,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add audit columns to takeoff_history
ALTER TABLE takeoff_history
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;

-- Add audit columns to cost_history
ALTER TABLE cost_history
ADD COLUMN IF NOT EXISTS created_by VARCHAR;
```

---

## ✅ After Adding Columns

Once columns are added:

1. Run `PHASE_4_SOFT_DELETES.sql` to create views
2. Views will work correctly
3. Soft deletes are enabled

---

## 📋 Checklist

- [ ] Backup database
- [ ] Run `ADD_AUDIT_COLUMNS.sql`
- [ ] Verify columns were added
- [ ] Run `PHASE_4_SOFT_DELETES.sql`
- [ ] Verify views were created
- [ ] Test soft delete functionality

---

## 🆘 Still Getting Error?

If you still get the error after adding columns:

1. Verify columns exist:
```sql
SELECT * FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'deleted_at';
```

2. If no results, columns weren't added
3. Try running the SQL again
4. Check for error messages

---

## 💡 Why This Happened

Your schema definition (Phase 1) was updated, but the actual database wasn't migrated. This is normal - you need to:

1. Update schema definition ✅ (Phase 1)
2. Run migrations to update database ⏳ (ADD_AUDIT_COLUMNS.sql)
3. Create views/functions ⏳ (Phase 4)

---

## 🚀 Next Steps

1. Execute `ADD_AUDIT_COLUMNS.sql` NOW
2. Then execute `PHASE_4_SOFT_DELETES.sql`
3. Phase 4 will work correctly!

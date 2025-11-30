# How to Delete Demo Data & Cleanup Database

## ⚠️ CRITICAL: BACKUP FIRST!

**ALWAYS backup your database before running any DELETE commands!**

### Step 1: Backup Your Database

#### Option A: Using Neon Console
1. Go to https://console.neon.tech
2. Select your project
3. Go to "Backups" tab
4. Click "Create backup"
5. Wait for backup to complete

#### Option B: Using Command Line
```bash
# Set your DATABASE_URL environment variable first
export DATABASE_URL="postgresql://user:password@host/database"

# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh backup_*.sql
```

---

## Step 2: Choose Your Cleanup Option

### Option 1: DELETE ALL DATA (Keep Tables) ✅ RECOMMENDED
**Use this if:** You want to keep the database structure but remove all demo data

```bash
# Connect to your database
psql $DATABASE_URL

# Copy and paste the SQL from DELETE_DEMO_DATA.sql - OPTION 1
# This will:
# - Delete all data from all tables
# - Keep all table structures
# - Reset auto-increment IDs
# - Verify all tables are empty
```

**Time:** ~5 seconds
**Risk:** Low (can restore from backup)
**Reversible:** Yes (restore from backup)

---

### Option 2: DELETE UNUSED TABLES ✅ SAFE
**Use this if:** You want to remove tables you don't need

```bash
# Connect to your database
psql $DATABASE_URL

# Copy and paste from DELETE_DEMO_DATA.sql - OPTION 2
# This will:
# - Delete material_costs table (redundant)
# - Optionally delete regional_cost_database
# - Optionally delete cost_history
# - Optionally delete cost_escalation
# - Optionally delete profit_margin_settings
```

**Tables to Delete:**
- ✅ `material_costs` - SAFE (redundant with product_skus)
- ⚠️ `regional_cost_database` - OPTIONAL (only if not using regional pricing)
- ⚠️ `cost_history` - OPTIONAL (only if not tracking price history)
- ⚠️ `cost_escalation` - OPTIONAL (only if not tracking inflation)
- ⚠️ `profit_margin_settings` - OPTIONAL (only if using simple markups)

---

### Option 3: COMPLETE CLEANUP ⚠️ AGGRESSIVE
**Use this if:** You want to delete all optional tables AND all data

```bash
# Connect to your database
psql $DATABASE_URL

# Copy and paste from DELETE_DEMO_DATA.sql - OPTION 3
# This will:
# - Delete ALL data from all tables
# - Delete material_costs
# - Delete regional_cost_database
# - Delete cost_history
# - Delete cost_escalation
# - Delete profit_margin_settings
```

**Risk:** Medium (removes optional features)
**Reversible:** Yes (restore from backup)

---

### Option 4: KEEP STRUCTURE, DELETE ONLY DEMO DATA
**Use this if:** You want to keep everything but just clear old data

```bash
# Connect to your database
psql $DATABASE_URL

# Copy and paste from DELETE_DEMO_DATA.sql - OPTION 4
# This will:
# - Delete all data created before NOW()
# - Keep all table structures
# - Keep all optional tables
```

---

## Step 3: Execute the SQL

### Using Neon Console:
1. Go to https://console.neon.tech
2. Select your project
3. Click "SQL Editor"
4. Paste the SQL from DELETE_DEMO_DATA.sql
5. Click "Execute"
6. Verify the results

### Using Command Line:
```bash
# Option 1: Interactive
psql $DATABASE_URL
# Paste SQL and execute

# Option 2: From file
psql $DATABASE_URL < DELETE_DEMO_DATA.sql

# Option 3: From file with output
psql $DATABASE_URL < DELETE_DEMO_DATA.sql > cleanup_results.txt
```

---

## Step 4: Verify Cleanup

After running the cleanup, verify the results:

```sql
-- Check row counts
SELECT 
  tablename,
  (SELECT COUNT(*) FROM pg_class WHERE relname = tablename) as row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check specific tables
SELECT COUNT(*) FROM projects;
SELECT COUNT(*) FROM drawings;
SELECT COUNT(*) FROM takeoffs;
SELECT COUNT(*) FROM product_skus;
```

Expected output: All should show `0` rows (or table doesn't exist)

---

## Step 5: Restart Your Application

After cleanup, restart your application:

```bash
# Stop the application
Ctrl+C

# Clear any cached data
npm run clean  # if available

# Restart
npm run dev
```

---

## Troubleshooting

### Error: "Cannot delete from table X because of foreign key constraint"
**Solution:** Delete in the correct order (see DELETE_DEMO_DATA.sql)

### Error: "Table does not exist"
**Solution:** Table was already deleted or doesn't exist (safe to ignore)

### Error: "Permission denied"
**Solution:** Your database user doesn't have DELETE permissions
- Contact your database administrator
- Or use Neon Console instead of command line

### Want to Undo?
```bash
# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

---

## Recommended Cleanup Plan

### For Development:
1. ✅ Backup database
2. ✅ Run Option 1 (delete all data)
3. ✅ Restart application
4. ✅ Test with fresh data

### For Production:
1. ✅ Backup database
2. ✅ Run Option 2 (delete only material_costs)
3. ✅ Monitor application
4. ✅ Keep other tables for historical data

### For Minimal Database:
1. ✅ Backup database
2. ✅ Run Option 3 (complete cleanup)
3. ✅ Restart application
4. ✅ Test thoroughly

---

## Summary

| Option | Data | Tables | Risk | Time |
|--------|------|--------|------|------|
| 1 | Delete | Keep | Low | 5s |
| 2 | Keep | Delete | Low | 5s |
| 3 | Delete | Delete | Medium | 5s |
| 4 | Delete | Keep | Low | 5s |

**Recommended:** Start with Option 1 for development, Option 2 for production.

---

## Need Help?

1. Check the SQL file: `DELETE_DEMO_DATA.sql`
2. Review the error message
3. Check Neon documentation: https://neon.tech/docs
4. Restore from backup if needed

**Remember:** Always backup before running DELETE commands!

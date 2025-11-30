# Phase 4: Soft Deletes - Quick Start

## 🗑️ What This Does

Enables **archiving instead of deletion**:
- ✅ Delete items without losing data
- ✅ Preserve audit trail
- ✅ Restore deleted items
- ✅ Automatic filtering in queries
- ✅ Compliance & data retention

**Time:** 5-10 seconds
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
3. Copy entire content from `PHASE_4_SOFT_DELETES.sql`
4. Paste into SQL Editor
5. Click **"Execute"**

### Step 3: Verify
```sql
-- Check views were created
SELECT COUNT(*) FROM pg_views WHERE viewname LIKE 'v_%';
-- Should show 30+
```

### Step 4: Update Your Code
Change your queries from:
```sql
-- OLD (includes deleted records)
SELECT * FROM projects;

-- NEW (excludes deleted records)
SELECT * FROM v_projects_active;
```

### Step 5: Done! ✅
Your database now supports archiving!

---

## 📊 What Gets Created

### Views for Active Records (15)
- v_projects_active
- v_drawings_active
- v_takeoffs_active
- v_saved_analyses_active
- v_product_skus_active
- v_trade_classes_active
- v_project_pricing_active
- v_suppliers_active
- v_material_pricing_active
- v_change_orders_active
- v_profit_margin_settings_active
- v_cost_escalation_active
- v_material_costs_active
- v_regional_cost_database_active
- v_estimate_templates_active

### Views for Deleted Records (8)
- v_projects_deleted
- v_drawings_deleted
- v_takeoffs_deleted
- v_saved_analyses_deleted
- v_product_skus_deleted
- v_suppliers_deleted
- v_change_orders_deleted

### Helper Functions (4)
- soft_delete_project() - Archive a project
- restore_project() - Restore a project
- soft_delete_drawing() - Archive a drawing
- restore_drawing() - Restore a drawing
- hard_delete_project() - Permanently delete

---

## 🔄 Soft Delete Workflow

### Archive a Project
```sql
-- Soft delete (archive) a project
SELECT soft_delete_project('project-id', 'user-id', 'No longer needed');

-- Project is marked as deleted but data is preserved
-- Queries automatically exclude it
```

### View Deleted Projects
```sql
-- See all archived projects
SELECT * FROM v_projects_deleted;

-- See deletion info
SELECT id, name, deleted_at, deleted_by FROM v_projects_deleted;
```

### Restore a Project
```sql
-- Restore an archived project
SELECT restore_project('project-id');

-- Project reappears in active queries
```

### Permanently Delete
```sql
-- Hard delete (use with caution!)
SELECT hard_delete_project('project-id');

-- This CANNOT be undone!
```

---

## 📝 Query Changes

### Before Soft Deletes
```sql
-- Old queries (include deleted records)
SELECT * FROM projects;
SELECT * FROM drawings WHERE project_id = 'xxx';
SELECT * FROM takeoffs WHERE drawing_id = 'yyy';
```

### After Soft Deletes
```sql
-- New queries (exclude deleted records)
SELECT * FROM v_projects_active;
SELECT * FROM v_drawings_active WHERE project_id = 'xxx';
SELECT * FROM v_takeoffs_active WHERE drawing_id = 'yyy';
```

---

## 🎯 Use Cases

### Archive a Project
```sql
-- User deletes a project
SELECT soft_delete_project('proj-123', 'user-456', 'Project completed');

-- Project is archived but data is preserved
-- Appears in v_projects_deleted view
-- Can be restored later
```

### View Archive
```sql
-- Admin views archived projects
SELECT * FROM v_projects_deleted ORDER BY deleted_at DESC;

-- See who deleted what and when
SELECT id, name, deleted_by, deleted_at FROM v_projects_deleted;
```

### Restore from Archive
```sql
-- User wants to restore a project
SELECT restore_project('proj-123');

-- Project reappears in active queries
-- All related items (drawings, takeoffs) are restored
```

### Permanently Delete
```sql
-- Admin permanently deletes archived project
SELECT hard_delete_project('proj-123');

-- All data is permanently deleted
-- This action cannot be undone!
```

---

## 💾 Data Preservation

### What Gets Archived
- ✅ Projects
- ✅ Drawings
- ✅ Takeoffs
- ✅ Analyses
- ✅ All related data

### Cascading Deletes
When you delete a project:
1. Project marked as deleted
2. All drawings marked as deleted
3. All takeoffs marked as deleted
4. All analyses marked as deleted
5. Related data preserved

---

## 🔍 Audit Trail

### Track Deletions
```sql
-- See who deleted what
SELECT 
  id, 
  name, 
  deleted_by, 
  deleted_at 
FROM v_projects_deleted 
ORDER BY deleted_at DESC;
```

### Deletion Statistics
```sql
-- Count active vs deleted
SELECT 
  'Active' as status, COUNT(*) FROM v_projects_active
UNION ALL
SELECT 
  'Deleted' as status, COUNT(*) FROM v_projects_deleted;
```

---

## ✅ Verification

After running the SQL:

```sql
-- Count views created
SELECT COUNT(*) FROM pg_views WHERE viewname LIKE 'v_%';
-- Should show 30+

-- List all views
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' AND viewname LIKE 'v_%'
ORDER BY viewname;

-- Test a view
SELECT COUNT(*) FROM v_projects_active;
```

---

## 🆘 Troubleshooting

### Error: "View already exists"
**Solution:** Safe to ignore (views already created)

### Error: "Function already exists"
**Solution:** Safe to ignore (functions already created)

### Want to Remove Views?
```sql
-- Drop all views and functions
DROP FUNCTION IF EXISTS soft_delete_project(VARCHAR, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS restore_project(VARCHAR);
DROP FUNCTION IF EXISTS soft_delete_drawing(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS restore_drawing(VARCHAR);
DROP FUNCTION IF EXISTS hard_delete_project(VARCHAR);
DROP VIEW IF EXISTS v_projects_active;
-- ... etc
```

---

## 📋 Next Steps

### Update Application Code
1. Replace table queries with view queries
2. Add delete button that calls soft_delete_project()
3. Add restore button that calls restore_project()
4. Add archive view to show deleted items

### Example (Node.js/Express)
```javascript
// Delete a project (soft delete)
app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  
  await db.query(
    'SELECT soft_delete_project($1, $2, $3)',
    [id, userId, 'User deleted']
  );
  
  res.json({ success: true });
});

// Get active projects
app.get('/api/projects', async (req, res) => {
  const projects = await db.query('SELECT * FROM v_projects_active');
  res.json(projects.rows);
});

// Get deleted projects (archive)
app.get('/api/projects/archive', async (req, res) => {
  const projects = await db.query('SELECT * FROM v_projects_deleted');
  res.json(projects.rows);
});

// Restore a project
app.post('/api/projects/:id/restore', async (req, res) => {
  const { id } = req.params;
  
  await db.query('SELECT restore_project($1)', [id]);
  
  res.json({ success: true });
});
```

---

## 📊 Summary

| Aspect | Details |
|--------|---------|
| **Views** | 30+ |
| **Functions** | 4 |
| **Archive Support** | Yes |
| **Restore Support** | Yes |
| **Audit Trail** | Yes |
| **Data Preservation** | Yes |
| **Cascading Deletes** | Yes |
| **Time to Execute** | 5-10s |
| **Risk Level** | Very Low |
| **Reversible** | Yes |

**Status:** ✅ Ready to implement!

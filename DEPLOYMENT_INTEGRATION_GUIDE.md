# Deployment Integration Guide - Database Optimization

## 🎯 Overview

Your database has been fully optimized with 7 phases. Now you need to update your application code to use the new features.

**Current Setup:**
- ✅ API & ML: GCP
- ✅ Frontend: Vercel
- ✅ Database: Neon PostgreSQL

---

## 📋 What Changed in the Database

### Phase 1-2: Schema Cleanup (Already in schema.ts)
- ✅ snake_case naming (already implemented)
- ✅ Audit columns added (created_by, updated_by, deleted_at, deleted_by)
- ✅ takeoff_history table created

### Phase 3: Indexes (Database only)
- ✅ 34 performance indexes created
- No code changes needed

### Phase 4: Soft Deletes (NEW - Requires Code Changes)
- ✅ 23 views created (v_*_active, v_*_deleted)
- ✅ 4 helper functions created
- **ACTION:** Update queries to use views

### Phase 5: Versioning (NEW - Requires Code Changes)
- ✅ 4 versioning tables created
- ✅ 4 helper functions created
- **ACTION:** Call functions before updates

### Phase 6: Relationships (Database only)
- ✅ 18 CASCADE DELETE rules added
- No code changes needed (automatic)

### Phase 7: Computed Columns (NEW - Requires Code Changes)
- ✅ 7 computed columns added
- ✅ 8 summary views created
- **ACTION:** Use computed columns in queries

---

## 🔄 Code Changes Required

### 1. Update Soft Delete Queries

**File:** `api/storage.ts`

#### OLD CODE (Hard Delete)
```typescript
async deleteProject(id: string): Promise<boolean> {
  const result = await db.delete(projects).where(eq(projects.id, id));
  return (result.rowCount || 0) > 0;
}
```

#### NEW CODE (Soft Delete)
```typescript
async deleteProject(id: string, deletedBy?: string): Promise<boolean> {
  const result = await db
    .update(projects)
    .set({ 
      deleted_at: new Date(),
      deleted_by: deletedBy,
      updated_at: new Date()
    })
    .where(eq(projects.id, id));
  return (result.rowCount || 0) > 0;
}
```

---

### 2. Update Active Record Queries

**File:** `api/storage.ts`

#### OLD CODE
```typescript
async getProjects(): Promise<Project[]> {
  return await db.select().from(projects);
}
```

#### NEW CODE (Use Active View)
```typescript
async getProjects(): Promise<Project[]> {
  // Query the active view instead of raw table
  return await db.select().from(sql`v_projects_active`);
}
```

Or better, create a view reference:
```typescript
// In schema.ts
export const projects_active = sql`v_projects_active`;

// In storage.ts
async getProjects(): Promise<Project[]> {
  return await db.select().from(projects_active);
}
```

---

### 3. Add Versioning Support

**File:** `api/storage.ts`

#### Before Updating Material Pricing
```typescript
async updateMaterialPricing(
  id: string, 
  pricing: Partial<InsertMaterialPricing>
): Promise<MaterialPricing | undefined> {
  // Create version BEFORE updating
  await db.execute(
    sql`SELECT create_material_pricing_version(${id}, ${userId}, ${reason})`
  );
  
  // Now update
  const [result] = await db
    .update(materialPricing)
    .set({ ...pricing, last_updated: new Date() })
    .where(eq(materialPricing.id, id))
    .returning();
  return result;
}
```

---

### 4. Use Computed Columns

**File:** `api/storage.ts`

#### OLD CODE (Manual Calculation)
```typescript
async getTakeoff(id: string): Promise<Takeoff | undefined> {
  const [takeoff] = await db
    .select()
    .from(takeoffs)
    .where(eq(takeoffs.id, id));
  
  // Manual calculation
  if (takeoff) {
    takeoff.totalCostWithMarkup = takeoff.totalCost * 1.2;
  }
  return takeoff;
}
```

#### NEW CODE (Auto-Calculated)
```typescript
async getTakeoff(id: string): Promise<Takeoff | undefined> {
  const [takeoff] = await db
    .select()
    .from(takeoffs)
    .where(eq(takeoffs.id, id));
  
  // total_cost_with_markup is auto-calculated!
  return takeoff;
}
```

---

### 5. Use Summary Views for Reporting

**File:** `api/storage.ts`

#### NEW CODE (Financial Reports)
```typescript
async getProjectFinancialSummary(projectId: string) {
  const [summary] = await db.execute(
    sql`SELECT * FROM v_project_financial_summary WHERE id = ${projectId}`
  );
  return summary;
}

async getProjectCostSummary(projectId: string) {
  const [summary] = await db.execute(
    sql`SELECT * FROM v_project_cost_summary WHERE id = ${projectId}`
  );
  return summary;
}
```

---

## 📝 Step-by-Step Integration

### Step 1: Update schema.ts (Optional but Recommended)

Add view references:
```typescript
// Add at the end of schema.ts
export const projects_active = sql`v_projects_active`;
export const drawings_active = sql`v_drawings_active`;
export const takeoffs_active = sql`v_takeoffs_active`;
// ... etc for all views
```

### Step 2: Update storage.ts - Soft Deletes

Replace all `deleteX` methods to use soft delete:
```typescript
// Projects
async deleteProject(id: string, deletedBy?: string): Promise<boolean> {
  const result = await db
    .update(projects)
    .set({ deleted_at: new Date(), deleted_by: deletedBy })
    .where(eq(projects.id, id));
  return (result.rowCount || 0) > 0;
}

// Drawings
async deleteDrawing(id: string, deletedBy?: string): Promise<boolean> {
  const result = await db
    .update(drawings)
    .set({ deleted_at: new Date(), deleted_by: deletedBy })
    .where(eq(drawings.id, id));
  return (result.rowCount || 0) > 0;
}

// Takeoffs
async deleteTakeoff(id: string, deletedBy?: string): Promise<boolean> {
  const result = await db
    .update(takeoffs)
    .set({ deleted_at: new Date(), deleted_by: deletedBy })
    .where(eq(takeoffs.id, id));
  return (result.rowCount || 0) > 0;
}
```

### Step 3: Update storage.ts - Active Queries

Update all `getX` methods to use active views:
```typescript
async getProjects(): Promise<Project[]> {
  return await db.select().from(sql`v_projects_active`);
}

async getDrawingsByProject(projectId: string): Promise<Drawing[]> {
  return await db
    .select()
    .from(sql`v_drawings_active`)
    .where(eq(sql`project_id`, projectId));
}

async getTakeoffsByDrawing(drawingId: string): Promise<Takeoff[]> {
  return await db
    .select()
    .from(sql`v_takeoffs_active`)
    .where(eq(sql`drawing_id`, drawingId));
}
```

### Step 4: Add Versioning Methods

```typescript
async createMaterialPricingVersion(
  id: string,
  changedBy?: string,
  changeReason?: string
): Promise<number> {
  const result = await db.execute(
    sql`SELECT create_material_pricing_version(${id}, ${changedBy}, ${changeReason})`
  );
  return result[0].create_material_pricing_version;
}

async updateMaterialPricing(
  id: string,
  pricing: Partial<InsertMaterialPricing>,
  changedBy?: string,
  changeReason?: string
): Promise<MaterialPricing | undefined> {
  // Create version first
  if (changedBy) {
    await this.createMaterialPricingVersion(id, changedBy, changeReason);
  }
  
  // Then update
  const [result] = await db
    .update(materialPricing)
    .set({ ...pricing, last_updated: new Date() })
    .where(eq(materialPricing.id, id))
    .returning();
  return result;
}
```

### Step 5: Add Financial Summary Methods

```typescript
async getProjectFinancialSummary(projectId: string) {
  const result = await db.execute(
    sql`SELECT * FROM v_project_financial_summary WHERE id = ${projectId}`
  );
  return result[0];
}

async getProjectCostSummary(projectId: string) {
  const result = await db.execute(
    sql`SELECT * FROM v_project_cost_summary WHERE id = ${projectId}`
  );
  return result[0];
}

async getSkuCostAnalysis(skuId: string) {
  const result = await db.execute(
    sql`SELECT * FROM v_sku_cost_analysis WHERE id = ${skuId}`
  );
  return result[0];
}
```

---

## 🚀 Deployment Steps

### 1. Commit Code Changes
```bash
git add .
git commit -m "feat: integrate database optimization phases 4-7

- Update soft delete queries to use deleted_at column
- Update active record queries to use v_*_active views
- Add versioning support for pricing changes
- Add financial summary views
- Use computed columns for auto-calculations"
git push
```

### 2. Deploy to GCP (API)
```bash
# Your existing GCP deployment process
gcloud app deploy
# or
gcloud functions deploy
# or your CI/CD pipeline
```

### 3. Deploy to Vercel (Frontend)
```bash
# Your existing Vercel deployment
vercel deploy --prod
# or automatic via GitHub
```

### 4. Verify Deployment
```bash
# Test soft deletes
curl -X DELETE https://your-api.com/api/projects/project-id

# Test active queries
curl https://your-api.com/api/projects

# Test financial summaries
curl https://your-api.com/api/projects/project-id/financial-summary
```

---

## 📊 API Endpoint Changes

### Before (Hard Delete)
```
DELETE /api/projects/:id
- Permanently deletes project
- Cascades to all children
- Data is lost
```

### After (Soft Delete)
```
DELETE /api/projects/:id
- Archives project (sets deleted_at)
- Data is preserved
- Can be restored
- Audit trail maintained
```

### New Endpoints (Optional)
```
GET /api/projects/archived
- Returns deleted projects

POST /api/projects/:id/restore
- Restores archived project

GET /api/projects/:id/financial-summary
- Returns financial analysis

GET /api/projects/:id/cost-summary
- Returns cost breakdown
```

---

## ✅ Verification Checklist

After deployment:

- [ ] Soft deletes work (projects marked as deleted, not removed)
- [ ] Active queries exclude deleted records
- [ ] Versioning tracks pricing changes
- [ ] Computed columns auto-calculate
- [ ] Financial summaries return correct data
- [ ] Cascade deletes work (deleting project deletes children)
- [ ] Audit trail shows who deleted what and when

---

## 🆘 Rollback Plan

If issues occur:

### Option 1: Revert Code Changes
```bash
git revert HEAD
git push
# Redeploy to GCP and Vercel
```

### Option 2: Restore Database Backup
```bash
# In Neon Console
# Go to Backups → Restore
# Select backup before Phase 4-7
```

### Option 3: Disable Soft Deletes (Temporary)
Update queries to use raw tables instead of views:
```typescript
// Temporarily use raw tables
return await db.select().from(projects);
// Instead of
return await db.select().from(sql`v_projects_active`);
```

---

## 📚 Additional Resources

- **Soft Delete Workflow:** See `PHASE_4_QUICK_START.md`
- **Versioning Guide:** See `PHASE_5_QUICK_START.md`
- **Computed Columns:** See `PHASE_7_QUICK_START.md`
- **Database Views:** Run `VERIFY_PHASE_7.sql` to list all views

---

## 🎉 Summary

**To make changes live:**

1. ✅ Update `api/storage.ts` with new methods
2. ✅ Commit and push code
3. ✅ Deploy to GCP (API)
4. ✅ Deploy to Vercel (Frontend)
5. ✅ Verify endpoints work

**No database changes needed** - all SQL is already in place!

Just update your application code to use the new features. 🚀

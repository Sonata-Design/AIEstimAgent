import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb, boolean, check } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location"),
  address: text("address"),
  client: text("client"),
  status: text("status").notNull().default("active"), // active, completed, archived
  created_by: varchar("created_by"), // User ID who created
  updated_by: varchar("updated_by"), // User ID who last updated
  deleted_at: timestamp("deleted_at"), // Soft delete timestamp
  deleted_by: varchar("deleted_by"), // User ID who deleted
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const drawings = pgTable("drawings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: varchar("project_id").references(() => projects.id).notNull(),
  name: text("name").notNull(),
  filename: text("filename").notNull(),
  file_url: text("file_url").notNull(),
  file_type: text("file_type").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, complete, error
  scale: text("scale").default("1/4\" = 1'"),
  is_ai_processed: boolean("is_ai_processed").default(false),
  created_by: varchar("created_by"),
  updated_by: varchar("updated_by"),
  deleted_at: timestamp("deleted_at"),
  deleted_by: varchar("deleted_by"),
  uploaded_at: timestamp("uploaded_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const takeoffs = pgTable("takeoffs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  drawing_id: varchar("drawing_id").references(() => drawings.id).notNull(),
  element_type: text("element_type").notNull(), // doors, windows, flooring, walls, electrical, plumbing
  element_name: text("element_name").notNull(),
  item_type: text("item_type").notNull(), // display name for UI
  quantity: integer("quantity").default(0),
  area: real("area"), // for area measurements
  length: real("length"), // for linear measurements
  width: real("width"),
  height: real("height"),
  unit: text("unit").notNull(), // sq ft, ft, count, etc.
  coordinates: jsonb("coordinates"), // x, y coordinates for annotations
  is_detected_by_ai: boolean("is_detected_by_ai").default(false),
  cost_per_unit: real("cost_per_unit"),
  total_cost: real("total_cost"),
  is_manually_edited: boolean("is_manually_edited").default(false),
  custom_pricing: jsonb("custom_pricing"), // Store custom pricing overrides
  linked_sku_id: varchar("linked_sku_id").references(() => product_skus.id),
  notes: text("notes"),
  is_verified: boolean("is_verified").default(false),
  created_by: varchar("created_by"),
  updated_by: varchar("updated_by"),
  deleted_at: timestamp("deleted_at"),
  deleted_by: varchar("deleted_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Takeoff history table for tracking changes
export const takeoff_history = pgTable("takeoff_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  takeoff_id: varchar("takeoff_id").references(() => takeoffs.id).notNull(),
  previous_values: jsonb("previous_values").notNull(), // Store all previous field values
  changed_fields: jsonb("changed_fields").notNull(), // Array of field names that changed
  changed_by: varchar("changed_by"),
  change_reason: text("change_reason"),
  created_at: timestamp("created_at").defaultNow(),
});

// Add saved analyses table
export const saved_analyses = pgTable("saved_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: varchar("project_id").references(() => projects.id).notNull(),
  drawing_id: varchar("drawing_id").references(() => drawings.id),
  name: text("name").notNull(),
  description: text("description"),
  analysis_data: jsonb("analysis_data").notNull(), // stores the complete analysis results
  total_items: integer("total_items").default(0),
  total_cost: real("total_cost").default(0),
  element_types: jsonb("element_types"), // array of analyzed element types
  created_by: varchar("created_by"),
  updated_by: varchar("updated_by"),
  deleted_at: timestamp("deleted_at"),
  deleted_by: varchar("deleted_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const material_costs = pgTable("material_costs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  item_name: text("item_name").notNull(),
  unit: text("unit").notNull(),
  material_cost: real("material_cost").notNull(),
  labor_cost: real("labor_cost").notNull(),
  description: text("description"),
  created_by: varchar("created_by"),
  updated_by: varchar("updated_by"),
  deleted_at: timestamp("deleted_at"),
  deleted_by: varchar("deleted_by"),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Trade classifications for organizing SKUs and pricing
export const trade_classes = pgTable("trade_classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  parent_id: varchar("parent_id"),
  created_by: varchar("created_by"),
  updated_by: varchar("updated_by"),
  deleted_at: timestamp("deleted_at"),
  deleted_by: varchar("deleted_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Product SKUs organized by trade class
export const product_skus = pgTable("product_skus", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  trade_class_id: varchar("trade_class_id").references(() => trade_classes.id).notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  unit: text("unit").notNull(),
  unit_size: real("unit_size"),
  unit_description: text("unit_description"),
  material_cost: real("material_cost").notNull(),
  labor_cost: real("labor_cost").notNull(),
  markup_percentage: real("markup_percentage").default(0.20),
  tags: jsonb("tags"),
  specifications: jsonb("specifications"),
  vendor: text("vendor"),
  vendor_sku: text("vendor_sku"),
  is_active: boolean("is_active").default(true),
  created_by: varchar("created_by"),
  updated_by: varchar("updated_by"),
  deleted_at: timestamp("deleted_at"),
  deleted_by: varchar("deleted_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Project-specific custom pricing overrides
export const project_pricing = pgTable("project_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: varchar("project_id").references(() => projects.id).notNull(),
  sku_id: varchar("sku_id").references(() => product_skus.id),
  custom_sku: text("custom_sku"),
  item_name: text("item_name").notNull(),
  unit: text("unit").notNull(),
  material_cost: real("material_cost").notNull(),
  labor_cost: real("labor_cost").notNull(),
  markup_percentage: real("markup_percentage").default(0.20),
  notes: text("notes"),
  is_custom: boolean("is_custom").default(false),
  created_by: varchar("created_by"),
  updated_by: varchar("updated_by"),
  deleted_at: timestamp("deleted_at"),
  deleted_by: varchar("deleted_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Estimate templates by trade class
export const estimate_templates = pgTable("estimate_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  trade_class_id: varchar("trade_class_id").references(() => trade_classes.id).notNull(),
  template_data: jsonb("template_data").notNull(),
  is_public: boolean("is_public").default(false),
  created_by: varchar("created_by"),
  updated_by: varchar("updated_by"),
  deleted_at: timestamp("deleted_at"),
  deleted_by: varchar("deleted_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Define relations
export const projectsRelations = relations(projects, ({ many }) => ({
  drawings: many(drawings),
  saved_analyses: many(saved_analyses),
  project_pricing: many(project_pricing),
}));

export const trade_classesRelations = relations(trade_classes, ({ one, many }) => ({
  parent: one(trade_classes, {
    fields: [trade_classes.parent_id],
    references: [trade_classes.id],
    relationName: "tradeClassParent",
  }),
  children: many(trade_classes, {
    relationName: "tradeClassParent",
  }),
  product_skus: many(product_skus),
  estimate_templates: many(estimate_templates),
}));

export const product_skusRelations = relations(product_skus, ({ one, many }) => ({
  trade_class: one(trade_classes, {
    fields: [product_skus.trade_class_id],
    references: [trade_classes.id],
  }),
  project_pricing: many(project_pricing),
}));

export const project_pricingRelations = relations(project_pricing, ({ one }) => ({
  project: one(projects, {
    fields: [project_pricing.project_id],
    references: [projects.id],
  }),
  sku: one(product_skus, {
    fields: [project_pricing.sku_id],
    references: [product_skus.id],
  }),
}));

export const estimate_templatesRelations = relations(estimate_templates, ({ one }) => ({
  trade_class: one(trade_classes, {
    fields: [estimate_templates.trade_class_id],
    references: [trade_classes.id],
  }),
}));

export const drawingsRelations = relations(drawings, ({ one, many }) => ({
  project: one(projects, {
    fields: [drawings.project_id],
    references: [projects.id],
  }),
  takeoffs: many(takeoffs),
}));

export const takeoffsRelations = relations(takeoffs, ({ one }) => ({
  drawing: one(drawings, {
    fields: [takeoffs.drawing_id],
    references: [drawings.id],
  }),
}));

export const saved_analysesRelations = relations(saved_analyses, ({ one }) => ({
  project: one(projects, {
    fields: [saved_analyses.project_id],
    references: [projects.id],
  }),
  drawing: one(drawings, {
    fields: [saved_analyses.drawing_id],
    references: [drawings.id],
  }),
}));

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertDrawingSchema = createInsertSchema(drawings).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertTakeoffSchema = createInsertSchema(takeoffs).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertMaterialCostSchema = createInsertSchema(material_costs).omit({
  id: true,
  updated_at: true,
});

export const insertSavedAnalysisSchema = createInsertSchema(saved_analyses).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertTradeClassSchema = createInsertSchema(trade_classes).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertProductSkuSchema = createInsertSchema(product_skus).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertProjectPricingSchema = createInsertSchema(project_pricing).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertEstimateTemplateSchema = createInsertSchema(estimate_templates).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Types
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertDrawing = z.infer<typeof insertDrawingSchema>;
export type Drawing = typeof drawings.$inferSelect;

export type InsertTakeoff = z.infer<typeof insertTakeoffSchema>;
export type Takeoff = typeof takeoffs.$inferSelect;

export type InsertMaterialCost = z.infer<typeof insertMaterialCostSchema>;
export type MaterialCost = typeof material_costs.$inferSelect;

export type InsertSavedAnalysis = z.infer<typeof insertSavedAnalysisSchema>;
export type SavedAnalysis = typeof saved_analyses.$inferSelect;

export type InsertTradeClass = z.infer<typeof insertTradeClassSchema>;
export type TradeClass = typeof trade_classes.$inferSelect;

export type InsertProductSku = z.infer<typeof insertProductSkuSchema>;
export type ProductSku = typeof product_skus.$inferSelect;

export type InsertProjectPricing = z.infer<typeof insertProjectPricingSchema>;
export type ProjectPricing = typeof project_pricing.$inferSelect;

export type InsertEstimateTemplate = z.infer<typeof insertEstimateTemplateSchema>;
export type EstimateTemplate = typeof estimate_templates.$inferSelect;

// Regional Cost Database Tables
export const regional_cost_database = pgTable("regional_cost_database", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  region: text("region").notNull(),
  state: text("state"),
  city: text("city"),
  zip_code: text("zip_code"),
  cost_index: real("cost_index").notNull().default(1.0),
  labor_rate: real("labor_rate"),
  material_markup: real("material_markup").default(0.15),
  created_by: varchar("created_by"),
  updated_by: varchar("updated_by"),
  deleted_at: timestamp("deleted_at"),
  deleted_by: varchar("deleted_by"),
  last_updated: timestamp("last_updated").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
});

// Supplier Management
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contact_name: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  website: text("website"),
  specialties: jsonb("specialties"),
  lead_time_days: integer("lead_time_days").default(7),
  payment_terms: text("payment_terms").default("NET 30"),
  discount_percentage: real("discount_percentage").default(0),
  rating: real("rating").default(0),
  is_active: boolean("is_active").default(true),
  notes: text("notes"),
  created_by: varchar("created_by"),
  updated_by: varchar("updated_by"),
  deleted_at: timestamp("deleted_at"),
  deleted_by: varchar("deleted_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Real-time Material Pricing
export const material_pricing = pgTable("material_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku_id: varchar("sku_id").references(() => product_skus.id).notNull(),
  supplier_id: varchar("supplier_id").references(() => suppliers.id).notNull(),
  current_price: real("current_price").notNull(),
  previous_price: real("previous_price"),
  price_change: real("price_change"),
  minimum_order_quantity: integer("minimum_order_quantity").default(1),
  volume_discounts: jsonb("volume_discounts"),
  availability: text("availability").default("in_stock"),
  created_by: varchar("created_by"),
  updated_by: varchar("updated_by"),
  deleted_at: timestamp("deleted_at"),
  deleted_by: varchar("deleted_by"),
  last_updated: timestamp("last_updated").defaultNow(),
  price_valid_until: timestamp("price_valid_until"),
  created_at: timestamp("created_at").defaultNow(),
});

// Change Order Management
export const change_orders = pgTable("change_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: varchar("project_id").references(() => projects.id).notNull(),
  change_order_number: text("change_order_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  requested_by: text("requested_by"),
  status: text("status").notNull().default("pending"),
  priority: text("priority").default("medium"),
  original_cost: real("original_cost").default(0),
  proposed_cost: real("proposed_cost").default(0),
  approved_cost: real("approved_cost"),
  actual_cost: real("actual_cost"),
  cost_impact: real("cost_impact"),
  schedule_impact_days: integer("schedule_impact_days").default(0),
  impacted_takeoffs: jsonb("impacted_takeoffs"),
  attachments: jsonb("attachments"),
  approved_by: text("approved_by"),
  approved_at: timestamp("approved_at"),
  completed_at: timestamp("completed_at"),
  created_by: varchar("created_by"),
  updated_by: varchar("updated_by"),
  deleted_at: timestamp("deleted_at"),
  deleted_by: varchar("deleted_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Profit Margin and Markup Controls
export const profit_margin_settings = pgTable("profit_margin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: varchar("project_id").references(() => projects.id),
  trade_class_id: varchar("trade_class_id").references(() => trade_classes.id),
  scope: text("scope").notNull().default("global"),
  material_markup: real("material_markup").default(0.15),
  labor_markup: real("labor_markup").default(0.25),
  equipment_markup: real("equipment_markup").default(0.20),
  subcontractor_markup: real("subcontractor_markup").default(0.10),
  general_conditions: real("general_conditions").default(0.08),
  bond_insurance: real("bond_insurance").default(0.02),
  contingency: real("contingency").default(0.05),
  profit: real("profit").default(0.10),
  is_active: boolean("is_active").default(true),
  notes: text("notes"),
  created_by: varchar("created_by"),
  updated_by: varchar("updated_by"),
  deleted_at: timestamp("deleted_at"),
  deleted_by: varchar("deleted_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Historical Cost Tracking and Trending
export const cost_history = pgTable("cost_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku_id: varchar("sku_id").references(() => product_skus.id).notNull(),
  supplier_id: varchar("supplier_id").references(() => suppliers.id),
  region_id: varchar("region_id").references(() => regional_cost_database.id),
  price: real("price").notNull(),
  labor_rate: real("labor_rate"),
  record_date: timestamp("record_date").notNull().defaultNow(),
  inflation_rate: real("inflation_rate"),
  economic_index: real("economic_index"),
  notes: text("notes"),
  created_by: varchar("created_by"),
  created_at: timestamp("created_at").defaultNow(),
});

// Cost Escalation and Inflation Adjustments
export const cost_escalation = pgTable("cost_escalation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: varchar("project_id").references(() => projects.id).notNull(),
  escalation_type: text("escalation_type").notNull(),
  rate: real("rate").notNull(),
  effective_date: timestamp("effective_date").notNull(),
  end_date: timestamp("end_date"),
  impacted_categories: jsonb("impacted_categories"),
  reason: text("reason"),
  is_active: boolean("is_active").default(true),
  created_by: varchar("created_by"),
  updated_by: varchar("updated_by"),
  deleted_at: timestamp("deleted_at"),
  deleted_by: varchar("deleted_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Add insert schemas for new tables
export const insertRegionalCostDatabaseSchema = createInsertSchema(regional_cost_database).omit({
  id: true,
  last_updated: true,
  created_at: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertMaterialPricingSchema = createInsertSchema(material_pricing).omit({
  id: true,
  last_updated: true,
  created_at: true,
});

export const insertChangeOrderSchema = createInsertSchema(change_orders).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertProfitMarginSettingsSchema = createInsertSchema(profit_margin_settings).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertCostHistorySchema = createInsertSchema(cost_history).omit({
  id: true,
  record_date: true,
  created_at: true,
});

export const insertCostEscalationSchema = createInsertSchema(cost_escalation).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Add new types
export type InsertRegionalCostDatabase = z.infer<typeof insertRegionalCostDatabaseSchema>;
export type RegionalCostDatabase = typeof regional_cost_database.$inferSelect;

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

export type InsertMaterialPricing = z.infer<typeof insertMaterialPricingSchema>;
export type MaterialPricing = typeof material_pricing.$inferSelect;

export type InsertChangeOrder = z.infer<typeof insertChangeOrderSchema>;
export type ChangeOrder = typeof change_orders.$inferSelect;

export type InsertProfitMarginSettings = z.infer<typeof insertProfitMarginSettingsSchema>;
export type ProfitMarginSettings = typeof profit_margin_settings.$inferSelect;

export type InsertCostHistory = z.infer<typeof insertCostHistorySchema>;
export type CostHistory = typeof cost_history.$inferSelect;

export type InsertCostEscalation = z.infer<typeof insertCostEscalationSchema>;
export type CostEscalation = typeof cost_escalation.$inferSelect;

import { eq, sql, and } from "drizzle-orm";
import { db } from "./db";
import { 
  projects, 
  drawings, 
  takeoffs, 
  material_costs,
  saved_analyses,
  trade_classes,
  product_skus,
  project_pricing,
  estimate_templates,
  regional_cost_database,
  suppliers,
  material_pricing,
  change_orders,
  profit_margin_settings,
  cost_history,
  cost_escalation,
  takeoff_history
} from "../shared/schema";
import { 
  type Project, type InsertProject, 
  type Drawing, type InsertDrawing, 
  type Takeoff, type InsertTakeoff, 
  type MaterialCost, type InsertMaterialCost, 
  type SavedAnalysis, type InsertSavedAnalysis,
  type TradeClass, type InsertTradeClass,
  type ProductSku, type InsertProductSku,
  type ProjectPricing, type InsertProjectPricing,
  type EstimateTemplate, type InsertEstimateTemplate,
  type RegionalCostDatabase, type InsertRegionalCostDatabase,
  type Supplier, type InsertSupplier,
  type MaterialPricing, type InsertMaterialPricing,
  type ChangeOrder, type InsertChangeOrder,
  type ProfitMarginSettings, type InsertProfitMarginSettings,
  type CostHistory, type InsertCostHistory,
  type CostEscalation, type InsertCostEscalation
} from "../shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  // Drawings
  getDrawing(id: string): Promise<Drawing | undefined>;
  getDrawingsByProject(projectId: string): Promise<Drawing[]>;
  createDrawing(drawing: InsertDrawing): Promise<Drawing>;
  
  // Takeoffs
  getTakeoff(id: string): Promise<Takeoff | undefined>;
  getTakeoffsByDrawing(drawingId: string): Promise<Takeoff[]>;
  createTakeoff(takeoff: InsertTakeoff): Promise<Takeoff>;
  createTakeoffsBatch(takeoffs: InsertTakeoff[]): Promise<Takeoff[]>;
  updateTakeoff(id: string, takeoff: Partial<InsertTakeoff>): Promise<Takeoff | undefined>;
  deleteTakeoff(id: string): Promise<boolean>;
  
  // Material Costs
  getMaterialCosts(): Promise<MaterialCost[]>;
  getMaterialCostsByCategory(category: string): Promise<MaterialCost[]>;
  createMaterialCost(cost: InsertMaterialCost): Promise<MaterialCost>;
  
  // Saved Analyses
  getSavedAnalysis(id: string): Promise<SavedAnalysis | undefined>;
  getSavedAnalysesByProject(projectId: string): Promise<SavedAnalysis[]>;
  createSavedAnalysis(analysis: InsertSavedAnalysis): Promise<SavedAnalysis>;
  updateSavedAnalysis(id: string, analysis: Partial<InsertSavedAnalysis>): Promise<SavedAnalysis | undefined>;
  deleteSavedAnalysis(id: string): Promise<boolean>;

  // Trade Classes
  getTradeClasses(): Promise<TradeClass[]>;
  getTradeClass(id: string): Promise<TradeClass | undefined>;
  createTradeClass(tradeClass: InsertTradeClass): Promise<TradeClass>;
  updateTradeClass(id: string, tradeClass: Partial<InsertTradeClass>): Promise<TradeClass | undefined>;
  deleteTradeClass(id: string): Promise<boolean>;

  // Product SKUs
  getProductSkus(): Promise<ProductSku[]>;
  getProductSkusByTradeClass(tradeClassId: string): Promise<ProductSku[]>;
  getProductSku(id: string): Promise<ProductSku | undefined>;
  searchProductSkus(query: string, tradeClassId?: string): Promise<ProductSku[]>;
  createProductSku(sku: InsertProductSku): Promise<ProductSku>;
  updateProductSku(id: string, sku: Partial<InsertProductSku>): Promise<ProductSku | undefined>;
  deleteProductSku(id: string): Promise<boolean>;

  // Project Pricing
  getProjectPricing(projectId: string): Promise<ProjectPricing[]>;
  getProjectPricingItem(id: string): Promise<ProjectPricing | undefined>;
  createProjectPricing(pricing: InsertProjectPricing): Promise<ProjectPricing>;
  updateProjectPricing(id: string, pricing: Partial<InsertProjectPricing>): Promise<ProjectPricing | undefined>;
  deleteProjectPricing(id: string): Promise<boolean>;

  // Estimate Templates
  getEstimateTemplates(): Promise<EstimateTemplate[]>;
  getEstimateTemplatesByTradeClass(tradeClassId: string): Promise<EstimateTemplate[]>;
  getEstimateTemplate(id: string): Promise<EstimateTemplate | undefined>;
  createEstimateTemplate(template: InsertEstimateTemplate): Promise<EstimateTemplate>;
  updateEstimateTemplate(id: string, template: Partial<InsertEstimateTemplate>): Promise<EstimateTemplate | undefined>;
  deleteEstimateTemplate(id: string): Promise<boolean>;

  // Regional Cost Database
  getRegionalCostData(): Promise<RegionalCostDatabase[]>;
  getRegionalCostDataByLocation(region?: string, state?: string, zipCode?: string): Promise<RegionalCostDatabase[]>;
  createRegionalCostData(data: InsertRegionalCostDatabase): Promise<RegionalCostDatabase>;
  updateRegionalCostData(id: string, data: Partial<InsertRegionalCostDatabase>): Promise<RegionalCostDatabase | undefined>;

  // Supplier Management
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  getSuppliersBySpecialty(specialty: string): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<boolean>;

  // Material Pricing
  getMaterialPricing(): Promise<MaterialPricing[]>;
  getMaterialPricingBySku(skuId: string): Promise<MaterialPricing[]>;
  getMaterialPricingBySupplier(supplierId: string): Promise<MaterialPricing[]>;
  getBestPriceForSku(skuId: string): Promise<MaterialPricing | undefined>;
  createMaterialPricing(pricing: InsertMaterialPricing): Promise<MaterialPricing>;
  updateMaterialPricing(id: string, pricing: Partial<InsertMaterialPricing>): Promise<MaterialPricing | undefined>;

  // Change Orders
  getChangeOrders(): Promise<ChangeOrder[]>;
  getChangeOrdersByProject(projectId: string): Promise<ChangeOrder[]>;
  getChangeOrder(id: string): Promise<ChangeOrder | undefined>;
  createChangeOrder(changeOrder: InsertChangeOrder): Promise<ChangeOrder>;
  updateChangeOrder(id: string, changeOrder: Partial<InsertChangeOrder>): Promise<ChangeOrder | undefined>;
  deleteChangeOrder(id: string): Promise<boolean>;

  // Profit Margin Settings
  getProfitMarginSettings(): Promise<ProfitMarginSettings[]>;
  getProfitMarginSettingsByScope(scope: string, scopeId?: string): Promise<ProfitMarginSettings[]>;
  createProfitMarginSettings(settings: InsertProfitMarginSettings): Promise<ProfitMarginSettings>;
  updateProfitMarginSettings(id: string, settings: Partial<InsertProfitMarginSettings>): Promise<ProfitMarginSettings | undefined>;

  // Cost History and Trending
  getCostHistory(): Promise<CostHistory[]>;
  getCostHistoryBySku(skuId: string): Promise<CostHistory[]>;
  getCostTrend(skuId: string, days: number): Promise<CostHistory[]>;
  createCostHistory(history: InsertCostHistory): Promise<CostHistory>;

  // Cost Escalation
  getCostEscalation(): Promise<CostEscalation[]>;
  getCostEscalationByProject(projectId: string): Promise<CostEscalation[]>;
  getActiveCostEscalation(projectId: string): Promise<CostEscalation[]>;
  createCostEscalation(escalation: InsertCostEscalation): Promise<CostEscalation>;
  updateCostEscalation(id: string, escalation: Partial<InsertCostEscalation>): Promise<CostEscalation | undefined>;
}

export class DatabaseStorage implements IStorage {
  private initialized = false;

  constructor() {
    // Initialize with sample data asynchronously
    // DISABLED: Causes issues with Neon serverless in production
    // this.initializeSampleData().catch(console.error);
  }

  private async initializeSampleData() {
    try {
      // Check if sample data already exists
      const existingProjects = await db.select().from(projects).limit(1);
      if (existingProjects.length > 0) {
        this.initialized = true;
        return;
      }

    // Sample project
    const [sampleProject] = await db
      .insert(projects)
      .values({
        name: "Downtown Office Complex",
        description: "Mixed-use commercial building with office spaces and retail on ground floor",
        location: "123 Business Ave, Suite 400",
        client: "Downtown Development LLC",
        status: "active",
      })
      .returning();

    // Sample drawings
    const sampleDrawings = [
      {
        project_id: sampleProject.id,
        name: "Floor Plan - Level 1",
        filename: "floor-plan-l1.pdf",
        file_url: "/uploads/floor-plan-l1.pdf",
        file_type: "application/pdf",
        status: "complete",
        scale: "1/4\" = 1'",
        is_ai_processed: true,
      },
      {
        project_id: sampleProject.id,
        name: "Electrical Plan - Level 1",
        filename: "electrical-l1.pdf",
        file_url: "/uploads/electrical-l1.pdf",
        file_type: "application/pdf",
        status: "complete",
        scale: "1/4\" = 1'",
        is_ai_processed: true,
      },
      {
        project_id: sampleProject.id,
        name: "HVAC Layout - Level 1",
        filename: "hvac-l1.pdf",
        file_url: "/uploads/hvac-l1.pdf",
        file_type: "application/pdf",
        status: "processing",
        scale: "1/4\" = 1'",
        is_ai_processed: false,
      },
    ];
    
    await db.insert(drawings).values(sampleDrawings);

    // Get the first drawing for sample takeoffs
    const [firstDrawing] = await db.select().from(drawings).where(eq(drawings.project_id, sampleProject.id)).limit(1);
    
    if (firstDrawing) {
      // Sample takeoffs for the first drawing
      await db.insert(takeoffs).values([
        {
          drawing_id: firstDrawing.id,
          element_type: "doors",
          element_name: "Interior Door - 36\" x 80\"",
          item_type: "Interior Door",
          quantity: 12,
          width: 36,
          height: 80,
          unit: "each",
          coordinates: { x: 100, y: 200 },
          is_detected_by_ai: true,
          cost_per_unit: 250,
          total_cost: 3000,
        },
        {
          drawing_id: firstDrawing.id,
          element_type: "windows",
          element_name: "Double Hung Window - 48\" x 60\"",
          item_type: "Double Hung Window",
          quantity: 8,
          width: 48,
          height: 60,
          unit: "each",
          coordinates: { x: 300, y: 150 },
          is_detected_by_ai: true,
          cost_per_unit: 450,
          total_cost: 3600,
        },
        {
          drawing_id: firstDrawing.id,
          element_type: "flooring",
          element_name: "Luxury Vinyl Plank",
          item_type: "Vinyl Flooring",
          quantity: 2400,
          area: 2400,
          unit: "sq ft",
          is_detected_by_ai: true,
          cost_per_unit: 4.5,
          total_cost: 10800,
        },
        {
          drawing_id: firstDrawing.id,
          element_type: "electrical",
          element_name: "Electrical Outlets",
          item_type: "Electrical Outlet",
          quantity: 24,
          unit: "each",
          is_detected_by_ai: true,
          cost_per_unit: 85,
          total_cost: 2040,
        }
      ]);
    }

    // Sample material costs
    await db.insert(material_costs).values([
      {
        category: "doors",
        item_name: "Interior Door (36\")",
        unit: "each",
        material_cost: 180,
        labor_cost: 150,
        description: "Standard hollow core interior door with frame",
      },
      {
        category: "windows",
        item_name: "Double Hung Window (3'x4')",
        unit: "each",
        material_cost: 350,
        labor_cost: 200,
        description: "Standard double hung window with installation",
      },
      {
        category: "flooring",
        item_name: "Hardwood Flooring",
        unit: "sq ft",
        material_cost: 8.5,
        labor_cost: 6.0,
        description: "Oak hardwood flooring with installation",
      },
    ]);

    // Sample trade classes
    const tradeClasses = await db.insert(trade_classes).values([
      { name: "General Construction", code: "GC", description: "General construction and framing" },
      { name: "Electrical", code: "ELEC", description: "Electrical systems and components" },
      { name: "Plumbing", code: "PLUMB", description: "Plumbing systems and fixtures" },
      { name: "HVAC", code: "HVAC", description: "Heating, ventilation, and air conditioning" },
      { name: "Flooring", code: "FLOOR", description: "All types of flooring materials and installation" },
      { name: "Windows & Doors", code: "WD", description: "Windows, doors, and related hardware" },
      { name: "Roofing", code: "ROOF", description: "Roofing materials and installation" },
      { name: "Insulation", code: "INSUL", description: "Insulation materials and installation" },
    ]).returning();

    // Sample product SKUs
    await db.insert(product_skus).values([
      // General Construction
      { sku: "LUM-2X4-8", name: "2x4x8 Lumber", trade_class_id: tradeClasses[0].id, category: "Lumber", unit: "piece", material_cost: 6.50, labor_cost: 2.00, description: "Standard 2x4x8 construction lumber" },
      { sku: "LUM-2X6-8", name: "2x6x8 Lumber", trade_class_id: tradeClasses[0].id, category: "Lumber", unit: "piece", material_cost: 9.75, labor_cost: 2.50, description: "Standard 2x6x8 construction lumber" },
      { sku: "PLY-3/4-4X8", name: "3/4\" Plywood 4x8", trade_class_id: tradeClasses[0].id, category: "Sheathing", unit: "sheet", material_cost: 58.00, labor_cost: 15.00, description: "3/4 inch plywood sheet 4x8 feet" },
      
      // Electrical
      { sku: "ELEC-OUT-STD", name: "Standard Electrical Outlet", trade_class_id: tradeClasses[1].id, category: "Outlets", unit: "each", material_cost: 12.50, labor_cost: 45.00, description: "Standard 15A electrical outlet with installation" },
      { sku: "ELEC-SW-STD", name: "Standard Light Switch", trade_class_id: tradeClasses[1].id, category: "Switches", unit: "each", material_cost: 8.75, labor_cost: 35.00, description: "Standard single-pole light switch" },
      { sku: "WIRE-12-2", name: "12-2 Romex Wire", trade_class_id: tradeClasses[1].id, category: "Wiring", unit: "ft", material_cost: 0.85, labor_cost: 1.25, description: "12 AWG 2-conductor Romex wire" },
      
      // Plumbing
      { sku: "PIPE-PVC-4", name: "4\" PVC Pipe", trade_class_id: tradeClasses[2].id, category: "Pipe", unit: "ft", material_cost: 3.25, labor_cost: 8.50, description: "4 inch PVC drain pipe" },
      { sku: "FIX-TOILET-STD", name: "Standard Toilet", trade_class_id: tradeClasses[2].id, category: "Fixtures", unit: "each", material_cost: 285.00, labor_cost: 175.00, description: "Standard two-piece toilet with installation" },
      
      // HVAC
      { sku: "DUCT-6", name: "6\" Flexible Ductwork", trade_class_id: tradeClasses[3].id, category: "Ductwork", unit: "ft", material_cost: 4.50, labor_cost: 6.25, description: "6 inch flexible HVAC ductwork" },
      { sku: "VENT-CEIL", name: "Ceiling Vent Register", trade_class_id: tradeClasses[3].id, category: "Vents", unit: "each", material_cost: 28.00, labor_cost: 45.00, description: "Standard ceiling vent register" },
      
      // Flooring
      { sku: "FLOOR-OAK-34", name: "3/4\" Oak Hardwood", trade_class_id: tradeClasses[4].id, category: "Hardwood", unit: "sq ft", material_cost: 8.50, labor_cost: 6.00, description: "3/4 inch solid oak hardwood flooring" },
      { sku: "TILE-POR-12X24", name: "12x24 Porcelain Tile", trade_class_id: tradeClasses[4].id, category: "Tile", unit: "sq ft", material_cost: 4.25, labor_cost: 8.75, description: "12x24 inch porcelain floor tile" },
      
      // Windows & Doors
      { sku: "WIN-DH-3X4", name: "3x4 Double Hung Window", trade_class_id: tradeClasses[5].id, category: "Windows", unit: "each", material_cost: 350.00, labor_cost: 200.00, description: "3x4 feet double hung vinyl window" },
      { sku: "DOOR-INT-32", name: "32\" Interior Door", trade_class_id: tradeClasses[5].id, category: "Doors", unit: "each", material_cost: 180.00, labor_cost: 150.00, description: "32 inch hollow core interior door" },
      
      // Roofing
      { sku: "SHIN-ARCH-30", name: "30-Year Architectural Shingles", trade_class_id: tradeClasses[6].id, category: "Shingles", unit: "sq", material_cost: 125.00, labor_cost: 85.00, description: "30-year architectural asphalt shingles per square" },
      
      // Insulation
      { sku: "INSUL-FG-R15", name: "R-15 Fiberglass Insulation", trade_class_id: tradeClasses[7].id, category: "Batts", unit: "sq ft", material_cost: 1.25, labor_cost: 0.75, description: "R-15 fiberglass batt insulation" },
    ]);
    
    this.initialized = true;
    console.log("Sample data initialized successfully");
  } catch (error) {
    console.error("Failed to initialize sample data:", error);
    // Continue without sample data
  }
}

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values({ ...insertProject, id: randomUUID() })
      .returning();
    return project;
  }

  async updateProject(id: string, updateData: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set({ ...updateData, updated_at: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<boolean> {
    // Delete related takeoffs first
    const projectDrawings = await db.select().from(drawings).where(eq(drawings.project_id, id));
    for (const drawing of projectDrawings) {
      await db.delete(takeoffs).where(eq(takeoffs.drawing_id, drawing.id));
    }
    
    // Delete related drawings
    await db.delete(drawings).where(eq(drawings.project_id, id));
    
    // Delete the project
    const result = await db.delete(projects).where(eq(projects.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Drawings
  async getDrawing(id: string): Promise<Drawing | undefined> {
    const [drawing] = await db.select().from(drawings).where(eq(drawings.id, id));
    return drawing;
  }

  async getDrawingsByProject(projectId: string): Promise<Drawing[]> {
    return await db.select().from(drawings).where(eq(drawings.project_id, projectId));
  }

  async createDrawing(insertDrawing: InsertDrawing): Promise<Drawing> {
    const [drawing] = await db
      .insert(drawings)
      .values({ ...insertDrawing, id: randomUUID() })
      .returning();
    return drawing;
  }

  async updateDrawing(id: string, updateData: Partial<InsertDrawing>): Promise<Drawing | undefined> {
    const [drawing] = await db
      .update(drawings)
      .set({ ...updateData, updated_at: new Date() })
      .where(eq(drawings.id, id))
      .returning();
    return drawing;
  }

  // Takeoffs
  async getTakeoff(id: string): Promise<Takeoff | undefined> {
    const [takeoff] = await db.select().from(takeoffs).where(eq(takeoffs.id, id));
    return takeoff;
  }

  async getTakeoffsByDrawing(drawingId: string): Promise<Takeoff[]> {
    return await db.select().from(takeoffs).where(eq(takeoffs.drawing_id, drawingId));
  }

  async createTakeoff(insertTakeoff: InsertTakeoff): Promise<Takeoff> {
    const [takeoff] = await db
      .insert(takeoffs)
      .values({ ...insertTakeoff, id: randomUUID() })
      .returning();
    return takeoff;
  }

  async createTakeoffsBatch(insertTakeoffs: InsertTakeoff[]): Promise<Takeoff[]> {
    if (insertTakeoffs.length === 0) return [];
    
    // Add IDs to all takeoffs
    const takeoffsWithIds = insertTakeoffs.map(t => ({ ...t, id: randomUUID() }));
    
    // Batch insert all takeoffs in a single query
    const createdTakeoffs = await db
      .insert(takeoffs)
      .values(takeoffsWithIds)
      .returning();
    
    return createdTakeoffs;
  }

  async updateTakeoff(id: string, updateData: Partial<InsertTakeoff>): Promise<Takeoff | undefined> {
    const [takeoff] = await db
      .update(takeoffs)
      .set({ ...updateData, updated_at: new Date() })
      .where(eq(takeoffs.id, id))
      .returning();
    return takeoff;
  }

  async deleteTakeoff(id: string): Promise<boolean> {
    const result = await db.delete(takeoffs).where(eq(takeoffs.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Material Costs
  async getMaterialCosts(): Promise<MaterialCost[]> {
    return await db.select().from(material_costs);
  }

  async getMaterialCostsByCategory(category: string): Promise<MaterialCost[]> {
    return await db.select().from(material_costs).where(eq(material_costs.category, category));
  }

  async createMaterialCost(insertCost: InsertMaterialCost): Promise<MaterialCost> {
    const [cost] = await db
      .insert(material_costs)
      .values({ ...insertCost, id: randomUUID() })
      .returning();
    return cost;
  }

  // Saved Analyses
  async getSavedAnalysis(id: string): Promise<SavedAnalysis | undefined> {
    const [analysis] = await db.select().from(saved_analyses).where(eq(saved_analyses.id, id));
    return analysis;
  }

  async getSavedAnalysesByProject(projectId: string): Promise<SavedAnalysis[]> {
    return await db.select().from(saved_analyses).where(eq(saved_analyses.project_id, projectId));
  }

  async createSavedAnalysis(insertAnalysis: InsertSavedAnalysis): Promise<SavedAnalysis> {
    const [analysis] = await db
      .insert(saved_analyses)
      .values({ ...insertAnalysis, id: randomUUID() })
      .returning();
    return analysis;
  }

  async updateSavedAnalysis(id: string, updateData: Partial<InsertSavedAnalysis>): Promise<SavedAnalysis | undefined> {
    const [analysis] = await db
      .update(saved_analyses)
      .set({ ...updateData, updated_at: new Date() })
      .where(eq(saved_analyses.id, id))
      .returning();
    return analysis;
  }

  async deleteSavedAnalysis(id: string): Promise<boolean> {
    const result = await db.delete(saved_analyses).where(eq(saved_analyses.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Trade Classes
  async getTradeClasses(): Promise<TradeClass[]> {
    return await db.select().from(trade_classes);
  }

  async getTradeClass(id: string): Promise<TradeClass | undefined> {
    const [tradeClass] = await db.select().from(trade_classes).where(eq(trade_classes.id, id));
    return tradeClass;
  }

  async createTradeClass(insertTradeClass: InsertTradeClass): Promise<TradeClass> {
    const [tradeClass] = await db
      .insert(trade_classes)
      .values({ ...insertTradeClass, id: randomUUID() })
      .returning();
    return tradeClass;
  }

  async updateTradeClass(id: string, updateData: Partial<InsertTradeClass>): Promise<TradeClass | undefined> {
    const [tradeClass] = await db
      .update(trade_classes)
      .set({ ...updateData, updated_at: new Date() })
      .where(eq(trade_classes.id, id))
      .returning();
    return tradeClass;
  }

  async deleteTradeClass(id: string): Promise<boolean> {
    const result = await db.delete(trade_classes).where(eq(trade_classes.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Product SKUs
  async getProductSkus(): Promise<ProductSku[]> {
    return await db.select().from(product_skus);
  }

  async getProductSkusByTradeClass(tradeClassId: string): Promise<ProductSku[]> {
    return await db.select().from(product_skus).where(eq(product_skus.trade_class_id, tradeClassId));
  }

  async getProductSku(id: string): Promise<ProductSku | undefined> {
    const [sku] = await db.select().from(product_skus).where(eq(product_skus.id, id));
    return sku;
  }

  async searchProductSkus(query: string, tradeClassId?: string): Promise<ProductSku[]> {
    let conditions = sql`${product_skus.name} ILIKE ${'%' + query + '%'} OR ${product_skus.description} ILIKE ${'%' + query + '%'} OR ${product_skus.sku} ILIKE ${'%' + query + '%'}`;
    
    if (tradeClassId) {
      conditions = sql`${conditions} AND ${product_skus.trade_class_id} = ${tradeClassId}`;
    }
    
    return await db.select().from(product_skus).where(conditions);
  }

  async createProductSku(insertSku: InsertProductSku): Promise<ProductSku> {
    const [sku] = await db
      .insert(product_skus)
      .values({ ...insertSku, id: randomUUID() })
      .returning();
    return sku;
  }

  async updateProductSku(id: string, updateData: Partial<InsertProductSku>): Promise<ProductSku | undefined> {
    const [sku] = await db
      .update(product_skus)
      .set({ ...updateData, updated_at: new Date() })
      .where(eq(product_skus.id, id))
      .returning();
    return sku;
  }

  async deleteProductSku(id: string): Promise<boolean> {
    const result = await db.delete(product_skus).where(eq(product_skus.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Project Pricing
  async getProjectPricing(projectId: string): Promise<ProjectPricing[]> {
    return await db.select().from(project_pricing).where(eq(project_pricing.project_id, projectId));
  }

  async getProjectPricingItem(id: string): Promise<ProjectPricing | undefined> {
    const [pricing] = await db.select().from(project_pricing).where(eq(project_pricing.id, id));
    return pricing;
  }

  async createProjectPricing(insertPricing: InsertProjectPricing): Promise<ProjectPricing> {
    const [pricing] = await db
      .insert(project_pricing)
      .values({ ...insertPricing, id: randomUUID() })
      .returning();
    return pricing;
  }

  async updateProjectPricing(id: string, updateData: Partial<InsertProjectPricing>): Promise<ProjectPricing | undefined> {
    const [pricing] = await db
      .update(project_pricing)
      .set({ ...updateData, updated_at: new Date() })
      .where(eq(project_pricing.id, id))
      .returning();
    return pricing;
  }

  async deleteProjectPricing(id: string): Promise<boolean> {
    const result = await db.delete(project_pricing).where(eq(project_pricing.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Estimate Templates
  async getEstimateTemplates(): Promise<EstimateTemplate[]> {
    return await db.select().from(estimate_templates);
  }

  async getEstimateTemplatesByTradeClass(tradeClassId: string): Promise<EstimateTemplate[]> {
    return await db.select().from(estimate_templates).where(eq(estimate_templates.trade_class_id, tradeClassId));
  }

  async getEstimateTemplate(id: string): Promise<EstimateTemplate | undefined> {
    const [template] = await db.select().from(estimate_templates).where(eq(estimate_templates.id, id));
    return template;
  }

  async createEstimateTemplate(insertTemplate: InsertEstimateTemplate): Promise<EstimateTemplate> {
    const [template] = await db
      .insert(estimate_templates)
      .values({ ...insertTemplate, id: randomUUID() })
      .returning();
    return template;
  }

  async updateEstimateTemplate(id: string, updateData: Partial<InsertEstimateTemplate>): Promise<EstimateTemplate | undefined> {
    const [template] = await db
      .update(estimate_templates)
      .set({ ...updateData, updated_at: new Date() })
      .where(eq(estimate_templates.id, id))
      .returning();
    return template;
  }

  async deleteEstimateTemplate(id: string): Promise<boolean> {
    const result = await db.delete(estimate_templates).where(eq(estimate_templates.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Regional Cost Database Methods
  async getRegionalCostData(): Promise<RegionalCostDatabase[]> {
    return await db.select().from(regional_cost_database);
  }

  async getRegionalCostDataByLocation(region?: string, state?: string, zipCode?: string): Promise<RegionalCostDatabase[]> {
    const conditions: any[] = [];
    
    if (region) {
      conditions.push(eq(regional_cost_database.region, region));
    }
    if (state) {
      conditions.push(eq(regional_cost_database.state, state));
    }
    if (zipCode) {
      conditions.push(eq(regional_cost_database.zip_code, zipCode));
    }

    if (conditions.length > 0) {
      return await db.select().from(regional_cost_database).where(and(...conditions));
    } else {
      return await db.select().from(regional_cost_database);
    }
  }

  async createRegionalCostData(data: InsertRegionalCostDatabase): Promise<RegionalCostDatabase> {
    const [result] = await db.insert(regional_cost_database).values(data).returning();
    return result;
  }

  async updateRegionalCostData(id: string, data: Partial<InsertRegionalCostDatabase>): Promise<RegionalCostDatabase | undefined> {
    const [result] = await db.update(regional_cost_database)
      .set({ ...data, last_updated: new Date() })
      .where(eq(regional_cost_database.id, id))
      .returning();
    return result;
  }

  // Supplier Management Methods
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).where(eq(suppliers.is_active, true));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [result] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return result;
  }

  async getSuppliersBySpecialty(specialty: string): Promise<Supplier[]> {
    return await db.select().from(suppliers)
      .where(sql`${suppliers.specialties} @> ${JSON.stringify([specialty])}`);
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [result] = await db.insert(suppliers).values(supplier).returning();
    return result;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [result] = await db.update(suppliers)
      .set({ ...supplier, updated_at: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return result;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    const result = await db.update(suppliers)
      .set({ is_active: false })
      .where(eq(suppliers.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Material Pricing Methods
  async getMaterialPricing(): Promise<MaterialPricing[]> {
    return await db.select().from(material_pricing);
  }

  async getMaterialPricingBySku(skuId: string): Promise<MaterialPricing[]> {
    return await db.select().from(material_pricing)
      .where(eq(material_pricing.sku_id, skuId))
      .orderBy(material_pricing.current_price);
  }

  async getMaterialPricingBySupplier(supplierId: string): Promise<MaterialPricing[]> {
    return await db.select().from(material_pricing)
      .where(eq(material_pricing.supplier_id, supplierId));
  }

  async getBestPriceForSku(skuId: string): Promise<MaterialPricing | undefined> {
    const [result] = await db.select().from(material_pricing)
      .where(eq(material_pricing.sku_id, skuId))
      .orderBy(material_pricing.current_price)
      .limit(1);
    return result;
  }

  async createMaterialPricing(pricing: InsertMaterialPricing): Promise<MaterialPricing> {
    const [result] = await db.insert(material_pricing).values(pricing).returning();
    return result;
  }

  async updateMaterialPricing(id: string, pricing: Partial<InsertMaterialPricing>): Promise<MaterialPricing | undefined> {
    const [result] = await db.update(material_pricing)
      .set({ ...pricing, last_updated: new Date() })
      .where(eq(material_pricing.id, id))
      .returning();
    return result;
  }

  // Change Order Methods
  async getChangeOrders(): Promise<ChangeOrder[]> {
    return await db.select().from(change_orders);
  }

  async getChangeOrdersByProject(projectId: string): Promise<ChangeOrder[]> {
    return await db.select().from(change_orders)
      .where(eq(change_orders.project_id, projectId))
      .orderBy(change_orders.created_at);
  }

  async getChangeOrder(id: string): Promise<ChangeOrder | undefined> {
    const [result] = await db.select().from(change_orders).where(eq(change_orders.id, id));
    return result;
  }

  async createChangeOrder(changeOrder: InsertChangeOrder): Promise<ChangeOrder> {
    // Generate change order number if not provided
    if (!changeOrder.change_order_number) {
      const projectChangeOrders = await this.getChangeOrdersByProject(changeOrder.project_id);
      changeOrder.change_order_number = `CO-${String(projectChangeOrders.length + 1).padStart(3, '0')}`;
    }

    const [result] = await db.insert(change_orders).values(changeOrder).returning();
    return result;
  }

  async updateChangeOrder(id: string, changeOrder: Partial<InsertChangeOrder>): Promise<ChangeOrder | undefined> {
    const [result] = await db.update(change_orders)
      .set({ ...changeOrder, updated_at: new Date() })
      .where(eq(change_orders.id, id))
      .returning();
    return result;
  }

  async deleteChangeOrder(id: string): Promise<boolean> {
    const result = await db.delete(change_orders).where(eq(change_orders.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Profit Margin Settings Methods
  async getProfitMarginSettings(): Promise<ProfitMarginSettings[]> {
    return await db.select().from(profit_margin_settings)
      .where(eq(profit_margin_settings.is_active, true));
  }

  async getProfitMarginSettingsByScope(scope: string, scopeId?: string): Promise<ProfitMarginSettings[]> {
    const conditions: any[] = [
      eq(profit_margin_settings.scope, scope),
      eq(profit_margin_settings.is_active, true)
    ];

    if (scopeId) {
      if (scope === 'project') {
        conditions.push(eq(profit_margin_settings.project_id, scopeId));
      } else if (scope === 'trade_class') {
        conditions.push(eq(profit_margin_settings.trade_class_id, scopeId));
      }
    }

    return await db.select().from(profit_margin_settings)
      .where(and(...conditions));
  }

  async createProfitMarginSettings(settings: InsertProfitMarginSettings): Promise<ProfitMarginSettings> {
    const [result] = await db.insert(profit_margin_settings).values(settings).returning();
    return result;
  }

  async updateProfitMarginSettings(id: string, settings: Partial<InsertProfitMarginSettings>): Promise<ProfitMarginSettings | undefined> {
    const [result] = await db.update(profit_margin_settings)
      .set({ ...settings, updated_at: new Date() })
      .where(eq(profit_margin_settings.id, id))
      .returning();
    return result;
  }

  // Cost History Methods
  async getCostHistory(): Promise<CostHistory[]> {
    return await db.select().from(cost_history)
      .orderBy(cost_history.record_date);
  }

  async getCostHistoryBySku(skuId: string): Promise<CostHistory[]> {
    return await db.select().from(cost_history)
      .where(eq(cost_history.sku_id, skuId))
      .orderBy(cost_history.record_date);
  }

  async getCostTrend(skuId: string, days: number): Promise<CostHistory[]> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    return await db.select().from(cost_history)
      .where(and(
        eq(cost_history.sku_id, skuId),
        sql`${cost_history.record_date} >= ${dateThreshold}`
      ))
      .orderBy(cost_history.record_date);
  }

  async createCostHistory(history: InsertCostHistory): Promise<CostHistory> {
    const [result] = await db.insert(cost_history).values(history).returning();
    return result;
  }

  // Cost Escalation Methods
  async getCostEscalation(): Promise<CostEscalation[]> {
    return await db.select().from(cost_escalation);
  }

  async getCostEscalationByProject(projectId: string): Promise<CostEscalation[]> {
    return await db.select().from(cost_escalation)
      .where(eq(cost_escalation.project_id, projectId))
      .orderBy(cost_escalation.effective_date);
  }

  async getActiveCostEscalation(projectId: string): Promise<CostEscalation[]> {
    const currentDate = new Date();
    return await db.select().from(cost_escalation)
      .where(and(
        eq(cost_escalation.project_id, projectId),
        eq(cost_escalation.is_active, true),
        sql`${cost_escalation.effective_date} <= ${currentDate}`,
        sql`${cost_escalation.end_date} IS NULL OR ${cost_escalation.end_date} > ${currentDate}`
      ));
  }

  async createCostEscalation(escalation: InsertCostEscalation): Promise<CostEscalation> {
    const [result] = await db.insert(cost_escalation).values(escalation).returning();
    return result;
  }

  async updateCostEscalation(id: string, escalation: Partial<InsertCostEscalation>): Promise<CostEscalation | undefined> {
    const [result] = await db.update(cost_escalation)
      .set({ ...escalation, updated_at: new Date() })
      .where(eq(cost_escalation.id, id))
      .returning();
    return result;
  }

  // Smart Cost Analysis Backend Methods
  async analyzeProjectCostEfficiency(projectId: string): Promise<{
    overallScore: number;
    totalCost: number;
    averageCostPerSqFt: number;
    costByCategory: Array<{ category: string; amount: number; percentage: number }>;
    efficiency: 'excellent' | 'good' | 'average' | 'poor';
    insights: string[];
  }> {
    // Get all drawings for this project first, then get takeoffs for all drawings
    const projectDrawings = await db.select().from(drawings).where(eq(drawings.project_id, projectId));
    let projectTakeoffs: Takeoff[] = [];
    
    if (projectDrawings.length > 0) {
      const drawingIds = projectDrawings.map(d => d.id);
      projectTakeoffs = await db.select().from(takeoffs).where(sql`${takeoffs.drawing_id} IN (${drawingIds.map(id => `'${id}'`).join(',')})`) as Takeoff[];
    }
    
    if (projectTakeoffs.length === 0) {
      return {
        overallScore: 0,
        totalCost: 0,
        averageCostPerSqFt: 0,
        costByCategory: [],
        efficiency: 'poor',
        insights: ['No takeoff data available for analysis']
      };
    }
    
    // Calculate total project cost
    const totalCost = projectTakeoffs.reduce((sum, t) => sum + (t.total_cost || 0), 0);
    
    // Calculate area-based metrics
    const totalArea = projectTakeoffs.reduce((sum, t) => sum + (t.area || 0), 0);
    const averageCostPerSqFt = totalArea > 0 ? totalCost / totalArea : 0;
    
    // Categorize costs
    const categoryTotals = new Map<string, number>();
    projectTakeoffs.forEach(takeoff => {
      const category = takeoff.element_type || 'Other';
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + (takeoff.total_cost || 0));
    });
    
    const costByCategory = Array.from(categoryTotals.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalCost) * 100
      }))
      .sort((a, b) => b.amount - a.amount);
    
    // Calculate efficiency score (0-100)
    let overallScore = 75; // Base score
    
    // Adjust based on cost distribution
    const maxCategoryPercentage = costByCategory[0]?.percentage || 0;
    if (maxCategoryPercentage > 50) overallScore -= 15; // Penalize over-concentration
    if (maxCategoryPercentage < 25) overallScore += 10; // Reward balance
    
    // Adjust based on cost per square foot (industry benchmarks)
    if (averageCostPerSqFt > 150) overallScore -= 10; // High cost
    if (averageCostPerSqFt < 80) overallScore += 10; // Good value
    
    // Determine efficiency level
    let efficiency: 'excellent' | 'good' | 'average' | 'poor';
    if (overallScore >= 85) efficiency = 'excellent';
    else if (overallScore >= 75) efficiency = 'good';
    else if (overallScore >= 60) efficiency = 'average';
    else efficiency = 'poor';
    
    // Generate insights
    const insights: string[] = [];
    if (totalCost > 100000) insights.push('Large project - consider bulk purchasing for savings');
    if (maxCategoryPercentage > 40) insights.push(`${costByCategory[0].category} dominates costs (${maxCategoryPercentage.toFixed(1)}%)`);
    if (averageCostPerSqFt > 120) insights.push('Above-average cost per sq ft - review material specifications');
    if (costByCategory.length > 5) insights.push('Diverse cost categories - good for risk distribution');
    
    return {
      overallScore,
      totalCost,
      averageCostPerSqFt,
      costByCategory,
      efficiency,
      insights
    };
  }

  async findCostSavingOpportunities(projectId: string): Promise<{
    potentialSavings: number;
    opportunities: Array<{
      category: string;
      description: string;
      estimatedSavings: number;
      priority: 'high' | 'medium' | 'low';
    }>;
  }> {
    // Get all drawings for this project first, then get takeoffs for all drawings
    const projectDrawings = await db.select().from(drawings).where(eq(drawings.project_id, projectId));
    let projectTakeoffs: Takeoff[] = [];
    
    if (projectDrawings.length > 0) {
      const drawingIds = projectDrawings.map(d => d.id);
      projectTakeoffs = await db.select().from(takeoffs).where(sql`${takeoffs.drawing_id} IN (${drawingIds.map(id => `'${id}'`).join(',')})`) as Takeoff[];
    }
    const analysis = await this.analyzeProjectCostEfficiency(projectId);
    
    const opportunities: Array<{
      category: string;
      description: string;
      estimatedSavings: number;
      priority: 'high' | 'medium' | 'low';
    }> = [];
    let potentialSavings = 0;
    
    // High-cost category optimization
    const highestCostCategory = analysis.costByCategory[0];
    if (highestCostCategory && highestCostCategory.percentage > 35) {
      const savings = highestCostCategory.amount * 0.1; // 10% potential savings
      opportunities.push({
        category: highestCostCategory.category,
        description: `Optimize ${highestCostCategory.category} costs through value engineering`,
        estimatedSavings: savings,
        priority: 'high' as const
      });
      potentialSavings += savings;
    }
    
    // Quantity optimization
    const highQuantityItems = projectTakeoffs.filter(t => (t.quantity || 0) > 50);
    if (highQuantityItems.length > 0) {
      const savings = highQuantityItems.reduce((sum, item) => sum + (item.total_cost || 0), 0) * 0.05;
      opportunities.push({
        category: 'Bulk Purchase',
        description: 'Negotiate bulk pricing for high-quantity items',
        estimatedSavings: savings,
        priority: 'medium' as const
      });
      potentialSavings += savings;
    }
    
    // Material substitution
    const expensiveItems = projectTakeoffs.filter(t => (t.cost_per_unit || 0) > 100);
    if (expensiveItems.length > 0) {
      const savings = expensiveItems.reduce((sum, item) => sum + (item.total_cost || 0), 0) * 0.15;
      opportunities.push({
        category: 'Material Substitution',
        description: 'Consider alternative materials for expensive items',
        estimatedSavings: savings,
        priority: 'medium' as const
      });
      potentialSavings += savings;
    }
    
    return {
      potentialSavings,
      opportunities: opportunities.sort((a, b) => b.estimatedSavings - a.estimatedSavings)
    };
  }

  async generateCostBenchmarkReport(projectId: string): Promise<{
    projectCost: number;
    industryAverage: number;
    percentageVsAverage: number;
    ranking: 'below-average' | 'average' | 'above-average' | 'premium';
    factors: Array<{ factor: string; impact: number; description: string }>;
  }> {
    const analysis = await this.analyzeProjectCostEfficiency(projectId);
    
    // Simulated industry benchmarks (in production, this would come from real data)
    const industryBenchmarks = {
      averageCostPerSqFt: 95,
      typicalCategoryDistribution: {
        'flooring': 25,
        'windows': 20,
        'doors': 15,
        'electrical': 15,
        'walls': 12,
        'other': 13
      }
    };
    
    const industryAverage = industryBenchmarks.averageCostPerSqFt;
    const percentageVsAverage = ((analysis.averageCostPerSqFt - industryAverage) / industryAverage) * 100;
    
    let ranking: 'below-average' | 'average' | 'above-average' | 'premium';
    if (percentageVsAverage < -10) ranking = 'below-average';
    else if (percentageVsAverage < 10) ranking = 'average';
    else if (percentageVsAverage < 25) ranking = 'above-average';
    else ranking = 'premium';
    
    // Analyze cost factors
    const factors: Array<{ factor: string; impact: number; description: string }> = [];
    
    // Regional factor
    factors.push({
      factor: 'Regional Costs',
      impact: Math.random() * 20 - 10, // Simulated regional impact
      description: 'Regional cost variations compared to national average'
    });
    
    // Material quality factor
    const avgCostPerUnit = analysis.totalCost / (analysis.costByCategory.reduce((sum, cat) => sum + cat.amount, 0) || 1);
    factors.push({
      factor: 'Material Quality',
      impact: avgCostPerUnit > 50 ? 15 : 5,
      description: avgCostPerUnit > 50 ? 'Premium materials selected' : 'Standard materials used'
    });
    
    // Project complexity
    const categoryCount = analysis.costByCategory.length;
    factors.push({
      factor: 'Project Complexity',
      impact: categoryCount > 6 ? 10 : 0,
      description: categoryCount > 6 ? 'High complexity with many categories' : 'Standard complexity project'
    });
    
    return {
      projectCost: analysis.totalCost,
      industryAverage,
      percentageVsAverage,
      ranking,
      factors
    };
  }

  async generateProjectRiskAssessment(projectId: string): Promise<{
    overallRiskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    risks: Array<{
      category: string;
      severity: 'low' | 'medium' | 'high';
      probability: number;
      impact: string;
      mitigation: string;
    }>;
    recommendations: string[];
  }> {
    const analysis = await this.analyzeProjectCostEfficiency(projectId);
    const benchmark = await this.generateCostBenchmarkReport(projectId);
    
    const risks: Array<{
      category: string;
      severity: 'low' | 'medium' | 'high';
      probability: number;
      impact: string;
      mitigation: string;
    }> = [];
    let riskScore = 0;
    
    // Cost overrun risk
    if (benchmark.percentageVsAverage > 20) {
      risks.push({
        category: 'Cost Overrun',
        severity: 'high' as const,
        probability: 0.75,
        impact: 'Project costs significantly exceed industry standards',
        mitigation: 'Implement value engineering and material substitution strategies'
      });
      riskScore += 25;
    }
    
    // Budget concentration risk
    const topCategory = analysis.costByCategory[0];
    if (topCategory && topCategory.percentage > 45) {
      risks.push({
        category: 'Cost Concentration',
        severity: 'medium' as const,
        probability: 0.6,
        impact: `Over-dependence on ${topCategory.category} creates supply chain vulnerability`,
        mitigation: 'Diversify suppliers and consider alternative materials'
      });
      riskScore += 15;
    }
    
    // Market volatility risk for expensive projects
    if (analysis.totalCost > 150000) {
      risks.push({
        category: 'Market Volatility',
        severity: 'medium' as const,
        probability: 0.4,
        impact: 'Large projects vulnerable to material price fluctuations',
        mitigation: 'Lock in pricing with suppliers and consider phased purchasing'
      });
      riskScore += 10;
    }
    
    // Quality vs cost risk
    if (benchmark.ranking === 'below-average') {
      risks.push({
        category: 'Quality Risk',
        severity: 'low' as const,
        probability: 0.3,
        impact: 'Low costs may indicate potential quality compromises',
        mitigation: 'Verify material specifications and contractor qualifications'
      });
      riskScore += 5;
    }
    
    // Determine overall risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 40) riskLevel = 'critical';
    else if (riskScore >= 25) riskLevel = 'high';
    else if (riskScore >= 15) riskLevel = 'medium';
    else riskLevel = 'low';
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (riskScore > 20) {
      recommendations.push('Consider implementing a risk management plan');
      recommendations.push('Establish contingency budget of 10-15%');
    }
    if (analysis.efficiency === 'poor') {
      recommendations.push('Conduct detailed cost review before proceeding');
    }
    if (risks.some(r => r.category === 'Cost Concentration')) {
      recommendations.push('Evaluate supplier diversity and backup options');
    }
    
    return {
      overallRiskScore: riskScore,
      riskLevel,
      risks,
      recommendations
    };
  }

  async predictProjectCostTrends(projectId: string, months: number = 6): Promise<{
    currentCost: number;
    projectedCost: number;
    trendDirection: 'increasing' | 'decreasing' | 'stable';
    confidenceLevel: number;
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
    monthlyProjections: Array<{
      month: number;
      projectedCost: number;
      confidence: number;
    }>;
  }> {
    const analysis = await this.analyzeProjectCostEfficiency(projectId);
    const currentCost = analysis.totalCost;
    
    // Simulate market trend factors (in production, this would use real market data)
    const baseInflationRate = 0.02; // 2% annual inflation
    const materialVolatility = Math.random() * 0.1 - 0.05; // -5% to +5% volatility
    const seasonalFactor = Math.sin(Date.now() / 1000000) * 0.03; // Seasonal variation
    
    const monthlyInflationRate = baseInflationRate / 12;
    const monthlyVolatility = materialVolatility / 12;
    const monthlySeasonal = seasonalFactor / 12;
    
    const factors = [
      {
        factor: 'Base Inflation',
        impact: baseInflationRate * 100,
        description: 'Standard construction cost inflation rate'
      },
      {
        factor: 'Material Volatility',
        impact: materialVolatility * 100,
        description: 'Market-specific material price fluctuations'
      },
      {
        factor: 'Seasonal Variation',
        impact: seasonalFactor * 100,
        description: 'Seasonal demand patterns affecting pricing'
      }
    ];
    
    // Generate monthly projections
    const monthlyProjections: Array<{
      month: number;
      projectedCost: number;
      confidence: number;
    }> = [];
    let runningCost = currentCost;
    
    for (let month = 1; month <= months; month++) {
      const monthlyChange = monthlyInflationRate + monthlyVolatility + monthlySeasonal;
      runningCost *= (1 + monthlyChange);
      
      const confidence = Math.max(0.3, 0.9 - (month * 0.1)); // Confidence decreases over time
      
      monthlyProjections.push({
        month,
        projectedCost: Math.round(runningCost),
        confidence
      });
    }
    
    const finalProjectedCost = monthlyProjections[monthlyProjections.length - 1].projectedCost;
    const totalChange = (finalProjectedCost - currentCost) / currentCost;
    
    let trendDirection: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(totalChange) < 0.02) trendDirection = 'stable';
    else if (totalChange > 0) trendDirection = 'increasing';
    else trendDirection = 'decreasing';
    
    const confidenceLevel = monthlyProjections[Math.floor(months/2)]?.confidence || 0.7;
    
    return {
      currentCost,
      projectedCost: finalProjectedCost,
      trendDirection,
      confidenceLevel,
      factors,
      monthlyProjections
    };
  }
}

export const storage = new DatabaseStorage();

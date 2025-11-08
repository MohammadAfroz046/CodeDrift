import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const loadSyntheticData = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing data
    const existingProducts = await ctx.db.query("products").collect();
    for (const product of existingProducts) {
      await ctx.db.delete(product._id);
    }
    
    const existingDemand = await ctx.db.query("demand_history").collect();
    for (const demand of existingDemand) {
      await ctx.db.delete(demand._id);
    }

    const existingSuppliers = await ctx.db.query("suppliers").collect();
    for (const supplier of existingSuppliers) {
      await ctx.db.delete(supplier._id);
    }

    const existingInventory = await ctx.db.query("inventory").collect();
    for (const inventory of existingInventory) {
      await ctx.db.delete(inventory._id);
    }

    // Generate synthetic products
    const products = [
      { product_id: "P001", name: "Laptop Computer", category: "Electronics" },
      { product_id: "P002", name: "Office Chair", category: "Furniture" },
      { product_id: "P003", name: "Wireless Mouse", category: "Electronics" },
      { product_id: "P004", name: "Desk Lamp", category: "Furniture" },
      { product_id: "P005", name: "Smartphone", category: "Electronics" },
    ];

    for (const product of products) {
      await ctx.db.insert("products", product);
    }

    // Generate demand history (last 90 days)
    const today = new Date();
    for (let i = 90; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      for (const product of products) {
        // Base demand with seasonal patterns and random variation
        let baseDemand = 50;
        if (product.category === "Electronics") baseDemand = 80;
        
        // Add weekly seasonality (higher on weekdays)
        const dayOfWeek = date.getDay();
        const weekdayMultiplier = dayOfWeek >= 1 && dayOfWeek <= 5 ? 1.2 : 0.8;
        
        // Add random variation
        const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
        
        // Occasional spikes for anomaly detection
        const spikeChance = Math.random();
        const spikeFactor = spikeChance < 0.05 ? 2.5 : 1; // 5% chance of spike
        
        const demand = Math.round(baseDemand * weekdayMultiplier * randomFactor * spikeFactor);
        
        await ctx.db.insert("demand_history", {
          date: dateStr,
          product_id: product.product_id,
          demand,
        });
      }
    }

    // Generate suppliers
    const supplierData = [
      { supplier_id: "S001", name: "TechCorp", price_per_unit: 850, lead_time: 7, reliability: 0.95, product_id: "P001" },
      { supplier_id: "S002", name: "ElectroSupply", price_per_unit: 820, lead_time: 10, reliability: 0.88, product_id: "P001" },
      { supplier_id: "S003", name: "FurniturePlus", price_per_unit: 120, lead_time: 5, reliability: 0.92, product_id: "P002" },
      { supplier_id: "S004", name: "OfficeWorld", price_per_unit: 135, lead_time: 8, reliability: 0.85, product_id: "P002" },
      { supplier_id: "S005", name: "GadgetHub", price_per_unit: 25, lead_time: 3, reliability: 0.98, product_id: "P003" },
      { supplier_id: "S006", name: "TechAccessories", price_per_unit: 22, lead_time: 6, reliability: 0.90, product_id: "P003" },
      { supplier_id: "S007", name: "LightingCo", price_per_unit: 45, lead_time: 4, reliability: 0.93, product_id: "P004" },
      { supplier_id: "S008", name: "HomeDecor", price_per_unit: 52, lead_time: 7, reliability: 0.87, product_id: "P004" },
      { supplier_id: "S009", name: "MobileTech", price_per_unit: 650, lead_time: 12, reliability: 0.91, product_id: "P005" },
      { supplier_id: "S010", name: "PhoneWorld", price_per_unit: 680, lead_time: 8, reliability: 0.94, product_id: "P005" },
    ];

    for (const supplier of supplierData) {
      await ctx.db.insert("suppliers", supplier);
    }

    // Generate inventory data
    const inventoryData = [
      { product_id: "P001", current_stock: 45, warehouse_capacity: 200, reorder_point: 30 },
      { product_id: "P002", current_stock: 78, warehouse_capacity: 150, reorder_point: 25 },
      { product_id: "P003", current_stock: 120, warehouse_capacity: 500, reorder_point: 50 },
      { product_id: "P004", current_stock: 32, warehouse_capacity: 100, reorder_point: 20 },
      { product_id: "P005", current_stock: 18, warehouse_capacity: 80, reorder_point: 15 },
    ];

    for (const inventory of inventoryData) {
      await ctx.db.insert("inventory", inventory);
    }

    return { success: true, message: "Synthetic data loaded successfully" };
  },
});

export const getProducts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});

export const syncProductsFromBackend = mutation({
  args: {},
  handler: async (ctx) => {
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
    
    try {
      // Fetch products from backend
      const response = await fetch(`${BACKEND_URL}/api/products`);
      if (!response.ok) {
        throw new Error("Failed to fetch products from backend");
      }
      
      const data = await response.json();
      const backendProducts = data.products || [];
      
      // Clear existing products
      const existingProducts = await ctx.db.query("products").collect();
      for (const product of existingProducts) {
        await ctx.db.delete(product._id);
      }
      
      // Insert products from backend
      for (const product of backendProducts) {
        await ctx.db.insert("products", {
          product_id: product.product_id,
          name: product.name,
          category: undefined,
        });
      }
      
      return { 
        success: true, 
        productsLoaded: backendProducts.length 
      };
    } catch (error) {
      console.error("Error syncing products:", error);
      throw new Error(`Failed to sync products: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

export const getDemandHistory = query({
  args: { product_id: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.product_id) {
      return await ctx.db
        .query("demand_history")
        .withIndex("by_product_and_date", (q) => q.eq("product_id", args.product_id!))
        .collect();
    }
    return await ctx.db.query("demand_history").collect();
  },
});

export const getSuppliers = query({
  args: { product_id: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.product_id) {
      return await ctx.db
        .query("suppliers")
        .withIndex("by_product", (q) => q.eq("product_id", args.product_id!))
        .collect();
    }
    return await ctx.db.query("suppliers").collect();
  },
});

export const getInventory = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("inventory").collect();
  },
});

export const loadSalesOrderData = mutation({
  args: {},
  handler: async (ctx) => {
    // This will be called from the backend or a script
    // For now, we'll create a function that can be called via HTTP action
    return { success: true, message: "Use backend API to load CSV data" };
  },
});

// Helper function to parse CSV and insert into database
export const insertSalesData = mutation({
  args: {
    products: v.array(v.object({
      product_id: v.string(),
      name: v.string(),
    })),
    demandData: v.array(v.object({
      date: v.string(),
      product_id: v.string(),
      demand: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Clear existing products and demand history
    const existingProducts = await ctx.db.query("products").collect();
    for (const product of existingProducts) {
      await ctx.db.delete(product._id);
    }
    
    const existingDemand = await ctx.db.query("demand_history").collect();
    for (const demand of existingDemand) {
      await ctx.db.delete(demand._id);
    }

    // Insert products
    for (const product of args.products) {
      await ctx.db.insert("products", {
        product_id: product.product_id,
        name: product.name,
        category: undefined,
      });
    }

    // Insert demand history (batch insert for better performance)
    // Limit to reasonable batch size to avoid timeouts
    const batchSize = 1000;
    for (let i = 0; i < args.demandData.length; i += batchSize) {
      const batch = args.demandData.slice(i, i + batchSize);
      for (const demand of batch) {
        await ctx.db.insert("demand_history", {
          date: demand.date,
          product_id: demand.product_id,
          demand: demand.demand,
        });
      }
    }

    return { 
      success: true, 
      productsInserted: args.products.length,
      demandRecordsInserted: args.demandData.length 
    };
  },
});

export const syncDemandDataFromBackend = mutation({
  args: {},
  handler: async (ctx) => {
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
    
    try {
      // Fetch data from backend
      const response = await fetch(`${BACKEND_URL}/api/load-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch data from backend");
      }
      
      const data = await response.json();
      
      // Use insertSalesData mutation
      // For now, we'll insert directly here
      // Clear existing data
      const existingProducts = await ctx.db.query("products").collect();
      for (const product of existingProducts) {
        await ctx.db.delete(product._id);
      }
      
      const existingDemand = await ctx.db.query("demand_history").collect();
      for (const demand of existingDemand) {
        await ctx.db.delete(demand._id);
      }
      
      // Insert products
      const products = data.products || [];
      for (const product of products) {
        await ctx.db.insert("products", {
          product_id: product.product_id,
          name: product.name,
          category: undefined,
        });
      }
      
      // Insert demand data (sample first 5000 records to avoid timeouts)
      const demandData = (data.demand_data || []).slice(0, 5000);
      for (const demand of demandData) {
        await ctx.db.insert("demand_history", {
          date: demand.date,
          product_id: demand.product_id,
          demand: demand.demand,
        });
      }
      
      return { 
        success: true, 
        productsInserted: products.length,
        demandRecordsInserted: demandData.length,
        totalAvailable: data.total_demand_records
      };
    } catch (error) {
      console.error("Error syncing demand data:", error);
      throw new Error(`Failed to sync demand data: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const optimizeInventory = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all products and their data
    const products = await ctx.db.query("products").collect();
    const optimizationResults = [];

    for (const product of products) {
      // Get current inventory
      const inventory = await ctx.db
        .query("inventory")
        .withIndex("by_product_id", (q) => q.eq("product_id", product.product_id))
        .first();
      
      if (!inventory) continue;

      // Get recent demand data
      const demandHistory = await ctx.db
        .query("demand_history")
        .withIndex("by_product_and_date", (q) => q.eq("product_id", product.product_id))
        .collect();
      
      const recentDemand = demandHistory
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30);
      
      const avgDailyDemand = recentDemand.length > 0 
        ? recentDemand.reduce((sum, d) => sum + d.demand, 0) / recentDemand.length
        : 50;

      // Get suppliers
      const suppliers = await ctx.db
        .query("suppliers")
        .withIndex("by_product", (q) => q.eq("product_id", product.product_id))
        .collect();
      
      if (suppliers.length === 0) continue;

      // Find best supplier (lowest cost with good reliability)
      const bestSupplier = suppliers.reduce((best, current) => {
        const bestScore = (best.reliability * 0.6) + ((1 / best.price_per_unit) * 0.4);
        const currentScore = (current.reliability * 0.6) + ((1 / current.price_per_unit) * 0.4);
        return currentScore > bestScore ? current : best;
      });

      // Simple optimization logic (Economic Order Quantity inspired)
      const annualDemand = avgDailyDemand * 365;
      const holdingCostRate = 0.2; // 20% of item cost per year
      const orderingCost = 50; // Fixed cost per order
      
      // EOQ formula: sqrt(2 * D * S / H)
      const holdingCost = bestSupplier.price_per_unit * holdingCostRate;
      const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);
      
      // Adjust for capacity constraints
      const maxOrderQty = inventory.warehouse_capacity - inventory.current_stock;
      const optimalQty = Math.min(Math.ceil(eoq), maxOrderQty);
      
      // Calculate costs
      const totalCost = optimalQty * bestSupplier.price_per_unit;
      const daysOfStock = (inventory.current_stock + optimalQty) / avgDailyDemand;
      
      // Determine status
      let status = "Optimal";
      let warning = null;
      
      if (inventory.current_stock < (inventory.reorder_point || 20)) {
        status = "Understock";
        warning = "Current stock below reorder point";
      } else if (daysOfStock > 60) {
        status = "Overstock";
        warning = "Excessive inventory - consider reducing orders";
      } else if (daysOfStock < 14) {
        status = "Low Stock";
        warning = "Stock levels may be insufficient";
      }

      optimizationResults.push({
        product_id: product.product_id,
        product_name: product.name,
        current_stock: inventory.current_stock,
        optimal_quantity: optimalQty,
        total_cost: totalCost,
        supplier_name: bestSupplier.name,
        days_of_stock: Math.round(daysOfStock),
        status,
        warning,
      });
    }

    return optimizationResults;
  },
});

export const getInventoryStatus = query({
  args: {},
  handler: async (ctx) => {
    const inventory = await ctx.db.query("inventory").collect();
    const products = await ctx.db.query("products").collect();
    
    const statusData = [];
    
    for (const inv of inventory) {
      const product = products.find(p => p.product_id === inv.product_id);
      if (!product) continue;

      // Get recent demand
      const recentDemand = await ctx.db
        .query("demand_history")
        .withIndex("by_product_and_date", (q) => q.eq("product_id", inv.product_id))
        .collect();
      
      const last7Days = recentDemand
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 7);
      
      const avgDailyDemand = last7Days.length > 0 
        ? last7Days.reduce((sum, d) => sum + d.demand, 0) / last7Days.length
        : 0;

      const daysOfStock = avgDailyDemand > 0 ? inv.current_stock / avgDailyDemand : 999;
      const utilizationRate = (inv.current_stock / inv.warehouse_capacity) * 100;
      
      statusData.push({
        ...inv,
        product_name: product.name,
        days_of_stock: Math.round(daysOfStock),
        utilization_rate: Math.round(utilizationRate),
        avg_daily_demand: Math.round(avgDailyDemand),
      });
    }
    
    return statusData;
  },
});

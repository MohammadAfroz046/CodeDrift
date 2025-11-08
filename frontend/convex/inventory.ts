import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export const optimizeInventory = action({
  args: {},
  handler: async (ctx) => {
    try {
      // Call backend API to optimize ALL products from CSV dataset
      // Actions in Convex can use fetch directly
      const response = await fetch(`${BACKEND_URL}/api/inventory/optimize`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: Failed to optimize inventory`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const results = data.results || [];

      if (results.length === 0) {
        throw new Error("No optimization results returned. Check backend logs for errors.");
      }

      return results;
    } catch (error) {
      console.error("Inventory optimization error:", error);
      // Provide more helpful error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("fetch failed") || errorMessage.includes("NetworkError")) {
        throw new Error("Cannot connect to backend server. Please ensure the Flask backend is running on http://localhost:5000");
      }
      throw new Error(`Failed to optimize inventory: ${errorMessage}`);
    }
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

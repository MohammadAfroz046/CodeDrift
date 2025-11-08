import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateProcurementSuggestions = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing suggestions
    const existingSuggestions = await ctx.db.query("procurement_suggestions").collect();
    for (const suggestion of existingSuggestions) {
      await ctx.db.delete(suggestion._id);
    }

    // Get all products
    const products = await ctx.db.query("products").collect();
    
    for (const product of products) {
      // Get inventory data
      const inventory = await ctx.db
        .query("inventory")
        .withIndex("by_product_id", (q) => q.eq("product_id", product.product_id))
        .first();
      
      if (!inventory) continue;

      // Get recent demand (last 7 days average)
      const recentDemand = await ctx.db
        .query("demand_history")
        .withIndex("by_product_and_date", (q) => q.eq("product_id", product.product_id))
        .collect();
      
      const last7Days = recentDemand
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 7);
      
      const avgDailyDemand = last7Days.length > 0 
        ? last7Days.reduce((sum, d) => sum + d.demand, 0) / last7Days.length
        : 50;

      // Get suppliers for this product
      const suppliers = await ctx.db
        .query("suppliers")
        .withIndex("by_product", (q) => q.eq("product_id", product.product_id))
        .collect();

      // Calculate reorder needs
      const daysOfStock = inventory.current_stock / avgDailyDemand;
      const reorderPoint = inventory.reorder_point || 20;
      
      if (inventory.current_stock <= reorderPoint || daysOfStock < 7) {
        // Sort suppliers by score (reliability/price ratio and lead time)
        const scoredSuppliers = suppliers.map(supplier => {
          const reliabilityScore = supplier.reliability * 100;
          const priceScore = 100 / supplier.price_per_unit; // Lower price = higher score
          const leadTimeScore = 100 / supplier.lead_time; // Shorter lead time = higher score
          const totalScore = (reliabilityScore * 0.4) + (priceScore * 0.3) + (leadTimeScore * 0.3);
          
          return { ...supplier, score: totalScore };
        }).sort((a, b) => b.score - a.score);

        // Generate suggestions for top 2 suppliers
        for (let i = 0; i < Math.min(2, scoredSuppliers.length); i++) {
          const supplier = scoredSuppliers[i];
          
          // Calculate recommended quantity (30 days of demand)
          const recommendedQty = Math.ceil(avgDailyDemand * 30);
          const maxCapacity = inventory.warehouse_capacity - inventory.current_stock;
          const finalQty = Math.min(recommendedQty, maxCapacity);
          
          const priority = inventory.current_stock <= reorderPoint ? "High" : "Medium";
          
          await ctx.db.insert("procurement_suggestions", {
            product_id: product.product_id,
            supplier_id: supplier.supplier_id,
            recommended_quantity: finalQty,
            estimated_cost: finalQty * supplier.price_per_unit,
            eta_days: supplier.lead_time,
            priority,
            created_at: Date.now(),
          });
        }
      }
    }

    return { success: true, message: "Procurement suggestions generated" };
  },
});

export const getProcurementSuggestions = query({
  args: {},
  handler: async (ctx) => {
    const suggestions = await ctx.db.query("procurement_suggestions").collect();
    
    // Enrich with product and supplier details
    const enrichedSuggestions = [];
    for (const suggestion of suggestions) {
      const product = await ctx.db
        .query("products")
        .withIndex("by_product_id", (q) => q.eq("product_id", suggestion.product_id))
        .first();
      
      const supplier = await ctx.db
        .query("suppliers")
        .filter((q) => q.eq(q.field("supplier_id"), suggestion.supplier_id))
        .first();

      if (product && supplier) {
        enrichedSuggestions.push({
          ...suggestion,
          product_name: product.name,
          supplier_name: supplier.name,
          supplier_reliability: supplier.reliability,
        });
      }
    }
    
    return enrichedSuggestions.sort((a, b) => {
      const priorityOrder = { "High": 3, "Medium": 2, "Low": 1 };
      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
    });
  },
});

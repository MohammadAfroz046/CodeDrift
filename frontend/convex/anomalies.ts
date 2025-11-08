import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

type Doc = {
  type: string;
  severity: string;
  product_id?: string;
  supplier_id?: string;
  description: string;
  detected_at: number;
  value?: number;
  threshold?: number;
  _id: any;
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Get all anomalies sorted by detected_at in descending order
    const anomalies = await ctx.db.query("anomalies").collect() as Doc[];
      
    const products = await ctx.db.query("products").collect();
    const suppliers = await ctx.db.query("suppliers").collect();
    
    // Create lookup maps for fast access
    const productMap = new Map(products.map(p => [p.product_id, p.name]));
    const supplierMap = new Map(suppliers.map(s => [s.supplier_id, s.name]));
    
    // Enrich anomalies with names and sort by detected_at
    return anomalies
      .map(anomaly => ({
        ...anomaly,
        product_name: anomaly.product_id ? productMap.get(anomaly.product_id) : null,
        supplier_name: anomaly.supplier_id ? supplierMap.get(anomaly.supplier_id) : null
      }))
      .sort((a, b) => b.detected_at - a.detected_at);
  },
});

export const detectAnomalies = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing anomalies
    const existingAnomalies = await ctx.db.query("anomalies").collect();
    for (const anomaly of existingAnomalies) {
      await ctx.db.delete(anomaly._id);
    }

    const products = await ctx.db.query("products").collect();
    
    for (const product of products) {
      // Get demand history
      const demandHistory = await ctx.db
        .query("demand_history")
        .withIndex("by_product_and_date", (q) => q.eq("product_id", product.product_id))
        .collect();
      
      if (demandHistory.length < 14) continue; // Need at least 2 weeks of data
      
      // Sort by date
      demandHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Calculate statistics for anomaly detection
      const demands = demandHistory.map(d => d.demand);
      const mean = demands.reduce((sum, val) => sum + val, 0) / demands.length;
      const variance = demands.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / demands.length;
      const stdDev = Math.sqrt(variance);
      
      // Z-score based anomaly detection
      const zThreshold = 2.5; // Values beyond 2.5 standard deviations
      
      for (let i = 0; i < demandHistory.length; i++) {
        const demand = demandHistory[i];
        const zScore = Math.abs((demand.demand - mean) / stdDev);
        
        if (zScore > zThreshold) {
          const severity = zScore > 3.5 ? "critical" : zScore > 3 ? "warning" : "normal";
          
          await ctx.db.insert("anomalies", {
            type: "demand_spike",
            severity,
            product_id: product.product_id,
            description: `Unusual demand detected: ${demand.demand} units (${zScore.toFixed(2)} std devs from mean)`,
            detected_at: new Date(demand.date).getTime(),
            value: demand.demand,
            threshold: mean + (zThreshold * stdDev),
          });
        }
      }
      
      // Check for recent trend anomalies (sudden changes in pattern)
      const recentData = demandHistory.slice(-14); // Last 2 weeks
      const olderData = demandHistory.slice(-28, -14); // Previous 2 weeks
      
      if (olderData.length >= 7 && recentData.length >= 7) {
        const recentMean = recentData.reduce((sum, d) => sum + d.demand, 0) / recentData.length;
        const olderMean = olderData.reduce((sum, d) => sum + d.demand, 0) / olderData.length;
        
        const percentChange = Math.abs((recentMean - olderMean) / olderMean) * 100;
        
        if (percentChange > 50) { // More than 50% change
          const severity = percentChange > 100 ? "critical" : "warning";
          
          await ctx.db.insert("anomalies", {
            type: "trend_change",
            severity,
            product_id: product.product_id,
            description: `Significant trend change detected: ${percentChange.toFixed(1)}% change in demand pattern`,
            detected_at: Date.now(),
            value: recentMean,
            threshold: olderMean,
          });
        }
      }
    }
    
    // Check supplier reliability anomalies
    const suppliers = await ctx.db.query("suppliers").collect();
    for (const supplier of suppliers) {
      if (supplier.reliability < 0.8) {
        const severity = supplier.reliability < 0.7 ? "critical" : "warning";
        
        await ctx.db.insert("anomalies", {
          type: "supplier_reliability",
          severity,
          supplier_id: supplier.supplier_id,
          description: `Low supplier reliability: ${(supplier.reliability * 100).toFixed(1)}%`,
          detected_at: Date.now(),
          value: supplier.reliability,
          threshold: 0.8,
        });
      }
    }
    
    // Check inventory level anomalies
    const inventory = await ctx.db.query("inventory").collect();
    for (const inv of inventory) {
      const utilizationRate = inv.current_stock / inv.warehouse_capacity;
      
      if (utilizationRate > 0.9) {
        await ctx.db.insert("anomalies", {
          type: "high_inventory",
          severity: "warning",
          product_id: inv.product_id,
          description: `High inventory utilization: ${(utilizationRate * 100).toFixed(1)}%`,
          detected_at: Date.now(),
          value: utilizationRate,
          threshold: 0.9,
        });
      } else if (utilizationRate < 0.1) {
        await ctx.db.insert("anomalies", {
          type: "low_inventory",
          severity: "warning",
          product_id: inv.product_id,
          description: `Very low inventory: ${(utilizationRate * 100).toFixed(1)}% capacity used`,
          detected_at: Date.now(),
          value: utilizationRate,
          threshold: 0.1,
        });
      }
    }

    return { success: true, message: "Anomaly detection completed" };
  },
});

export const getAnomalies = query({
  args: {},
  handler: async (ctx) => {
    const anomalies = await ctx.db.query("anomalies").collect();
    
    // Enrich with product/supplier names
    const enrichedAnomalies = [];
    for (const anomaly of anomalies) {
      let productName = null;
      let supplierName = null;
      
      if (anomaly.product_id) {
        const product = await ctx.db
          .query("products")
          .withIndex("by_product_id", (q) => q.eq("product_id", anomaly.product_id!))
          .first();
        productName = product?.name;
      }
      
      if (anomaly.supplier_id) {
        const supplier = await ctx.db
          .query("suppliers")
          .filter((q) => q.eq(q.field("supplier_id"), anomaly.supplier_id))
          .first();
        supplierName = supplier?.name;
      }
      
      enrichedAnomalies.push({
        ...anomaly,
        product_name: productName,
        supplier_name: supplierName,
      });
    }
    
    return enrichedAnomalies.sort((a, b) => b.detected_at - a.detected_at);
  },
});

export const getAnomalyStatus = query({
  args: {},
  handler: async (ctx) => {
    const anomalies = await ctx.db.query("anomalies").collect();
    
    const criticalCount = anomalies.filter(a => a.severity === "critical").length;
    const warningCount = anomalies.filter(a => a.severity === "warning").length;
    
    let status = "normal";
    let message = "No anomalies detected";
    
    if (criticalCount > 0) {
      status = "critical";
      message = `${criticalCount} critical anomalies detected`;
    } else if (warningCount > 0) {
      status = "warning";
      message = `${warningCount} warnings detected`;
    }
    
    return {
      status,
      message,
      critical_count: criticalCount,
      warning_count: warningCount,
      total_count: anomalies.length,
    };
  },
});

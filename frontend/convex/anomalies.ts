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
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
    
    try {
      // Call backend API to detect anomalies using Isolation Forest model
      const response = await fetch(`${BACKEND_URL}/api/anomalies/detect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = "Failed to detect anomalies";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.trace) {
            console.error("Backend error trace:", errorData.trace);
          }
        } catch (e) {
          // If response is not JSON, get text
          const text = await response.text().catch(() => "");
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const anomalies = data.anomalies || [];
      const products = data.products || [];

      // Create/update products from CSV data
      for (const product of products) {
        // Check if product already exists
        const existingProduct = await ctx.db
          .query("products")
          .withIndex("by_product_id", (q) => q.eq("product_id", product.product_id))
          .first();
        
        if (existingProduct) {
          // Update product name if needed
          if (existingProduct.name !== product.name) {
            await ctx.db.patch(existingProduct._id, {
              name: product.name,
            });
          }
        } else {
          // Create new product
          await ctx.db.insert("products", {
            product_id: product.product_id,
            name: product.name,
            category: undefined,
          });
        }
      }

      // Clear existing anomalies
      const existingAnomalies = await ctx.db.query("anomalies").collect();
      for (const anomaly of existingAnomalies) {
        await ctx.db.delete(anomaly._id);
      }

      // Insert new anomalies into database
      for (const anomaly of anomalies) {
        // Convert ISO string to timestamp
        const detectedAt = new Date(anomaly.detected_at).getTime();
        
        await ctx.db.insert("anomalies", {
          type: anomaly.type || "supply_chain_anomaly",
          severity: anomaly.severity || "warning",
          product_id: anomaly.product_id,
          description: anomaly.description,
          detected_at: detectedAt,
          value: anomaly.value,
          threshold: anomaly.threshold,
        });
      }

      return { 
        success: true, 
        message: "Anomaly detection completed",
        total_detected: anomalies.length,
        total_checked: data.total_checked || 0
      };
    } catch (error) {
      console.error("Anomaly detection error:", error);
      throw new Error(`Failed to detect anomalies: ${error instanceof Error ? error.message : String(error)}`);
    }
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

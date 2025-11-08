import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export const generateForecast = mutation({
  args: { product_id: v.string() },
  handler: async (ctx, args) => {
    try {
      // Call backend API to generate forecast
      const response = await fetch(`${BACKEND_URL}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id: args.product_id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate forecast");
      }

      const data = await response.json();
      const forecasts = data.forecasts || [];

      // Clear existing forecasts for this product
      const existingForecasts = await ctx.db
        .query("forecasts")
        .withIndex("by_product", (q) => q.eq("product_id", args.product_id))
        .collect();
      
      for (const forecast of existingForecasts) {
        await ctx.db.delete(forecast._id);
      }

      // Insert new forecasts into database
      for (const forecast of forecasts) {
        await ctx.db.insert("forecasts", {
          product_id: args.product_id,
          forecast_date: forecast.forecast_date,
          predicted_demand: forecast.predicted_demand,
          confidence_lower: forecast.confidence_lower,
          confidence_upper: forecast.confidence_upper,
          created_at: Date.now(),
        });
      }

      return { 
        success: true, 
        message: "Forecast generated successfully",
        forecast_count: forecasts.length
      };
    } catch (error) {
      console.error("Forecast generation error:", error);
      throw new Error(`Failed to generate forecast: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

export const getForecasts = query({
  args: { product_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("forecasts")
      .withIndex("by_product", (q) => q.eq("product_id", args.product_id))
      .collect();
  },
});

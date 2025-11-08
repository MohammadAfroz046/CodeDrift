import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// Define your tables
const applicationTables = {
  products: defineTable({
    product_id: v.string(),
    name: v.string(),
    category: v.optional(v.string()),
  }).index("by_product_id", ["product_id"]),

  demand_history: defineTable({
    date: v.string(),
    product_id: v.string(),
    demand: v.number(),
  }).index("by_product_and_date", ["product_id", "date"]),

  suppliers: defineTable({
    supplier_id: v.string(),
    name: v.string(),
    price_per_unit: v.number(),
    lead_time: v.number(),
    reliability: v.number(),
    product_id: v.string(),
  }).index("by_product", ["product_id"]),

  inventory: defineTable({
    product_id: v.string(),
    current_stock: v.number(),
    warehouse_capacity: v.number(),
    reorder_point: v.optional(v.number()),
  }).index("by_product_id", ["product_id"]),

  forecasts: defineTable({
    product_id: v.string(),
    forecast_date: v.string(),
    predicted_demand: v.number(),
    confidence_lower: v.number(),
    confidence_upper: v.number(),
    created_at: v.number(),
  }).index("by_product", ["product_id"]),

  anomalies: defineTable({
    type: v.string(), // "demand_spike", "supplier_delay", "data_outlier"
    severity: v.string(), // "normal", "warning", "critical"
    product_id: v.optional(v.string()),
    supplier_id: v.optional(v.string()),
    description: v.string(),
    detected_at: v.number(),
    value: v.optional(v.number()),
    threshold: v.optional(v.number())
  }).index("by_time", ["detected_at"]),

  procurement_suggestions: defineTable({
    product_id: v.string(),
    supplier_id: v.string(),
    recommended_quantity: v.number(),
    estimated_cost: v.number(),
    eta_days: v.number(),
    priority: v.string(),
    created_at: v.number(),
  }).index("by_product", ["product_id"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

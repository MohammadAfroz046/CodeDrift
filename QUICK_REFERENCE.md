# Quick Reference Guide - Current System

## 🤖 ML Models Summary

### **GAT-LSTM Hybrid Model**
- **Type**: Graph Neural Network + LSTM
- **Purpose**: Multi-product demand forecasting
- **Input**: Sales history, product graph (nodes/edges)
- **Output**: 30-day demand forecasts
- **Status**: ⚠️ Model exists but API integration incomplete (uses fallback)

### **Statistical Fallback**
- **Type**: Moving Average + Trend + Seasonality
- **Formula**: `Prediction = MA + (Trend × t) × Seasonality`
- **Confidence**: 5-35% uncertainty bands

---

## 📦 Inventory Optimization Summary

### **Current Algorithm: EOQ (Economic Order Quantity)**

**Formula:**
```
EOQ = √(2 × Annual Demand × Ordering Cost / Holding Cost)
```

**Process:**
1. Calculate average daily demand (last 30 days)
2. Select best supplier (reliability 60% + price 40%)
3. Calculate EOQ
4. Apply warehouse capacity constraint
5. Classify status: Optimal/Understock/Overstock/Low Stock

**Limitations:**
- ❌ Single-product optimization (no cross-product constraints)
- ❌ Fixed reorder point (20 units)
- ❌ Fixed holding cost (20%)
- ❌ No safety stock calculation
- ❌ No multi-warehouse support

---

## 🔄 Workflow Summary

```
CSV Data → Flask Backend → ML Service → Convex DB → Frontend
                ↓
        Forecast Generation
                ↓
        Inventory Optimization (EOQ)
                ↓
        Procurement Suggestions
```

---

## 🚀 Top 5 Priority Improvements

1. **Complete ML Model Integration** - Fix API connection to GAT-LSTM model
2. **Dynamic Safety Stock** - Calculate based on demand/lead time variability
3. **Multi-Product Optimization** - Use MILP for joint optimization
4. **Supplier Risk Assessment** - Add risk scoring and multi-sourcing
5. **DDMRP Buffer Zones** - Implement green/yellow/red zones

---

## 📊 Key Metrics

**Current:**
- Days of stock
- Utilization rate
- Low stock count

**Recommended Add:**
- Service level (fill rate)
- Inventory turnover
- Forecast accuracy (MAPE)
- Total cost of ownership

---

For detailed information, see `ML_MODELS_AND_INVENTORY_ANALYSIS.md`



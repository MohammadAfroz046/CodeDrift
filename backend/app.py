
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import pickle
# import torch
# import pandas as pd
# import numpy as np
# import os
# from datetime import datetime, timedelta
# import requests

# app = Flask(__name__)
# CORS(app)  # Enable CORS for frontend requests

# # Configuration
# CSV_PATH = "datasets/Sales Order.csv"
# CONVEX_URL = os.getenv("CONVEX_URL", "http://localhost:3000")  # Update with your Convex URL
# MODEL_PATH = "models/supply_chain_model.pkl"

# # Load CSV data
# sales_data = None
# product_columns = []

# def load_sales_data():
#     """Load and parse the Sales Order CSV file"""
#     global sales_data, product_columns
#     if os.path.exists(CSV_PATH):
#         sales_data = pd.read_csv(CSV_PATH)
#         # Parse date column
#         sales_data['Date'] = pd.to_datetime(sales_data['Date'])
#         # Get product columns (all columns except Date)
#         product_columns = [col for col in sales_data.columns if col != 'Date']
#         return True
#     return False


# def get_suppliers_for_product(product_name):
#     """Generate realistic suppliers based on product type"""
#     product_lower = product_name.lower()
    
#     # Tech products
#     if any(tech in product_lower for tech in ['laptop', 'computer', 'smartphone', 'tablet', 'monitor']):
#         return [
#             {"supplier_id": "TECH001", "name": "TechCorp", "base_price": 800, "lead_time": 7, "reliability": 0.95},
#             {"supplier_id": "TECH002", "name": "ElectroWorld", "base_price": 750, "lead_time": 10, "reliability": 0.90},
#             {"supplier_id": "TECH003", "name": "GadgetHub", "base_price": 850, "lead_time": 5, "reliability": 0.88},
#         ]
    
#     # Furniture products
#     elif any(furniture in product_lower for furniture in ['chair', 'desk', 'table', 'furniture', 'lamp']):
#         return [
#             {"supplier_id": "FURN001", "name": "FurniturePlus", "base_price": 120, "lead_time": 14, "reliability": 0.92},
#             {"supplier_id": "FURN002", "name": "OfficeSupplies Co.", "base_price": 150, "lead_time": 10, "reliability": 0.85},
#             {"supplier_id": "FURN003", "name": "HomeEssentials", "base_price": 100, "lead_time": 21, "reliability": 0.78},
#         ]
    
#     # Office supplies
#     elif any(office in product_lower for office in ['mouse', 'keyboard', 'pen', 'paper', 'notebook', 'stapler']):
#         return [
#             {"supplier_id": "OFF001", "name": "OfficeDepot", "base_price": 25, "lead_time": 5, "reliability": 0.96},
#             {"supplier_id": "OFF002", "name": "SupplyChain Pro", "base_price": 30, "lead_time": 3, "reliability": 0.94},
#             {"supplier_id": "OFF003", "name": "BudgetOffice", "base_price": 20, "lead_time": 7, "reliability": 0.82},
#         ]
    
#     # Default suppliers for unknown products
#     else:
#         return [
#             {"supplier_id": "GEN001", "name": "GeneralSupplier Co.", "base_price": 50, "lead_time": 10, "reliability": 0.85},
#             {"supplier_id": "GEN002", "name": "ReliableGoods Inc.", "base_price": 60, "lead_time": 7, "reliability": 0.88},
#             {"supplier_id": "GEN003", "name": "QuickShip Ltd.", "base_price": 70, "lead_time": 5, "reliability": 0.90},
#         ]
# # Load data on startup
# load_sales_data()

# @app.route("/api/products", methods=["GET"])
# def get_products():
#     """Get list of products from CSV"""
#     if sales_data is None:
#         return jsonify({"error": "Sales data not loaded"}), 500
    
#     products = []
#     for col in product_columns:
#         products.append({
#             "product_id": col,
#             "name": col
#         })
    
#     return jsonify({"products": products})

# @app.route("/api/load-data", methods=["POST"])
# def load_data_to_convex():
#     """Load CSV data into Convex database"""
#     if sales_data is None:
#         return jsonify({"error": "Sales data not loaded"}), 500
    
#     try:
#         products = []
#         demand_data = []
        
#         # Prepare products
#         for col in product_columns:
#             products.append({
#                 "product_id": col,
#                 "name": col
#             })
        
#         # Prepare demand history
#         for _, row in sales_data.iterrows():
#             date_str = row['Date'].strftime('%Y-%m-%d')
#             for col in product_columns:
#                 demand_value = float(row[col]) if pd.notna(row[col]) else 0.0
#                 if demand_value > 0:  # Only include non-zero demands
#                     demand_data.append({
#                         "date": date_str,
#                         "product_id": col,
#                         "demand": demand_value
#                     })
        
#         # Send to Convex (you'll need to implement the HTTP action in Convex)
#         # For now, return the data structure
#         return jsonify({
#             "success": True,
#             "products": products,
#             "demand_data": demand_data[:1000],  # Limit for testing
#             "total_demand_records": len(demand_data)
#         })
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route("/api/history", methods=["GET"])
# def get_history():
#     """Get historical demand data for a product"""
#     product_id = request.args.get("product_id")
    
#     if not product_id:
#         return jsonify({"error": "product_id is required"}), 400
    
#     if sales_data is None:
#         return jsonify({"error": "Sales data not loaded"}), 500
    
#     if product_id not in product_columns:
#         return jsonify({"error": f"Product {product_id} not found"}), 400
    
#     try:
#         # Get historical data for the product
#         product_data = sales_data[['Date', product_id]].copy()
#         product_data = product_data[product_data[product_id] > 0]  # Remove zeros
#         product_data = product_data.sort_values('Date')
        
#         history = []
#         for _, row in product_data.iterrows():
#             history.append({
#                 "date": row['Date'].strftime('%Y-%m-%d'),
#                 "demand": float(row[product_id])
#             })
        
#         return jsonify({
#             "product_id": product_id,
#             "history": history
#         })
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route("/api/predict", methods=["POST"])
# def predict():
#     """Generate 30-day forecast for a product using ML model or statistical method"""
#     data = request.json
#     product_id = data.get("product_id")
    
#     if not product_id:
#         return jsonify({"error": "product_id is required"}), 400
    
#     if sales_data is None:
#         return jsonify({"error": "Sales data not loaded"}), 500
    
#     if product_id not in product_columns:
#         return jsonify({"error": f"Product {product_id} not found in CSV"}), 400
    
#     try:
#         # Get historical data for the product
#         product_data = sales_data[['Date', product_id]].copy()
#         product_data = product_data[product_data[product_id] > 0]  # Remove zeros
#         product_data = product_data.sort_values('Date')
        
#         if len(product_data) < 7:
#             return jsonify({"error": "Insufficient historical data (minimum 7 days required)"}), 400
        
#         # Try to use ML model if available, otherwise use statistical forecasting
#         predictions = None
#         try:
#             # Attempt to load and use ML model
#             predictions = predict_with_ml_model(product_id, product_data)
#         except Exception as ml_error:
#             print(f"ML model prediction failed: {ml_error}, using statistical method")
#             # Fallback to statistical forecasting
#             predictions = generate_forecast(product_data[product_id].values, 30)
        
#         # Generate forecast dates
#         last_date = product_data['Date'].iloc[-1]
#         forecast_dates = []
#         for i in range(1, 31):
#             forecast_date = last_date + timedelta(days=i)
#             forecast_dates.append(forecast_date.strftime('%Y-%m-%d'))
        
#         # Create forecast results with confidence intervals
#         forecast_results = []
#         for i, (date, pred) in enumerate(zip(forecast_dates, predictions)):
#             # Calculate confidence intervals (increasing uncertainty over time)
#             uncertainty = max(0.1, 0.05 + (i * 0.01))  # 5-35% uncertainty
#             confidence_lower = max(0, pred * (1 - uncertainty))
#             confidence_upper = pred * (1 + uncertainty)
            
#             forecast_results.append({
#                 "forecast_date": date,
#                 "predicted_demand": round(pred, 2),
#                 "confidence_lower": round(confidence_lower, 2),
#                 "confidence_upper": round(confidence_upper, 2)
#             })
        
#         return jsonify({
#             "product_id": product_id,
#             "forecasts": forecast_results
#         })
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# def predict_with_ml_model(product_id, product_data):
#     """Attempt to predict using the ML model"""
#     try:
#         # Check if model file exists
#         if not os.path.exists(MODEL_PATH):
#             raise FileNotFoundError("Model file not found")
        
#         # Load model (simplified - you may need to adjust based on your model structure)
#         # For now, fall back to statistical method
#         # TODO: Integrate with actual model loading when model structure is known
#         raise NotImplementedError("ML model integration pending")
        
#     except Exception as e:
#         raise e

# def generate_forecast(historical_data, days=30):
#     """Generate forecast using moving average and trend analysis"""
#     # Use last 30 days for moving average
#     window = min(30, len(historical_data))
#     recent_data = historical_data[-window:]
    
#     # Calculate moving average
#     ma = np.mean(recent_data)
    
#     # Calculate trend (linear regression on recent data)
#     if len(recent_data) > 7:
#         x = np.arange(len(recent_data))
#         trend = np.polyfit(x, recent_data, 1)[0]
#     else:
#         trend = 0
    
#     # Generate predictions
#     predictions = []
#     for i in range(1, days + 1):
#         # Base prediction with trend
#         pred = ma + (trend * i)
        
#         # Add some seasonality (weekly pattern)
#         day_of_week = (i - 1) % 7
#         if day_of_week < 5:  # Weekday
#             pred *= 1.05
#         else:  # Weekend
#             pred *= 0.95
        
#         # Ensure non-negative
#         pred = max(0, pred)
#         predictions.append(pred)
    
#     return predictions

# @app.route("/api/dashboard/summary", methods=["GET"])
# def get_dashboard_summary():
#     """Get dashboard summary statistics from CSV data"""
#     if sales_data is None:
#         return jsonify({"error": "Sales data not loaded"}), 500
    
#     try:
#         # Calculate summary statistics
#         total_products = len(product_columns)
        
#         # Get recent demand (last 30 days) for all products
#         recent_data = sales_data.tail(30)
        
#         # Calculate average daily demand per product
#         product_stats = []
#         for col in product_columns:
#             product_demand = recent_data[col].fillna(0)
#             avg_daily_demand = product_demand.mean()
#             max_daily_demand = product_demand.max()
#             std_daily_demand = product_demand.std() if len(product_demand) > 1 else 0
            
#             # Estimate current stock based on demand patterns
#             # Simulate inventory: start with buffer, consume over time, restock periodically
#             # More realistic: vary stock levels based on demand volatility
            
#             # Calculate demand variability
#             cv = (std_daily_demand / avg_daily_demand) if avg_daily_demand > 0 else 0  # Coefficient of variation
            
#             # Estimate current stock level (simulate inventory management)
#             # Products with higher variability need more safety stock
#             safety_stock_multiplier = 1.5 + (cv * 0.5)  # 1.5 to 2.0x based on variability
#             base_stock_days = 30  # Base target: 30 days of stock
#             target_stock = avg_daily_demand * base_stock_days * safety_stock_multiplier
            
#             # Simulate inventory depletion and replenishment
#             # Assume stock depletes based on recent trend
#             last_14_days = sales_data.tail(14)[col].fillna(0)
#             recent_trend = last_14_days.iloc[-7:].mean() - last_14_days.iloc[:7].mean()
            
#             # Estimate current stock (starts at target, depletes with demand)
#             # Simple model: stock = target - (recent_consumption - recent_replenishment)
#             days_since_last_restock = 15  # Assume restocking every ~15 days
#             recent_consumption = avg_daily_demand * days_since_last_restock
#             estimated_stock = max(0, target_stock - recent_consumption + (avg_daily_demand * 30))
            
#             # Ensure stock doesn't go negative and has some minimum
#             estimated_stock = max(estimated_stock, avg_daily_demand * 5)  # Minimum 5 days stock
            
#             # Calculate days of stock remaining
#             days_of_stock = (estimated_stock / avg_daily_demand) if avg_daily_demand > 0 else 0
            
#             # Calculate utilization (based on recent demand vs capacity estimate)
#             # Capacity estimate based on max demand with buffer
#             capacity_estimate = max_daily_demand * 1.5 if max_daily_demand > 0 else avg_daily_demand * 2
#             utilization_rate = min(100, (avg_daily_demand / capacity_estimate * 100)) if capacity_estimate > 0 else 0
            
#             product_stats.append({
#                 "product_id": col,
#                 "product_name": col,
#                 "current_stock": round(estimated_stock, 2),
#                 "warehouse_capacity": round(capacity_estimate, 2),
#                 "days_of_stock": round(days_of_stock, 1),
#                 "utilization_rate": round(utilization_rate, 1),
#                 "avg_daily_demand": round(avg_daily_demand, 2)
#             })
        
#         # Count low stock items (less than 7 days)
#         low_stock_items = len([p for p in product_stats if p["days_of_stock"] < 7])
        
#         # Calculate average utilization
#         avg_utilization = sum(p["utilization_rate"] for p in product_stats) / len(product_stats) if product_stats else 0
        
#         # Estimate urgent procurement (items with very low stock or high demand)
#         urgent_procurement = len([p for p in product_stats if p["days_of_stock"] < 7 or p["utilization_rate"] > 80])
        
#         return jsonify({
#             "total_products": total_products,
#             "low_stock_items": low_stock_items,
#             "urgent_procurement": urgent_procurement,
#             "avg_utilization": round(avg_utilization, 1),
#             "inventory_status": product_stats
#         })
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route("/api/dashboard/products", methods=["GET"])
# def get_dashboard_products():
#     """Get list of products for dashboard"""
#     if sales_data is None:
#         return jsonify({"error": "Sales data not loaded"}), 500
    
#     try:
#         products = []
#         for col in product_columns:
#             products.append({
#                 "product_id": col,
#                 "name": col
#             })
        
#         return jsonify({"products": products})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
# @app.route("/api/procurement/suggestions", methods=["GET"])
# def get_procurement_suggestions():
#     """Get procurement suggestions for ALL products that need reordering"""
#     if sales_data is None:
#         return jsonify({"error": "Sales data not loaded"}), 500
    
#     try:
#         recent_data = sales_data.tail(30)
#         suggestions = []
        
#         # Reorder parameters
#         REORDER_POINT_DAYS = 21  # Reorder when less than 21 days of stock
#         MIN_STOCK_DAYS = 7  # Minimum days of stock threshold
        
#         print(f"📦 Processing {len(product_columns)} products for procurement suggestions")
        
#         for col in product_columns:
#             product_demand = recent_data[col].fillna(0)
#             avg_daily_demand = product_demand.mean()
            
#             # Skip products with no demand
#             if avg_daily_demand <= 0:
#                 avg_daily_demand = 0.1  # Small value to avoid division by zero
            
#             # Calculate current stock metrics
#             estimated_stock = avg_daily_demand * 15  # Simulate current stock
#             days_of_stock = (estimated_stock / avg_daily_demand) if avg_daily_demand > 0 else 0
            
#             # Get suppliers for this product
#             suppliers = get_suppliers_for_product(col)
#             if not suppliers:
#                 continue
            
#             # Only suggest procurement for products that need reordering
#             if days_of_stock < REORDER_POINT_DAYS or days_of_stock < MIN_STOCK_DAYS:
#                 # Calculate recommended quantity (30-45 days of demand)
#                 recommended_quantity = avg_daily_demand * 30
#                 if days_of_stock < MIN_STOCK_DAYS:
#                     recommended_quantity = avg_daily_demand * 45  # More urgent
                
#                 # Score and sort suppliers (reliability 40%, price 30%, lead time 30%)
#                 scored_suppliers = []
#                 for supplier in suppliers:
#                     reliability_score = supplier["reliability"] * 100
#                     price_score = 100 / supplier["base_price"] if supplier["base_price"] > 0 else 0
#                     lead_time_score = 100 / supplier["lead_time"] if supplier["lead_time"] > 0 else 0
#                     total_score = (reliability_score * 0.4) + (price_score * 0.3) + (lead_time_score * 0.3)
#                     scored_suppliers.append({**supplier, "score": total_score})
                
#                 scored_suppliers.sort(key=lambda s: s["score"], reverse=True)
                
#                 # Generate suggestions for top 2 suppliers
#                 for i, supplier in enumerate(scored_suppliers[:2]):
#                     # Calculate final quantity (consider warehouse capacity)
#                     warehouse_capacity = avg_daily_demand * 60  # Estimate capacity
#                     max_capacity = warehouse_capacity - estimated_stock
#                     final_quantity = min(recommended_quantity, max_capacity) if max_capacity > 0 else recommended_quantity
#                     final_quantity = max(final_quantity, 0)
                    
#                     # Determine priority
#                     if days_of_stock < MIN_STOCK_DAYS:
#                         priority = "High"
#                     elif days_of_stock < 14:
#                         priority = "Medium"
#                     else:
#                         priority = "Low"
                    
#                     suggestions.append({
#                         "product_id": col,
#                         "product_name": col,
#                         "supplier_id": supplier["supplier_id"],
#                         "supplier_name": supplier["name"],
#                         "recommended_quantity": round(final_quantity, 0),
#                         "estimated_cost": round(final_quantity * supplier["base_price"], 2),
#                         "eta_days": supplier["lead_time"],
#                         "supplier_reliability": supplier["reliability"],
#                         "priority": priority,
#                         "price_per_unit": round(supplier["base_price"], 2)
#                     })
        
#         print(f"✅ Generated {len(suggestions)} procurement suggestions")
        
#         # Sort by priority (High first)
#         priority_order = {"High": 3, "Medium": 2, "Low": 1}
#         suggestions.sort(key=lambda x: (
#             -priority_order.get(x["priority"], 0),
#             x["estimated_cost"]  # Secondary sort by cost
#         ))
        
#         return jsonify({
#             "suggestions": suggestions,
#             "total_count": len(suggestions),
#             "message": f"Procurement suggestions generated for {len(suggestions)} product-supplier combinations"
#         })
        
#     except Exception as e:
#         print(f"❌ Error in procurement suggestions: {e}")
#         import traceback
#         traceback.print_exc()
#         return jsonify({"error": str(e)}), 500

# @app.route("/api/inventory/optimize", methods=["GET", "POST"])
# def optimize_inventory_all_products():
#     """Optimize inventory for ALL products from CSV dataset using EOQ model with safety stock"""
#     if sales_data is None:
#         return jsonify({"error": "Sales data not loaded"}), 500
    
#     try:
#         recent_data = sales_data.tail(30)
#         optimization_results = []
        
#         # EOQ Parameters
#         HOLDING_COST_RATE = 0.20  # 20% of item cost per year
#         ORDERING_COST = 50  # Fixed cost per order
#         SERVICE_LEVEL = 0.95  # 95% service level (Z-score = 1.65)
#         Z_SCORE = 1.65  # For 95% service level
        
#         print(f"📦 Processing {len(product_columns)} products for inventory optimization")
        
#         for col in product_columns:
#             product_demand = recent_data[col].fillna(0)
#             avg_daily_demand = product_demand.mean()
#             std_daily_demand = product_demand.std() if len(product_demand) > 1 else 0
            
#             # Skip products with no demand history
#             if avg_daily_demand <= 0:
#                 avg_daily_demand = 0.1  # Small value to avoid division by zero
            
#             # Calculate demand variability
#             cv = (std_daily_demand / avg_daily_demand) if avg_daily_demand > 0 else 0  # Coefficient of variation
            
#             # Annual demand
#             annual_demand = avg_daily_demand * 365
            
#             # Get suppliers for this product
#             suppliers = get_suppliers_for_product(col)
#             if not suppliers:
#                 continue
            
#             # Find best supplier (reliability 60% + price 40%)
#             best_supplier = min(suppliers, key=lambda s: (
#                 -((s["reliability"] * 0.6) + ((1 / s["base_price"]) * 0.4))
#             ))
            
#             # Calculate average lead time (use best supplier's lead time)
#             avg_lead_time = best_supplier["lead_time"]
#             lead_time_std = avg_lead_time * 0.1  # Assume 10% variability in lead time
            
#             # Calculate Safety Stock using service level
#             # Safety Stock = Z × √(LT × σ²D + D² × σ²LT)
#             demand_variance = avg_lead_time * (std_daily_demand ** 2)
#             lead_time_variance = (avg_daily_demand ** 2) * (lead_time_std ** 2)
#             safety_stock = Z_SCORE * np.sqrt(demand_variance + lead_time_variance)
            
#             # Calculate Reorder Point
#             reorder_point = (avg_daily_demand * avg_lead_time) + safety_stock
            
#             # Calculate EOQ Optimal Quantity
#             holding_cost_per_unit = best_supplier["base_price"] * HOLDING_COST_RATE
#             if holding_cost_per_unit > 0:
#                 eoq = np.sqrt((2 * annual_demand * ORDERING_COST) / holding_cost_per_unit)
#             else:
#                 eoq = annual_demand / 12  # Fallback: monthly demand
            
#             # Estimate current stock (simulate based on demand patterns)
#             # More sophisticated: vary based on demand volatility
#             safety_stock_multiplier = 1.5 + (cv * 0.5)  # 1.5 to 2.0x based on variability
#             base_stock_days = 30
#             target_stock = avg_daily_demand * base_stock_days * safety_stock_multiplier
            
#             # Simulate inventory depletion
#             last_14_days = sales_data.tail(14)[col].fillna(0)
#             days_since_last_restock = 15
#             recent_consumption = avg_daily_demand * days_since_last_restock
#             estimated_stock = max(0, target_stock - recent_consumption + (avg_daily_demand * 30))
#             estimated_stock = max(estimated_stock, avg_daily_demand * 5)  # Minimum 5 days stock
            
#             # Warehouse capacity estimate
#             max_daily_demand = product_demand.max()
#             warehouse_capacity = max_daily_demand * 1.5 if max_daily_demand > 0 else avg_daily_demand * 2
            
#             # Adjust optimal quantity for capacity constraints
#             max_order_qty = warehouse_capacity - estimated_stock
#             optimal_quantity = min(np.ceil(eoq), max_order_qty) if max_order_qty > 0 else np.ceil(eoq)
#             optimal_quantity = max(optimal_quantity, 0)  # Ensure non-negative
            
#             # Calculate costs
#             total_cost = optimal_quantity * best_supplier["base_price"]
#             days_of_stock = (estimated_stock + optimal_quantity) / avg_daily_demand if avg_daily_demand > 0 else 0
            
#             # Determine status
#             status = "Optimal"
#             warning = None
            
#             if estimated_stock < reorder_point:
#                 status = "Understock"
#                 warning = "Current stock below reorder point"
#             elif days_of_stock > 60:
#                 status = "Overstock"
#                 warning = "Excessive inventory - consider reducing orders"
#             elif days_of_stock < 14:
#                 status = "Low Stock"
#                 warning = "Stock levels may be insufficient"
#             elif estimated_stock < (reorder_point + safety_stock):
#                 status = "Caution"
#                 warning = "Approaching reorder point"
            
#             optimization_results.append({
#                 "product_id": col,
#                 "product_name": col,
#                 "current_stock": round(estimated_stock, 2),
#                 "optimal_quantity": round(optimal_quantity, 0),
#                 "total_cost": round(total_cost, 2),
#                 "supplier_name": best_supplier["name"],
#                 "days_of_stock": round(days_of_stock, 1),
#                 "status": status,
#                 "warning": warning,
#                 "reorder_point": round(reorder_point, 2),
#                 "safety_stock": round(safety_stock, 2),
#                 "warehouse_capacity": round(warehouse_capacity, 2),
#                 "avg_daily_demand": round(avg_daily_demand, 2),
#                 "demand_variability": round(cv, 3)
#             })
        
#         print(f"✅ Generated optimization results for {len(optimization_results)} products")
        
#         # Sort by status priority (Low Stock/Understock first)
#         status_order = {"Understock": 5, "Low Stock": 4, "Caution": 3, "Optimal": 2, "Overstock": 1}
#         optimization_results.sort(key=lambda x: (
#             -status_order.get(x["status"], 0),
#             -x["days_of_stock"]  # Secondary sort: lower days first
#         ))
        
#         response_data = {
#             "results": optimization_results,
#             "total_count": len(optimization_results),
#             "message": f"Inventory optimization completed for {len(optimization_results)} products"
#         }
        
#         print(f"📤 Returning {len(optimization_results)} optimization results")
#         return jsonify(response_data)
        
#     except Exception as e:
#         print(f"❌ Error in inventory optimization: {e}")
#         import traceback
#         traceback.print_exc()
#         error_response = {
#             "error": str(e),
#             "message": "Failed to optimize inventory. Check backend logs for details."
#         }
#         return jsonify(error_response), 500

# @app.route("/api/health", methods=["GET"])
# def health():
#     """Health check endpoint"""
#     return jsonify({
#         "status": "healthy",
#         "data_loaded": sales_data is not None,
#         "products_count": len(product_columns) if product_columns else 0
#     })

# if __name__ == "__main__":
#     app.run(debug=True, port=5000)




from flask import Flask, request, jsonify, send_from_directory  # Add this
# from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import torch
import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta
import requests
import tempfile  # <-- Add this import

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Configuration
CSV_PATH = "datasets/Sales Order.csv"
CONVEX_URL = os.getenv("CONVEX_URL", "http://localhost:3000")  # Update with your Convex URL
MODEL_PATH = "models/supply_chain_model.pkl"

# Global variables (now mutable)

sales_data = None
product_columns = []
# === NEW: Shared CSV loading logic ===
def load_sales_data_from_df(df: pd.DataFrame):
    """Shared logic: load and parse any DataFrame as sales data"""
    global sales_data, product_columns
    sales_data = df.copy()
    if 'Date' not in sales_data.columns:
        raise ValueError("CSV must contain a 'Date' column")
    sales_data['Date'] = pd.to_datetime(sales_data['Date'])
    product_columns = [col for col in sales_data.columns if col != 'Date']
    print(f"Loaded {len(product_columns)} products from CSV")
# === Load default synthetic data on startup ===
if os.path.exists(CSV_PATH):
    try:
        default_df = pd.read_csv(CSV_PATH)
        load_sales_data_from_df(default_df)
        print(f"Default synthetic data loaded from {CSV_PATH}")
    except Exception as e:
        print(f"Failed to load default CSV: {e}")
else:
    print(f"Default CSV not found at {CSV_PATH}")

# === NEW: Upload CSV endpoint ===

@app.route("/api/upload_csv", methods=["POST"])

def upload_csv():

    """Accept uploaded CSV and replace current sales_data"""

    global sales_data, product_columns

    if 'file' not in request.files:

        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']

    if file.filename == '' or not file.filename.lower().endswith('.csv'):

        return jsonify({"error": "Invalid file. Please upload a CSV"}), 400

    try:

        df = pd.read_csv(file)

        if df.empty:

            return jsonify({"error": "CSV is empty"}), 400

        load_sales_data_from_df(df)  # Reuse same logic

        return jsonify({

            "success": True,

            "message": "CSV uploaded and processed successfully",

            "products_count": len(product_columns)

        })

    except Exception as e:

        print(f"Upload processing error: {e}")

        return jsonify({"error": f"Failed to process CSV: {str(e)}"}), 500


# Load CSV data
# sales_data = None
# product_columns = []




def get_suppliers_for_product(product_name):
    """Generate realistic suppliers based on product type"""
    product_lower = product_name.lower()
    
    # Tech products
    if any(tech in product_lower for tech in ['laptop', 'computer', 'smartphone', 'tablet', 'monitor']):
        return [
            {"supplier_id": "TECH001", "name": "TechCorp", "base_price": 800, "lead_time": 7, "reliability": 0.95},
            {"supplier_id": "TECH002", "name": "ElectroWorld", "base_price": 750, "lead_time": 10, "reliability": 0.90},
            {"supplier_id": "TECH003", "name": "GadgetHub", "base_price": 850, "lead_time": 5, "reliability": 0.88},
        ]
    
    # Furniture products
    elif any(furniture in product_lower for furniture in ['chair', 'desk', 'table', 'furniture', 'lamp']):
        return [
            {"supplier_id": "FURN001", "name": "FurniturePlus", "base_price": 120, "lead_time": 14, "reliability": 0.92},
            {"supplier_id": "FURN002", "name": "OfficeSupplies Co.", "base_price": 150, "lead_time": 10, "reliability": 0.85},
            {"supplier_id": "FURN003", "name": "HomeEssentials", "base_price": 100, "lead_time": 21, "reliability": 0.78},
        ]
    
    # Office supplies
    elif any(office in product_lower for office in ['mouse', 'keyboard', 'pen', 'paper', 'notebook', 'stapler']):
        return [
            {"supplier_id": "OFF001", "name": "OfficeDepot", "base_price": 25, "lead_time": 5, "reliability": 0.96},
            {"supplier_id": "OFF002", "name": "SupplyChain Pro", "base_price": 30, "lead_time": 3, "reliability": 0.94},
            {"supplier_id": "OFF003", "name": "BudgetOffice", "base_price": 20, "lead_time": 7, "reliability": 0.82},
        ]
    
    # Default suppliers for unknown products
    else:
        return [
            {"supplier_id": "GEN001", "name": "GeneralSupplier Co.", "base_price": 50, "lead_time": 10, "reliability": 0.85},
            {"supplier_id": "GEN002", "name": "ReliableGoods Inc.", "base_price": 60, "lead_time": 7, "reliability": 0.88},
            {"supplier_id": "GEN003", "name": "QuickShip Ltd.", "base_price": 70, "lead_time": 5, "reliability": 0.90},
        ]
# Load data on startup
# load_sales_data()

@app.route("/api/products", methods=["GET"])
def get_products():
    """Get list of products from CSV"""
    if sales_data is None:
        return jsonify({"error": "Sales data not loaded"}), 500
    
    products = []
    for col in product_columns:
        products.append({
            "product_id": col,
            "name": col
        })
    
    return jsonify({"products": products})

@app.route("/api/load-data", methods=["POST"])
def load_data_to_convex():
    """Load CSV data into Convex database"""
    if sales_data is None:
        return jsonify({"error": "Sales data not loaded"}), 500
    
    try:
        products = []
        demand_data = []
        
        # Prepare products
        for col in product_columns:
            products.append({
                "product_id": col,
                "name": col
            })
        
        # Prepare demand history
        for _, row in sales_data.iterrows():
            date_str = row['Date'].strftime('%Y-%m-%d')
            for col in product_columns:
                demand_value = float(row[col]) if pd.notna(row[col]) else 0.0
                if demand_value > 0:  # Only include non-zero demands
                    demand_data.append({
                        "date": date_str,
                        "product_id": col,
                        "demand": demand_value
                    })
        
        # Send to Convex (you'll need to implement the HTTP action in Convex)
        # For now, return the data structure
        return jsonify({
            "success": True,
            "products": products,
            "demand_data": demand_data[:1000],  # Limit for testing
            "total_demand_records": len(demand_data)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/history", methods=["GET"])
def get_history():
    """Get historical demand data for a product"""
    product_id = request.args.get("product_id")
    
    if not product_id:
        return jsonify({"error": "product_id is required"}), 400
    
    if sales_data is None:
        return jsonify({"error": "Sales data not loaded"}), 500
    
    if product_id not in product_columns:
        return jsonify({"error": f"Product {product_id} not found"}), 400
    
    try:
        # Get historical data for the product
        product_data = sales_data[['Date', product_id]].copy()
        product_data = product_data[product_data[product_id] > 0]  # Remove zeros
        product_data = product_data.sort_values('Date')
        
        history = []
        for _, row in product_data.iterrows():
            history.append({
                "date": row['Date'].strftime('%Y-%m-%d'),
                "demand": float(row[product_id])
            })
        
        return jsonify({
            "product_id": product_id,
            "history": history
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/predict", methods=["POST"])
def predict():
    """Generate 30-day forecast for a product using ML model or statistical method"""
    data = request.json
    product_id = data.get("product_id")
    
    if not product_id:
        return jsonify({"error": "product_id is required"}), 400
    
    if sales_data is None:
        return jsonify({"error": "Sales data not loaded"}), 500
    
    if product_id not in product_columns:
        return jsonify({"error": f"Product {product_id} not found in CSV"}), 400
    
    try:
        # Get historical data for the product
        product_data = sales_data[['Date', product_id]].copy()
        product_data = product_data[product_data[product_id] > 0]  # Remove zeros
        product_data = product_data.sort_values('Date')
        
        if len(product_data) < 7:
            return jsonify({"error": "Insufficient historical data (minimum 7 days required)"}), 400
        
        # Try to use ML model if available, otherwise use statistical forecasting
        predictions = None
        try:
            # Attempt to load and use ML model
            predictions = predict_with_ml_model(product_id, product_data)
        except Exception as ml_error:
            print(f"ML model prediction failed: {ml_error}, using statistical method")
            # Fallback to statistical forecasting
            predictions = generate_forecast(product_data[product_id].values, 30)
        
        # Generate forecast dates
        last_date = product_data['Date'].iloc[-1]
        forecast_dates = []
        for i in range(1, 31):
            forecast_date = last_date + timedelta(days=i)
            forecast_dates.append(forecast_date.strftime('%Y-%m-%d'))
        
        # Create forecast results with confidence intervals
        forecast_results = []
        for i, (date, pred) in enumerate(zip(forecast_dates, predictions)):
            # Calculate confidence intervals (increasing uncertainty over time)
            uncertainty = max(0.1, 0.05 + (i * 0.01))  # 5-35% uncertainty
            confidence_lower = max(0, pred * (1 - uncertainty))
            confidence_upper = pred * (1 + uncertainty)
            
            forecast_results.append({
                "forecast_date": date,
                "predicted_demand": round(pred, 2),
                "confidence_lower": round(confidence_lower, 2),
                "confidence_upper": round(confidence_upper, 2)
            })
        
        return jsonify({
            "product_id": product_id,
            "forecasts": forecast_results
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def predict_with_ml_model(product_id, product_data):
    """Attempt to predict using the ML model"""
    try:
        # Check if model file exists
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError("Model file not found")
        
        # Load model (simplified - you may need to adjust based on your model structure)
        # For now, fall back to statistical method
        # TODO: Integrate with actual model loading when model structure is known
        raise NotImplementedError("ML model integration pending")
        
    except Exception as e:
        raise e

def generate_forecast(historical_data, days=30):
    """Generate forecast using moving average and trend analysis"""
    # Use last 30 days for moving average
    window = min(30, len(historical_data))
    recent_data = historical_data[-window:]
    
    # Calculate moving average
    ma = np.mean(recent_data)
    
    # Calculate trend (linear regression on recent data)
    if len(recent_data) > 7:
        x = np.arange(len(recent_data))
        trend = np.polyfit(x, recent_data, 1)[0]
    else:
        trend = 0
    
    # Generate predictions
    predictions = []
    for i in range(1, days + 1):
        # Base prediction with trend
        pred = ma + (trend * i)
        
        # Add some seasonality (weekly pattern)
        day_of_week = (i - 1) % 7
        if day_of_week < 5:  # Weekday
            pred *= 1.05
        else:  # Weekend
            pred *= 0.95
        
        # Ensure non-negative
        pred = max(0, pred)
        predictions.append(pred)
    
    return predictions

@app.route("/api/dashboard/summary", methods=["GET"])
def get_dashboard_summary():
    """Get dashboard summary statistics from CSV data"""
    if sales_data is None:
        return jsonify({"error": "Sales data not loaded"}), 500
    
    try:
        # Calculate summary statistics
        total_products = len(product_columns)
        
        # Get recent demand (last 30 days) for all products
        recent_data = sales_data.tail(30)
        
        # Calculate average daily demand per product
        product_stats = []
        for col in product_columns:
            product_demand = recent_data[col].fillna(0)
            avg_daily_demand = product_demand.mean()
            max_daily_demand = product_demand.max()
            std_daily_demand = product_demand.std() if len(product_demand) > 1 else 0
            
            # Estimate current stock based on demand patterns
            # Simulate inventory: start with buffer, consume over time, restock periodically
            # More realistic: vary stock levels based on demand volatility
            
            # Calculate demand variability
            cv = (std_daily_demand / avg_daily_demand) if avg_daily_demand > 0 else 0  # Coefficient of variation
            
            # Estimate current stock level (simulate inventory management)
            # Products with higher variability need more safety stock
            safety_stock_multiplier = 1.5 + (cv * 0.5)  # 1.5 to 2.0x based on variability
            base_stock_days = 30  # Base target: 30 days of stock
            target_stock = avg_daily_demand * base_stock_days * safety_stock_multiplier
            
            # Simulate inventory depletion and replenishment
            # Assume stock depletes based on recent trend
            last_14_days = sales_data.tail(14)[col].fillna(0)
            recent_trend = last_14_days.iloc[-7:].mean() - last_14_days.iloc[:7].mean()
            
            # Estimate current stock (starts at target, depletes with demand)
            # Simple model: stock = target - (recent_consumption - recent_replenishment)
            days_since_last_restock = 15  # Assume restocking every ~15 days
            recent_consumption = avg_daily_demand * days_since_last_restock
            estimated_stock = max(0, target_stock - recent_consumption + (avg_daily_demand * 30))
            
            # Ensure stock doesn't go negative and has some minimum
            estimated_stock = max(estimated_stock, avg_daily_demand * 5)  # Minimum 5 days stock
            
            # Calculate days of stock remaining
            days_of_stock = (estimated_stock / avg_daily_demand) if avg_daily_demand > 0 else 0
            
            # Calculate utilization (based on recent demand vs capacity estimate)
            # Capacity estimate based on max demand with buffer
            capacity_estimate = max_daily_demand * 1.5 if max_daily_demand > 0 else avg_daily_demand * 2
            utilization_rate = min(100, (avg_daily_demand / capacity_estimate * 100)) if capacity_estimate > 0 else 0
            
            product_stats.append({
                "product_id": col,
                "product_name": col,
                "current_stock": round(estimated_stock, 2),
                "warehouse_capacity": round(capacity_estimate, 2),
                "days_of_stock": round(days_of_stock, 1),
                "utilization_rate": round(utilization_rate, 1),
                "avg_daily_demand": round(avg_daily_demand, 2)
            })
        
        # Count low stock items (less than 7 days)
        low_stock_items = len([p for p in product_stats if p["days_of_stock"] < 7])
        
        # Calculate average utilization
        avg_utilization = sum(p["utilization_rate"] for p in product_stats) / len(product_stats) if product_stats else 0
        
        # Estimate urgent procurement (items with very low stock or high demand)
        urgent_procurement = len([p for p in product_stats if p["days_of_stock"] < 7 or p["utilization_rate"] > 80])
        
        return jsonify({
            "total_products": total_products,
            "low_stock_items": low_stock_items,
            "urgent_procurement": urgent_procurement,
            "avg_utilization": round(avg_utilization, 1),
            "inventory_status": product_stats
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/dashboard/products", methods=["GET"])
def get_dashboard_products():
    """Get list of products for dashboard"""
    if sales_data is None:
        return jsonify({"error": "Sales data not loaded"}), 500
    
    try:
        products = []
        for col in product_columns:
            products.append({
                "product_id": col,
                "name": col
            })
        
        return jsonify({"products": products})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route("/api/procurement/suggestions", methods=["GET"])
def get_procurement_suggestions():
    """Get procurement suggestions for ALL products that need reordering"""
    if sales_data is None:
        return jsonify({"error": "Sales data not loaded"}), 500
    
    try:
        recent_data = sales_data.tail(30)
        suggestions = []
        
        # Reorder parameters
        REORDER_POINT_DAYS = 21  # Reorder when less than 21 days of stock
        MIN_STOCK_DAYS = 7  # Minimum days of stock threshold
        
        print(f"📦 Processing {len(product_columns)} products for procurement suggestions")
        
        for col in product_columns:
            product_demand = recent_data[col].fillna(0)
            avg_daily_demand = product_demand.mean()
            
            # Skip products with no demand
            if avg_daily_demand <= 0:
                avg_daily_demand = 0.1  # Small value to avoid division by zero
            
            # Calculate current stock metrics
            estimated_stock = avg_daily_demand * 15  # Simulate current stock
            days_of_stock = (estimated_stock / avg_daily_demand) if avg_daily_demand > 0 else 0
            
            # Get suppliers for this product
            suppliers = get_suppliers_for_product(col)
            if not suppliers:
                continue
            
            # Only suggest procurement for products that need reordering
            if days_of_stock < REORDER_POINT_DAYS or days_of_stock < MIN_STOCK_DAYS:
                # Calculate recommended quantity (30-45 days of demand)
                recommended_quantity = avg_daily_demand * 30
                if days_of_stock < MIN_STOCK_DAYS:
                    recommended_quantity = avg_daily_demand * 45  # More urgent
                
                # Score and sort suppliers (reliability 40%, price 30%, lead time 30%)
                scored_suppliers = []
                for supplier in suppliers:
                    reliability_score = supplier["reliability"] * 100
                    price_score = 100 / supplier["base_price"] if supplier["base_price"] > 0 else 0
                    lead_time_score = 100 / supplier["lead_time"] if supplier["lead_time"] > 0 else 0
                    total_score = (reliability_score * 0.4) + (price_score * 0.3) + (lead_time_score * 0.3)
                    scored_suppliers.append({**supplier, "score": total_score})
                
                scored_suppliers.sort(key=lambda s: s["score"], reverse=True)
                
                # Generate suggestions for top 2 suppliers
                for i, supplier in enumerate(scored_suppliers[:2]):
                    # Calculate final quantity (consider warehouse capacity)
                    warehouse_capacity = avg_daily_demand * 60  # Estimate capacity
                    max_capacity = warehouse_capacity - estimated_stock
                    final_quantity = min(recommended_quantity, max_capacity) if max_capacity > 0 else recommended_quantity
                    final_quantity = max(final_quantity, 0)
                    
                    # Determine priority
                    if days_of_stock < MIN_STOCK_DAYS:
                        priority = "High"
                    elif days_of_stock < 14:
                        priority = "Medium"
                    else:
                        priority = "Low"
                    
                    suggestions.append({
                        "product_id": col,
                        "product_name": col,
                        "supplier_id": supplier["supplier_id"],
                        "supplier_name": supplier["name"],
                        "recommended_quantity": round(final_quantity, 0),
                        "estimated_cost": round(final_quantity * supplier["base_price"], 2),
                        "eta_days": supplier["lead_time"],
                        "supplier_reliability": supplier["reliability"],
                        "priority": priority,
                        "price_per_unit": round(supplier["base_price"], 2)
                    })
        
        print(f"✅ Generated {len(suggestions)} procurement suggestions")
        
        # Sort by priority (High first)
        priority_order = {"High": 3, "Medium": 2, "Low": 1}
        suggestions.sort(key=lambda x: (
            -priority_order.get(x["priority"], 0),
            x["estimated_cost"]  # Secondary sort by cost
        ))
        
        return jsonify({
            "suggestions": suggestions,
            "total_count": len(suggestions),
            "message": f"Procurement suggestions generated for {len(suggestions)} product-supplier combinations"
        })
        
    except Exception as e:
        print(f"❌ Error in procurement suggestions: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/inventory/optimize", methods=["GET", "POST"])
def optimize_inventory_all_products():
    """Optimize inventory for ALL products from CSV dataset using EOQ model with safety stock"""
    if sales_data is None:
        return jsonify({"error": "Sales data not loaded"}), 500
    
    try:
        recent_data = sales_data.tail(30)
        optimization_results = []
        
        # EOQ Parameters
        HOLDING_COST_RATE = 0.20  # 20% of item cost per year
        ORDERING_COST = 50  # Fixed cost per order
        SERVICE_LEVEL = 0.95  # 95% service level (Z-score = 1.65)
        Z_SCORE = 1.65  # For 95% service level
        
        print(f"📦 Processing {len(product_columns)} products for inventory optimization")
        
        for col in product_columns:
            product_demand = recent_data[col].fillna(0)
            avg_daily_demand = product_demand.mean()
            std_daily_demand = product_demand.std() if len(product_demand) > 1 else 0
            
            # Skip products with no demand history
            if avg_daily_demand <= 0:
                avg_daily_demand = 0.1  # Small value to avoid division by zero
            
            # Calculate demand variability
            cv = (std_daily_demand / avg_daily_demand) if avg_daily_demand > 0 else 0  # Coefficient of variation
            
            # Annual demand
            annual_demand = avg_daily_demand * 365
            
            # Get suppliers for this product
            suppliers = get_suppliers_for_product(col)
            if not suppliers:
                continue
            
            # Find best supplier (reliability 60% + price 40%)
            best_supplier = min(suppliers, key=lambda s: (
                -((s["reliability"] * 0.6) + ((1 / s["base_price"]) * 0.4))
            ))
            
            # Calculate average lead time (use best supplier's lead time)
            avg_lead_time = best_supplier["lead_time"]
            lead_time_std = avg_lead_time * 0.1  # Assume 10% variability in lead time
            
            # Calculate Safety Stock using service level
            # Safety Stock = Z × √(LT × σ²D + D² × σ²LT)
            demand_variance = avg_lead_time * (std_daily_demand ** 2)
            lead_time_variance = (avg_daily_demand ** 2) * (lead_time_std ** 2)
            safety_stock = Z_SCORE * np.sqrt(demand_variance + lead_time_variance)
            
            # Calculate Reorder Point
            reorder_point = (avg_daily_demand * avg_lead_time) + safety_stock
            
            # Calculate EOQ Optimal Quantity
            holding_cost_per_unit = best_supplier["base_price"] * HOLDING_COST_RATE
            if holding_cost_per_unit > 0:
                eoq = np.sqrt((2 * annual_demand * ORDERING_COST) / holding_cost_per_unit)
            else:
                eoq = annual_demand / 12  # Fallback: monthly demand
            
            # Estimate current stock (simulate based on demand patterns)
            # More sophisticated: vary based on demand volatility
            safety_stock_multiplier = 1.5 + (cv * 0.5)  # 1.5 to 2.0x based on variability
            base_stock_days = 30
            target_stock = avg_daily_demand * base_stock_days * safety_stock_multiplier
            
            # Simulate inventory depletion
            last_14_days = sales_data.tail(14)[col].fillna(0)
            days_since_last_restock = 15
            recent_consumption = avg_daily_demand * days_since_last_restock
            estimated_stock = max(0, target_stock - recent_consumption + (avg_daily_demand * 30))
            estimated_stock = max(estimated_stock, avg_daily_demand * 5)  # Minimum 5 days stock
            
            # Warehouse capacity estimate
            max_daily_demand = product_demand.max()
            warehouse_capacity = max_daily_demand * 1.5 if max_daily_demand > 0 else avg_daily_demand * 2
            
            # Adjust optimal quantity for capacity constraints
            max_order_qty = warehouse_capacity - estimated_stock
            optimal_quantity = min(np.ceil(eoq), max_order_qty) if max_order_qty > 0 else np.ceil(eoq)
            optimal_quantity = max(optimal_quantity, 0)  # Ensure non-negative
            
            # Calculate costs
            total_cost = optimal_quantity * best_supplier["base_price"]
            days_of_stock = (estimated_stock + optimal_quantity) / avg_daily_demand if avg_daily_demand > 0 else 0
            
            # Determine status
            status = "Optimal"
            warning = None
            
            if estimated_stock < reorder_point:
                status = "Understock"
                warning = "Current stock below reorder point"
            elif days_of_stock > 60:
                status = "Overstock"
                warning = "Excessive inventory - consider reducing orders"
            elif days_of_stock < 14:
                status = "Low Stock"
                warning = "Stock levels may be insufficient"
            elif estimated_stock < (reorder_point + safety_stock):
                status = "Caution"
                warning = "Approaching reorder point"
            
            optimization_results.append({
                "product_id": col,
                "product_name": col,
                "current_stock": round(estimated_stock, 2),
                "optimal_quantity": round(optimal_quantity, 0),
                "total_cost": round(total_cost, 2),
                "supplier_name": best_supplier["name"],
                "days_of_stock": round(days_of_stock, 1),
                "status": status,
                "warning": warning,
                "reorder_point": round(reorder_point, 2),
                "safety_stock": round(safety_stock, 2),
                "warehouse_capacity": round(warehouse_capacity, 2),
                "avg_daily_demand": round(avg_daily_demand, 2),
                "demand_variability": round(cv, 3)
            })
        
        print(f"✅ Generated optimization results for {len(optimization_results)} products")
        
        # Sort by status priority (Low Stock/Understock first)
        status_order = {"Understock": 5, "Low Stock": 4, "Caution": 3, "Optimal": 2, "Overstock": 1}
        optimization_results.sort(key=lambda x: (
            -status_order.get(x["status"], 0),
            -x["days_of_stock"]  # Secondary sort: lower days first
        ))
        
        response_data = {
            "results": optimization_results,
            "total_count": len(optimization_results),
            "message": f"Inventory optimization completed for {len(optimization_results)} products"
        }
        
        print(f"📤 Returning {len(optimization_results)} optimization results")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ Error in inventory optimization: {e}")
        import traceback
        traceback.print_exc()
        error_response = {
            "error": str(e),
            "message": "Failed to optimize inventory. Check backend logs for details."
        }
        return jsonify(error_response), 500

@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "data_loaded": sales_data is not None,
        "products_count": len(product_columns) if product_columns else 0
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)







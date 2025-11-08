from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import torch
import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta
import requests

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Configuration
CSV_PATH = "datasets/Sales Order.csv"
CONVEX_URL = os.getenv("CONVEX_URL", "http://localhost:3000")  # Update with your Convex URL
MODEL_PATH = "models/supply_chain_model.pkl"

# Load CSV data
sales_data = None
product_columns = []

def load_sales_data():
    """Load and parse the Sales Order CSV file"""
    global sales_data, product_columns
    if os.path.exists(CSV_PATH):
        sales_data = pd.read_csv(CSV_PATH)
        # Parse date column
        sales_data['Date'] = pd.to_datetime(sales_data['Date'])
        # Get product columns (all columns except Date)
        product_columns = [col for col in sales_data.columns if col != 'Date']
        return True
    return False

# Load data on startup
load_sales_data()

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
    """Get procurement suggestions based on CSV data with dummy supplier data"""
    if sales_data is None:
        return jsonify({"error": "Sales data not loaded"}), 500
    
    try:
        # Get inventory status first (reuse dashboard logic)
        recent_data = sales_data.tail(30)
        suggestions = []
        
        # Dummy suppliers (generic suppliers for all products)
        dummy_suppliers = [
            {"supplier_id": "SUP001", "name": "Premium Supplier Co.", "base_price": 100, "lead_time": 7, "reliability": 0.95},
            {"supplier_id": "SUP002", "name": "Fast Delivery Inc.", "base_price": 120, "lead_time": 3, "reliability": 0.88},
            {"supplier_id": "SUP003", "name": "Budget Suppliers Ltd.", "base_price": 80, "lead_time": 14, "reliability": 0.75},
        ]
        
        for col in product_columns:
            product_demand = recent_data[col].fillna(0)
            avg_daily_demand = product_demand.mean()
            max_daily_demand = product_demand.max()
            std_daily_demand = product_demand.std() if len(product_demand) > 1 else 0
            
            # Calculate inventory metrics (same as dashboard)
            cv = (std_daily_demand / avg_daily_demand) if avg_daily_demand > 0 else 0
            safety_stock_multiplier = 1.5 + (cv * 0.5)
            base_stock_days = 30
            target_stock = avg_daily_demand * base_stock_days * safety_stock_multiplier
            
            last_14_days = sales_data.tail(14)[col].fillna(0)
            days_since_last_restock = 15
            recent_consumption = avg_daily_demand * days_since_last_restock
            estimated_stock = max(0, target_stock - recent_consumption + (avg_daily_demand * 30))
            estimated_stock = max(estimated_stock, avg_daily_demand * 5)
            days_of_stock = (estimated_stock / avg_daily_demand) if avg_daily_demand > 0 else 0
            
            # Determine if procurement is needed (only suggest for products with low stock)
            reorder_point = 21  # Reorder when less than 21 days of stock
            needs_procurement = days_of_stock < reorder_point and avg_daily_demand > 0
            
            if needs_procurement:
                # Calculate recommended quantity (enough for 45-60 days based on demand)
                recommended_quantity = avg_daily_demand * 45
                # Add safety buffer for high variability products
                if cv > 0.5:  # High variability
                    recommended_quantity = avg_daily_demand * 60
                
                # Determine priority based on stock level
                if days_of_stock < 7:
                    priority = "High"
                elif days_of_stock < 14:
                    priority = "Medium"
                else:
                    priority = "Low"
                
                # Generate suggestions for each supplier (show all options)
                for supplier in dummy_suppliers:
                    # Vary price based on product (simulate different product costs)
                    # Use product hash to create consistent pricing per product
                    price_variation = (hash(col) % 50) / 100 + 0.75  # 0.75 to 1.25 multiplier
                    price_per_unit = supplier["base_price"] * price_variation
                    estimated_cost = recommended_quantity * price_per_unit
                    
                    suggestions.append({
                        "product_id": col,
                        "product_name": col,
                        "supplier_id": supplier["supplier_id"],
                        "supplier_name": supplier["name"],
                        "recommended_quantity": round(recommended_quantity, 0),
                        "estimated_cost": round(estimated_cost, 2),
                        "eta_days": supplier["lead_time"],
                        "supplier_reliability": supplier["reliability"],
                        "priority": priority,
                        "price_per_unit": round(price_per_unit, 2)
                    })
        
        # Sort by priority (High first)
        priority_order = {"High": 3, "Medium": 2, "Low": 1}
        suggestions.sort(key=lambda x: (
            -priority_order.get(x["priority"], 0),
            x["estimated_cost"]  # Secondary sort by cost
        ))
        
        return jsonify({
            "suggestions": suggestions,
            "total_count": len(suggestions)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

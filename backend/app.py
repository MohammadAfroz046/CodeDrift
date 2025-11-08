from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import torch
import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta
import requests
from sklearn.preprocessing import StandardScaler

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Configuration
CSV_PATH = "datasets/Sales Order.csv"
ANOMALY_CSV_PATH = "datasets/anomaly_data.csv"
CONVEX_URL = os.getenv("CONVEX_URL", "http://localhost:3000")  # Update with your Convex URL
MODEL_PATH = "models/supply_chain_model.pkl"
ANOMALY_MODEL_PATH = "models/isolation_forest.pkl"

# Load CSV data
sales_data = None
product_columns = []

def load_sales_data():
    """Load and parse the Sales Order CSV file"""
    global sales_data, product_columns
    if os.path.exists(CSV_PATH):
        sales_data = pd.read_csv(CSV_PATH)

        # ✅ FIXED DATE PARSING (accepts "13-02-2025", "13-02-2025 00:00", mixed)
        sales_data['Date'] = pd.to_datetime(
            sales_data['Date'],
            format='mixed',
            dayfirst=True,
            errors='coerce'
        )
        sales_data = sales_data.dropna(subset=['Date'])
        sales_data = sales_data.sort_values('Date')

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
        
        for col in product_columns:
            products.append({
                "product_id": col,
                "name": col
            })
        
        for _, row in sales_data.iterrows():
            date_str = row['Date'].strftime('%Y-%m-%d')
            for col in product_columns:
                demand_value = float(row[col]) if pd.notna(row[col]) else 0.0
                if demand_value > 0:
                    demand_data.append({
                        "date": date_str,
                        "product_id": col,
                        "demand": demand_value
                    })
        
        return jsonify({
            "success": True,
            "products": products,
            "demand_data": demand_data[:1000],
            "total_demand_records": len(demand_data)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/history", methods=["GET"])
def get_history():
    product_id = request.args.get("product_id")
    
    if not product_id:
        return jsonify({"error": "product_id is required"}), 400
    
    if sales_data is None:
        return jsonify({"error": "Sales data not loaded"}), 500
    
    if product_id not in product_columns:
        return jsonify({"error": f"Product {product_id} not found"}), 400
    
    try:
        product_data = sales_data[['Date', product_id]].copy()
        product_data = product_data[product_data[product_id] > 0]
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
    data = request.json
    product_id = data.get("product_id")
    
    if not product_id:
        return jsonify({"error": "product_id is required"}), 400
    
    if sales_data is None:
        return jsonify({"error": "Sales data not loaded"}), 500
    
    if product_id not in product_columns:
        return jsonify({"error": f"Product {product_id} not found in CSV"}), 400
    
    try:
        product_data = sales_data[['Date', product_id]].copy()
        product_data = product_data[product_data[product_id] > 0]
        product_data = product_data.sort_values('Date')
        
        if len(product_data) < 7:
            return jsonify({"error": "Insufficient historical data"}), 400
        
        try:
            predictions = predict_with_ml_model(product_id, product_data)
        except:
            predictions = generate_forecast(product_data[product_id].values, 30)
        
        last_date = product_data['Date'].iloc[-1]
        forecast_dates = [(last_date + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(1, 31)]
        
        forecast_results = []
        for i, (date, pred) in enumerate(zip(forecast_dates, predictions)):
            uncertainty = max(0.1, 0.05 + (i * 0.01))
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
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("Model file not found")
    raise NotImplementedError("ML model integration pending")

def generate_forecast(historical_data, days=30):
    window = min(30, len(historical_data))
    recent_data = historical_data[-window:]
    ma = np.mean(recent_data)
    
    if len(recent_data) > 7:
        x = np.arange(len(recent_data))
        trend = np.polyfit(x, recent_data, 1)[0]
    else:
        trend = 0
    
    predictions = []
    for i in range(1, days + 1):
        pred = ma + (trend * i)
        day_of_week = (i - 1) % 7
        if day_of_week < 5:
            pred *= 1.05
        else:
            pred *= 0.95
        predictions.append(max(0, pred))
    
    return predictions

@app.route("/api/dashboard/summary", methods=["GET"])
def get_dashboard_summary():
    if sales_data is None:
        return jsonify({"error": "Sales data not loaded"}), 500
    
    try:
        total_products = len(product_columns)
        recent_data = sales_data.tail(30)
        
        product_stats = []
        for col in product_columns:
            product_demand = recent_data[col].fillna(0)
            avg_daily_demand = product_demand.mean()
            max_daily_demand = product_demand.max()
            std_daily_demand = product_demand.std() if len(product_demand) > 1 else 0
            
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
        
        low_stock_items = len([p for p in product_stats if p["days_of_stock"] < 7])
        avg_utilization = sum(p["utilization_rate"] for p in product_stats) / len(product_stats) if product_stats else 0
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
    if sales_data is None:
        return jsonify({"error": "Sales data not loaded"}), 500
    
    try:
        recent_data = sales_data.tail(30)
        suggestions = []
        
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
            
            reorder_point = 21
            needs_procurement = days_of_stock < reorder_point and avg_daily_demand > 0
            
            if needs_procurement:
                recommended_quantity = avg_daily_demand * 45
                if cv > 0.5:
                    recommended_quantity = avg_daily_demand * 60
                
                if days_of_stock < 7:
                    priority = "High"
                elif days_of_stock < 14:
                    priority = "Medium"
                else:
                    priority = "Low"
                
                for supplier in dummy_suppliers:
                    price_variation = (hash(col) % 50) / 100 + 0.75
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
        
        priority_order = {"High": 3, "Medium": 2, "Low": 1}
        suggestions.sort(key=lambda x: (-priority_order.get(x["priority"], 0), x["estimated_cost"]))
        
        return jsonify({"suggestions": suggestions, "total_count": len(suggestions)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/anomalies/detect", methods=["POST"])
def detect_anomalies():
    try:
        if not os.path.exists(ANOMALY_CSV_PATH):
            return jsonify({"error": f"Anomaly data CSV not found at {ANOMALY_CSV_PATH}"}), 404
        
        anomaly_data = pd.read_csv(ANOMALY_CSV_PATH)
        
        if len(anomaly_data) == 0:
            return jsonify({"error": "Anomaly data CSV is empty"}), 400
        
        if not os.path.exists(ANOMALY_MODEL_PATH):
            return jsonify({"error": f"Anomaly model not found at {ANOMALY_MODEL_PATH}"}), 404
        
        try:
            with open(ANOMALY_MODEL_PATH, 'rb') as f:
                model_data = pickle.load(f)
        except Exception as e:
            return jsonify({"error": f"Failed to load model: {str(e)}"}), 500
        
        if isinstance(model_data, dict):
            model = model_data.get('model')
            scaler = model_data.get('scaler')
        else:
            model = model_data
            scaler = None
        
        if model is None:
            return jsonify({"error": "Invalid model format: model is None"}), 500
        
        if not hasattr(model, 'predict'):
            return jsonify({"error": "Model does not have predict method"}), 500
        
        feature_columns = ['current_demand', 'current_stock', 'warehouse_capacity', 'lead_time_days', 'price_per_unit']
        
        missing_cols = [col for col in feature_columns if col not in anomaly_data.columns]
        if missing_cols:
            return jsonify({"error": f"Missing columns in CSV: {missing_cols}"}), 400
        
        for col in feature_columns:
            if anomaly_data[col].isna().any():
                anomaly_data[col] = anomaly_data[col].fillna(anomaly_data[col].median() if anomaly_data[col].median() > 0 else 0)
        
        features = anomaly_data[feature_columns].values.astype(np.float64)
        
        if scaler is not None:
            try:
                features = scaler.transform(features)
            except Exception as e:
                return jsonify({"error": f"Failed to scale features: {str(e)}"}), 500
        
        try:
            predictions = model.predict(features)
        except Exception as e:
            return jsonify({"error": f"Model prediction failed: {str(e)}"}), 500
        
        try:
            if hasattr(model, 'decision_function'):
                anomaly_scores = -model.decision_function(features)
            elif hasattr(model, 'score_samples'):
                anomaly_scores = -model.score_samples(features)
            else:
                anomaly_scores = np.where(predictions == -1, 1.0, 0.0)
        except Exception as e:
            return jsonify({"error": f"Failed to get anomaly scores: {str(e)}"}), 500
        
        if np.any(predictions == -1):
            threshold = None
        else:
            threshold = float(np.percentile(anomaly_scores, 90))
        
        anomalies = []
        products_dict = {}
        
        try:
            products_df = pd.read_csv(ANOMALY_CSV_PATH)
            product_details = {}
            for _, row in products_df.iterrows():
                product_id = str(row['product_id'])
                product_details[product_id] = {
                    "current_demand": float(row.get('current_demand', 0)),
                    "current_stock": float(row.get('current_stock', 0)),
                    "warehouse_capacity": float(row.get('warehouse_capacity', 0)),
                    "lead_time_days": int(row.get('lead_time_days', 0)),
                    "price_per_unit": float(row.get('price_per_unit', 0))
                }
        except Exception:
            product_details = {}
        
        for idx, row in anomaly_data.iterrows():
            product_id = str(row['product_id'])
            product_name = product_id
            
            products_dict[product_id] = {
                "product_id": product_id,
                "name": product_name,
                **(product_details.get(product_id) or {})
            }
            
            is_anomaly = predictions[idx] == -1
            
            if is_anomaly:
                score = float(anomaly_scores[idx])
                
                anomaly_indices = np.where(predictions == -1)[0]
                if len(anomaly_indices) > 0:
                    anomaly_only_scores = anomaly_scores[anomaly_indices]
                    score_percentile_5 = np.percentile(anomaly_only_scores, 5)
                    score_percentile_10 = np.percentile(anomaly_only_scores, 10)
                    
                    if score < score_percentile_5:
                        severity = "critical"
                    elif score < score_percentile_10:
                        severity = "warning"
                    else:
                        severity = "normal"
                else:
                    severity = "warning"
                
                demand = float(row['current_demand'])
                stock = float(row['current_stock'])
                capacity = float(row['warehouse_capacity'])
                stock_ratio = stock / capacity if capacity > 0 else 0
                
                if stock_ratio < 0.1:
                    anomaly_type = "low_inventory"
                    description = f"Very low inventory: {stock:.0f} units ({stock_ratio*100:.1f}% of capacity)"
                elif stock_ratio > 0.9:
                    anomaly_type = "high_inventory"
                    description = f"High inventory: {stock:.0f} units ({stock_ratio*100:.1f}% of capacity)"
                elif demand > capacity * 0.8:
                    anomaly_type = "demand_spike"
                    description = f"Unusual demand: {demand:.0f} units (exceeds 80% of capacity)"
                else:
                    anomaly_type = "supply_chain_anomaly"
                    description = f"Supply chain anomaly detected (score: {score:.3f})"
                
                product_info = product_details.get(product_id, {})
                actual_demand = product_info.get('current_demand', demand)
                actual_stock = product_info.get('current_stock', stock)
                actual_capacity = product_info.get('warehouse_capacity', capacity)
                
                anomalies.append({
                    "product_id": product_id,
                    "product_name": product_name,
                    "type": anomaly_type,
                    "severity": severity,
                    "description": description,
                    "detected_at": datetime.now().isoformat(),
                    "value": score,
                    "threshold": float(threshold) if threshold is not None else 0.0,
                    "current_demand": actual_demand,
                    "current_stock": actual_stock,
                    "warehouse_capacity": actual_capacity,
                    "lead_time_days": int(product_info.get('lead_time_days', row.get('lead_time_days', 0))),
                    "price_per_unit": float(product_info.get('price_per_unit', row.get('price_per_unit', 0)))
                })
        
        products = list(products_dict.values())
        
        return jsonify({
            "success": True,
            "anomalies": anomalies,
            "products": products,
            "total_detected": len(anomalies),
            "total_checked": len(anomaly_data)
        })
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in detect_anomalies: {error_trace}")
        return jsonify({"error": f"Anomaly detection failed: {str(e)}", "trace": error_trace}), 500

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "data_loaded": sales_data is not None,
        "products_count": len(product_columns) if product_columns else 0
    })

@app.route("/api/anomalies/raw", methods=["GET"])
def get_raw_anomaly_csv():
    try:
        if not os.path.exists(ANOMALY_CSV_PATH):
            return jsonify({"error": f"Anomaly data CSV not found at {ANOMALY_CSV_PATH}"}), 404

        df = pd.read_csv(ANOMALY_CSV_PATH)
        rows = []
        for _, r in df.iterrows():
            rows.append({
                "product_id": str(r.get('product_id')),
                "current_demand": float(r.get('current_demand', 0) or 0),
                "current_stock": float(r.get('current_stock', 0) or 0),
                "warehouse_capacity": float(r.get('warehouse_capacity', 0) or 0),
                "lead_time_days": int(r.get('lead_time_days', 0) or 0),
                "price_per_unit": float(r.get('price_per_unit', 0) or 0),
            })

        return jsonify({"rows": rows, "total": len(rows)})
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)

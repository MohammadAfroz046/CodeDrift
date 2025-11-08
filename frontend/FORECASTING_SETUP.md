# Forecasting Integration Setup Guide

This guide explains how to use the forecasting feature integrated with the Sales Order.csv file.

## Overview

The forecasting system integrates the Sales Order.csv data with the frontend to generate 30-day demand predictions. When you click "Generate Forecast", it:

1. Calls the backend API with the selected product
2. Backend processes the CSV data and generates 30-day predictions
3. Forecasts are saved to Convex database
4. Chart displays historical data and 30-day predictions

## Setup Steps

### 1. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the Flask backend server:
```bash
python app.py
```

The backend will start on `http://localhost:5000` and automatically load the Sales Order.csv file.

### 2. Frontend Setup

1. Make sure the frontend is running (usually on `http://localhost:5173` or similar)

2. Set environment variable for backend URL (if needed):
   - In Convex, set `BACKEND_URL` environment variable to `http://localhost:5000`
   - Or update `convex/forecasting.ts` directly if environment variable is not available

### 3. Using the Forecasting Screen

1. **Sync Products from CSV:**
   - Click the "Sync Products from CSV" button in the Forecasting screen
   - This loads all product columns from Sales Order.csv into the database
   - Products will appear in the dropdown

2. **Select a Product:**
   - Choose a product from the dropdown (e.g., SOS008L02P, SOS005L04P, etc.)
   - These are the column names from your Sales Order.csv file

3. **Generate Forecast:**
   - Click "Generate Forecast" button
   - The system will:
     - Call the backend API with the selected product
     - Backend processes historical data from CSV
     - Generates 30-day predictions using moving average and trend analysis
     - Saves forecasts to Convex database
     - Updates the chart and forecast table

4. **View Results:**
   - The chart shows:
     - Blue line: Historical demand data
     - Red dashed line: 30-day forecast predictions
     - Light blue area: Confidence intervals
   - The table shows all 30 forecasted days with:
     - Date
     - Predicted demand
     - Confidence range (lower - upper)
     - Trend indicators (↗️ increasing, ↘️ decreasing, ➡️ stable)

## Data Flow

```
Frontend (ForecastingScreen)
    ↓
Convex (forecasting.ts) - generateForecast mutation
    ↓
Backend API (POST /api/predict)
    ↓
Backend processes CSV data
    ↓
Generates 30-day forecast
    ↓
Returns forecasts to Convex
    ↓
Convex saves to database
    ↓
Frontend displays in chart and table
```

## API Endpoints

### Backend Endpoints

- `GET /api/health` - Health check
- `GET /api/products` - Get all products from CSV
- `POST /api/predict` - Generate forecast for a product
  ```json
  {
    "product_id": "SOS008L02P"
  }
  ```

### Convex Functions

- `data.syncProductsFromBackend` - Sync products from backend to Convex
- `forecasting.generateForecast` - Generate forecast (calls backend)
- `forecasting.getForecasts` - Get forecasts for a product
- `data.getProducts` - Get all products
- `data.getDemandHistory` - Get demand history for a product

## Forecasting Algorithm

The backend uses a simple but effective forecasting method:

1. **Moving Average**: Calculates average of last 30 days of historical data
2. **Trend Analysis**: Uses linear regression to detect trends
3. **Seasonality**: Applies weekly patterns (higher on weekdays)
4. **Confidence Intervals**: Uncertainty increases over time (5-35%)

## Troubleshooting

### Backend not responding
- Check if backend is running on port 5000
- Verify CSV file exists at `backend/datasets/Sales Order.csv`
- Check backend logs for errors

### No products in dropdown
- Click "Sync Products from CSV" button
- Check backend is running and accessible
- Verify backend `/api/products` endpoint returns data

### Forecast generation fails
- Ensure backend is running
- Check product_id exists in CSV
- Verify backend can read CSV file
- Check browser console for errors

### Chart not displaying
- Ensure forecasts are generated successfully
- Check browser console for errors
- Verify forecast data structure is correct

## Notes

- The system uses the actual column names from Sales Order.csv as product IDs
- Historical demand data can be synced from CSV if needed (use `syncDemandDataFromBackend`)
- Forecasts are stored in Convex and persist across sessions
- The chart dynamically adjusts width based on data points

## Future Improvements

- Integrate with ML model (supply_chain_model.pkl) for more accurate predictions
- Add more sophisticated forecasting algorithms
- Support for multiple forecasting models
- Export forecasts to CSV
- Email alerts for significant demand changes


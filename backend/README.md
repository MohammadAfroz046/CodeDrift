# Backend API for Supply Chain Forecasting

This Flask backend provides API endpoints for demand forecasting using the Sales Order.csv data.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Make sure the `Sales Order.csv` file is in the `datasets/` directory relative to `app.py`

3. Set environment variables (optional):
```bash
export BACKEND_URL=http://localhost:5000
export CONVEX_URL=http://localhost:3000
```

4. Run the Flask server:
```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### GET /api/health
Health check endpoint
- Returns: Status of the backend and data loading

### GET /api/products
Get list of all products from CSV
- Returns: List of products with product_id and name

### POST /api/predict
Generate 30-day forecast for a product
- Request Body:
  ```json
  {
    "product_id": "SOS008L02P"
  }
  ```
- Returns: 30-day forecast with confidence intervals
  ```json
  {
    "product_id": "SOS008L02P",
    "forecasts": [
      {
        "forecast_date": "2023-08-10",
        "predicted_demand": 1234.56,
        "confidence_lower": 1111.10,
        "confidence_upper": 1358.02
      },
      ...
    ]
  }
  ```

### POST /api/load-data
Load CSV data structure (for debugging)
- Returns: Products and demand data structure

## Notes

- The backend loads the CSV file on startup
- Forecasting uses moving average and trend analysis
- Confidence intervals increase over time to reflect uncertainty
- The backend can be called from Convex mutations to generate forecasts


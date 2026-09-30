import os
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from dotenv import load_dotenv
from sklearn.linear_model import LinearRegression  # <-- Actual ML Model

load_dotenv()

app = FastAPI(title="Mercury ML Forecasting Engine", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/mercury_db")
    return psycopg2.connect(DATABASE_URL)

@app.get("/predict-demand")
def predict_demand():
    """
    True ML Analytics Pipeline: Fetches historical order logs and trains a 
    Scikit-Learn Linear Regression model per product to forecast 7-day demand.
    """
    try:
        conn = get_db_connection()
        query = """
            SELECT 
                p.id,
                p.sku,
                p.name,
                p.category,
                p.current_price,
                i.warehouse_name,
                i.stock_quantity,
                i.reorder_threshold,
                o.quantity AS order_qty,
                o.order_date
            FROM products p
            JOIN inventory i ON p.id = i.product_id
            LEFT JOIN orders o ON p.id = o.product_id;
        """
        df = pd.read_sql(query, conn)
        conn.close()

        if df.empty:
            raise HTTPException(status_code=404, detail="No product data found.")

        predictions = []
        grouped = df.groupby(['id', 'sku', 'name', 'category', 'current_price', 'warehouse_name', 'stock_quantity', 'reorder_threshold'])

        for name_key, group in grouped:
            prod_id, sku, name, category, current_price, warehouse, stock_qty, reorder_thresh = name_key
            
            order_group = group[['order_qty', 'order_date']].dropna()
            
            if not order_group.empty:
                order_group['order_date'] = pd.to_datetime(order_group['order_date'])
                order_group = order_group.sort_values('order_date')
                
                # --- ACTUAL MACHINE LEARNING IMPLEMENTATION ---
                # Prepare features (X: time index sequence) and target (y: order quantity)
                X = np.arange(len(order_group)).reshape(-1, 1)
                y = order_group['order_qty'].values
                
                if len(X) >= 2:
                    # Initialize and train a Scikit-Learn Linear Regression model
                    model = LinearRegression()
                    model.fit(X, y)
                    
                    # Predict future daily trend for the next 7 time steps
                    future_X = np.arange(len(X), len(X) + 7).reshape(-1, 1)
                    predicted_daily = model.predict(future_X)
                    
                    # Sum the 7-day predictions, ensuring no negative forecasts
                    forecast_7day = int(np.ceil(max(5, np.sum(predicted_daily))))
                else:
                    # Fallback if only 1 data point exists
                    forecast_7day = int(y[0] * 7) if len(y) > 0 else 5
            else:
                forecast_7day = 5 

            # Stockout Risk Calculation
            days_until_stockout = round(stock_qty / (forecast_7day / 7), 1) if forecast_7day > 0 else 99.9
            
            stockout_probability = int(round((forecast_7day / (stock_qty + 1)) * 100))
            if stockout_probability > 100:
                stockout_probability = 99
            if stock_qty == 0:
                stockout_probability = 100

            recommendation = None
            if stockout_probability > 70:
                reorder_amount = forecast_7day + int(reorder_thresh) - int(stock_qty)
                recommendation = f"ML Recommended reorder: {max(50, reorder_amount)} units"

            predictions.append({
                "id": int(prod_id),
                "sku": sku,
                "name": name,
                "category": category,
                "currentPrice": float(current_price),
                "warehouse": warehouse,
                "currentInventory": int(stock_qty),
                "forecast7Day": forecast_7day,
                "daysUntilStockout": float(days_until_stockout),
                "stockoutProbability": f"{stockout_probability}%",
                "recommendation": recommendation,
                "statusAlert": "High Stockout Risk" if stockout_probability > 70 else "Stable"
            })

        return {
            "success": True,
            "engine": "Python FastAPI + Scikit-Learn LinearRegression Regressor Model",
            "totalTrackedProducts": len(predictions),
            "data": predictions
        }

    except Exception as e:
        print(f"ML Pipeline Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
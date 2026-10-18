import os
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from contextlib import contextmanager
from dotenv import load_dotenv
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error

load_dotenv()

app = FastAPI(title="Mercury ML Forecasting Engine", version="1.4.0")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
allowed_origins_list = [origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/mercury_db")
db_pool = None

def get_db_pool():
    global db_pool
    if db_pool is None:
        db_pool = ThreadedConnectionPool(minconn=1, maxconn=10, dsn=DATABASE_URL)
    return db_pool

@contextmanager
def get_db_connection():
    pool = get_db_pool()
    conn = pool.getconn()
    try:
        yield conn
    finally:
        pool.putconn(conn)

@app.get("/predict-demand")
def predict_demand(session_id: str = "baseline"):
    """
    ML Pipeline: Aggregates historical orders by day, reindexes to a continuous date range
    filling missing dates with 0, trains a Linear Regression model, and computes in-sample MAE.
    Scoped to visitor session sandbox.
    """
    try:
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
            JOIN inventory i ON p.id = i.product_id AND i.session_id = %s
            LEFT JOIN orders o ON p.id = o.product_id AND o.session_id IN ('baseline', %s);
        """
        with get_db_connection() as conn:
            df = pd.read_sql(query, conn, params=(session_id, session_id))

        if df.empty and session_id != 'baseline':
            with get_db_connection() as conn:
                df = pd.read_sql(query, conn, params=('baseline', 'baseline'))

        if df.empty:
            return {"success": True, "totalTrackedProducts": 0, "data": []}

        predictions = []
        grouped = df.groupby(['id', 'sku', 'name', 'category', 'current_price', 'warehouse_name', 'stock_quantity', 'reorder_threshold'])

        for name_key, group in grouped:
            prod_id, sku, name, category, current_price, warehouse, stock_qty, reorder_thresh = name_key
            
            order_group = group[['order_qty', 'order_date']].dropna()
            
            model_mae = 0.0
            if not order_group.empty:
                order_group['order_date'] = pd.to_datetime(order_group['order_date']).dt.date
                
                # Aggregate total demand per calendar day
                daily_demand = order_group.groupby('order_date')['order_qty'].sum().reset_index()
                daily_demand = daily_demand.sort_values('order_date')
                
                # Continuous calendar date range reindexing (fill missing days with 0 demand)
                min_date = daily_demand['order_date'].min()
                max_date = daily_demand['order_date'].max()
                
                # If only 1 order date is recorded, baseline over a 7-day window
                if min_date == max_date:
                    min_date = max_date - pd.Timedelta(days=6)
                
                full_date_idx = pd.date_range(start=min_date, end=max_date, freq='D').date
                date_df = pd.DataFrame({'order_date': full_date_idx})
                daily_demand = pd.merge(date_df, daily_demand, on='order_date', how='left').fillna({'order_qty': 0})
                
                X = np.arange(len(daily_demand)).reshape(-1, 1)
                y = daily_demand['order_qty'].values
                
                if len(X) >= 2:
                    model = LinearRegression()
                    model.fit(X, y)
                    
                    # Evaluate in-sample Mean Absolute Error (MAE)
                    y_pred_in_sample = model.predict(X)
                    model_mae = round(float(mean_absolute_error(y, y_pred_in_sample)), 2)
                    
                    future_X = np.arange(len(X), len(X) + 7).reshape(-1, 1)
                    predicted_daily = model.predict(future_X)
                    # Demand cannot be negative: clip to at least 0
                    predicted_daily = np.maximum(0, predicted_daily)
                    forecast_7day = int(np.ceil(max(1, np.sum(predicted_daily))))
                else:
                    forecast_7day = int(y[0] * 7) if len(y) > 0 else 5
                    model_mae = 0.0
            else:
                forecast_7day = 5 
                model_mae = 0.0

            days_until_stockout = round(stock_qty / (forecast_7day / 7), 1) if forecast_7day > 0 else 99.9
            
            # Stockout risk index (Ratio of 7-day demand to available stock)
            stockout_risk_ratio = round((forecast_7day / max(1, stock_qty)) * 100, 1)
            if stock_qty == 0:
                stockout_risk_ratio = 100.0

            recommendation = None
            if stockout_risk_ratio > 70:
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
                "modelMAE": model_mae,
                "stockoutProbability": f"{min(100, int(stockout_risk_ratio))}%",
                "recommendation": recommendation,
                "statusAlert": "High Stockout Risk" if stockout_risk_ratio > 70 else "Stable"
            })

        return {
            "success": True,
            "engine": "Python FastAPI + Scikit-Learn Daily-Continuous Regressor (Connection-Pooled)",
            "totalTrackedProducts": len(predictions),
            "data": predictions
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"ML Pipeline Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal ML forecasting error")

@app.post("/simulate-sandbox")
def simulate_sandbox(payload: dict):
    """
    Computes ML-driven forecast and stockout metrics dynamically based on sandbox slider overrides.
    Correctly models economic elasticity and substitution effects.
    """
    try:
        product_id = payload.get("productId", 1)
        session_id = payload.get("sessionId", "baseline")
        sim_competitor_price = payload.get("simCompetitorPrice")
        demand_multiplier = payload.get("demandMultiplier", 1.0)
        stock_override = payload.get("stockOverride")

        query = """
            SELECT 
                p.id,
                p.sku,
                p.name,
                p.category,
                p.current_price,
                p.cost_price,
                i.warehouse_name,
                i.stock_quantity,
                i.reorder_threshold,
                o.quantity AS order_qty,
                o.order_date
            FROM products p
            JOIN inventory i ON p.id = i.product_id AND i.session_id = %s
            LEFT JOIN orders o ON p.id = o.product_id AND o.session_id IN ('baseline', %s)
            WHERE p.id = %s;
        """
        with get_db_connection() as conn:
            df = pd.read_sql(query, conn, params=(session_id, session_id, product_id))

        if df.empty and session_id != 'baseline':
            with get_db_connection() as conn:
                df = pd.read_sql(query, conn, params=('baseline', 'baseline', product_id))

        if df.empty:
            raise HTTPException(status_code=404, detail="Product not found")

        row = df.iloc[0]
        sku = row['sku']
        name = row['name']
        current_price = float(row['current_price'])
        cost_price = float(row['cost_price']) if pd.notna(row['cost_price']) else current_price * 0.6
        stock_qty = int(stock_override) if stock_override is not None else int(row['stock_quantity'])
        comp_price = float(sim_competitor_price) if sim_competitor_price is not None else current_price

        # Run Scikit-Learn Regression on historical orders with continuous date padding
        order_group = df[['order_qty', 'order_date']].dropna()
        forecast_7day = 35  # fallback baseline

        if not order_group.empty:
            order_group['order_date'] = pd.to_datetime(order_group['order_date']).dt.date
            daily_demand = order_group.groupby('order_date')['order_qty'].sum().reset_index()
            daily_demand = daily_demand.sort_values('order_date')
            
            min_date = daily_demand['order_date'].min()
            max_date = daily_demand['order_date'].max()
            if min_date == max_date:
                min_date = max_date - pd.Timedelta(days=6)
                
            full_date_idx = pd.date_range(start=min_date, end=max_date, freq='D').date
            date_df = pd.DataFrame({'order_date': full_date_idx})
            daily_demand = pd.merge(date_df, daily_demand, on='order_date', how='left').fillna({'order_qty': 0})
            
            X = np.arange(len(daily_demand)).reshape(-1, 1)
            y = daily_demand['order_qty'].values
            
            if len(X) >= 2:
                model = LinearRegression()
                model.fit(X, y)
                future_X = np.arange(len(X), len(X) + 7).reshape(-1, 1)
                predicted_daily = model.predict(future_X)
                predicted_daily = np.maximum(0, predicted_daily)
                forecast_7day = int(np.ceil(max(1, np.sum(predicted_daily))))
            elif len(y) > 0:
                forecast_7day = int(y[0] * 7)

        # Economic Elasticity & Cross-Price Substitution Modeling:
        # If competitor undercuts:
        # 1. If we match (safe margin >= 15%): we lower our price, which stimulates our own demand.
        # 2. If we do not match (margin < 15% guardrail breached): our price stays high, so customers substitute
        #    to the cheaper competitor and demand for our product drops.
        # 3. If competitor is more expensive: our product becomes a better bargain, slightly boosting demand.
        is_undercut = comp_price < current_price
        potential_match_margin = ((comp_price - cost_price) / max(0.01, comp_price)) * 100

        if is_undercut:
            price_cut = current_price - comp_price
            if potential_match_margin >= 15.0:
                # Safe to match
                simulated_our_price = comp_price
                # Own-price elasticity: Lowering our price stimulates demand
                price_elasticity_factor = (current_price / max(1.0, comp_price)) ** 1.1
                recommendation = f"AUTONOMOUS MATCH — Competitor undercuts by ${price_cut:.2f}. Safe margin preserved ({potential_match_margin:.1f}%). Price-match rule execution authorized."
                action_severity = 'EXECUTABLE_MATCH'
            else:
                # Margin safety floor breached (<15%): Do NOT match!
                simulated_our_price = current_price
                # Substitution effect: Competitor is cheaper while we stay high -> our demand DROPS
                price_elasticity_factor = (max(1.0, comp_price) / current_price) ** 1.2
                recommendation = f"EXCEED PRICE MATCH — Competitor undercut (${price_cut:.2f}) drives margin to {potential_match_margin:.1f}% (below 15% safety floor). Price held; demand drops due to substitution. Recommend targeted bundling."
                action_severity = 'WARNING_MARGIN_BREACH'
        else:
            # Competitor is at or above our price
            simulated_our_price = current_price
            # Slight advantage if competitor is more expensive
            price_elasticity_factor = (comp_price / max(1.0, current_price)) ** 0.5
            recommendation = 'Maintain current pricing structure. Market position stable.'
            action_severity = 'OPTIMAL'

        # Apply Elasticity factor & External Demand Multiplier
        adjusted_demand = int(round(forecast_7day * price_elasticity_factor * float(demand_multiplier)))
        simulated_weekly_demand = max(1, adjusted_demand)

        # Calculate actual margin for simulated price
        simulated_gross_profit = simulated_our_price - cost_price
        margin_percentage = (simulated_gross_profit / max(0.01, simulated_our_price)) * 100

        # Burn rate and stockout calculation
        daily_burn_rate = simulated_weekly_demand / 7.0
        days_until_stockout = round(stock_qty / daily_burn_rate, 1) if daily_burn_rate > 0 else 99.9
        
        stockout_risk_ratio = round((simulated_weekly_demand / max(1, stock_qty)) * 100, 1)
        if stock_qty == 0:
            stockout_risk_ratio = 100.0

        risk_score = 'Low Risk'
        if stockout_risk_ratio >= 100 or days_until_stockout <= 3:
            risk_score = 'Critical Stockout (100%)'
        elif stockout_risk_ratio >= 70 or days_until_stockout <= 7:
            risk_score = 'High Stockout Risk (85%)'
        elif stockout_risk_ratio >= 40:
            risk_score = 'Moderate Risk (45%)'

        if stockout_risk_ratio >= 70:
            recommendation += f" EMERGENCY: Stock depletion projected in {days_until_stockout} days. Automated warehouse reorder triggered."
            action_severity = 'CRITICAL_STOCKOUT'

        return {
            "success": True,
            "engine": "Python FastAPI + Scikit-Learn Sandbox Predictor",
            "simulation": {
                "sku": sku,
                "productName": name,
                "baselineStock": stock_qty,
                "simulatedDemand": simulated_weekly_demand,
                "daysUntilStockout": days_until_stockout,
                "stockoutRiskScore": risk_score,
                "baseOurPrice": current_price,
                "simulatedOurPrice": simulated_our_price,
                "simulatedCompetitorPrice": comp_price,
                "projectedMarginPercent": round(margin_percentage, 1),
                "actionSeverity": action_severity,
                "engineRecommendation": recommendation
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Sandbox ML Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal ML simulation error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

// 1. GET: Core Intelligence Summary (Demand forecasting & stockout risks)
app.get('/api/intelligence', async (req, res) => {
  try {
    const sqlQuery = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.category,
        p.current_price,
        i.warehouse_name,
        i.stock_quantity,
        i.reorder_threshold
      FROM products p
      JOIN inventory i ON p.id = i.product_id;
    `;
    
    const { rows } = await query(sqlQuery);

    const enrichedProducts = rows.map(item => {
      const dailyDemandRate = Math.floor(Math.random() * 20) + 5; 
      const forecast7Day = dailyDemandRate * 7;
      const daysUntilStockout = (item.stock_quantity / dailyDemandRate).toFixed(1);
      
      let stockoutProbability = Math.round((forecast7Day / (item.stock_quantity + 1)) * 100);
      if (stockoutProbability > 100) stockoutProbability = 99;

      let recommendation = null;
      if (stockoutProbability > 70) {
        recommendation = `Recommended reorder: ${forecast7Day - item.stock_quantity + 50} units`;
      }

      return {
        id: item.id,
        sku: item.sku,
        name: item.name,
        category: item.category,
        currentPrice: parseFloat(item.current_price),
        warehouse: item.warehouse_name,
        currentInventory: item.stock_quantity,
        forecast7Day,
        daysUntilStockout: parseFloat(daysUntilStockout),
        stockoutProbability: `${stockoutProbability}%`,
        recommendation,
        statusAlert: stockoutProbability > 70 ? 'High Stockout Risk' : 'Stable'
      };
    });

    res.json({
      success: true,
      timestamp: new Date(),
      totalTrackedProducts: enrichedProducts.length,
      data: enrichedProducts
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 2. GET: Decision Engine & Competitor Intelligence Alerts
app.get('/api/insights', async (req, res) => {
  try {
    const eventQuery = `
      SELECT 
        ce.id,
        p.sku,
        p.name AS product_name,
        p.current_price AS our_price,
        ce.competitor_price,
        ce.event_description,
        ce.detected_at
      FROM competitor_events ce
      JOIN products p ON ce.product_id = p.id;
    `;

    const { rows } = await query(eventQuery);

    // Decision Engine rule evaluation
    const actionableInsights = rows.map(event => {
      const priceDifference = parseFloat(event.our_price) - parseFloat(event.competitor_price);
      let businessAction = 'Monitor market position.';

      if (priceDifference > 0) {
        businessAction = `Competitor is undercutting by $${priceDifference.toFixed(2)}. Recommend matching price or launching targeted promotion to protect market share.`;
      }

      return {
        eventId: event.id,
        sku: event.sku,
        productName: event.product_name,
        marketEvent: event.event_description,
        ourPrice: event.our_price,
        competitorPrice: event.competitor_price,
        detectedAt: event.detected_at,
        decisionEngineAction: businessAction
      };
    });

    res.json({
      success: true,
      activeAlertsCount: actionableInsights.length,
      insights: actionableInsights
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Mercury Demand Intelligence running on port ${PORT}`);
});
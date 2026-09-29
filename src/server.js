import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

// GET: Fetch real-time intelligence summary for the "Operations" dashboard
app.get('/api/intelligence', async (req, res) => {
  try {
    // Query products along with their inventory and calculated metrics
    const sqlQuery = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.current_price,
        i.stock_quantity,
        i.reorder_threshold
      FROM products p
      JOIN inventory i ON p.id = i.product_id;
    `;
    
    const { rows } = await query(sqlQuery);

    // Business Logic & Mock Analytics Layer (Simulating the ML engine output)
    const enrichedProducts = rows.map(item => {
      // Heuristic simulation
      const dailyDemandRate = Math.floor(Math.random() * 20) + 5; // e.g., 5-25 units sold/day
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
        currentPrice: item.current_price,
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
    res.status(500).send('Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Mercury Intelligence Engine running on port ${PORT}`);
});
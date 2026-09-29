import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

// 1. GET: Real Analytics Intelligence Pipeline (Replacing mocks with SQL aggregations)
app.get('/api/intelligence', async (req, res) => {
  try {
    // Aggregate total quantity ordered over the past 7 days per product to calculate true velocity
    const sqlQuery = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.category,
        p.current_price,
        i.warehouse_name,
        i.stock_quantity,
        i.reorder_threshold,
        COALESCE(SUM(o.quantity), 0) AS units_sold_last_7_days
      FROM products p
      JOIN inventory i ON p.id = i.product_id
      LEFT JOIN orders o ON p.id = o.product_id AND o.order_date >= NOW() - INTERVAL '7 days'
      GROUP BY p.id, i.warehouse_name, i.stock_quantity, i.reorder_threshold;
    `;
    
    const { rows } = await query(sqlQuery);

    const enrichedProducts = rows.map(item => {
      const totalSold7Days = parseInt(item.units_sold_last_7_days) || 1; // fallback prevent zero division
      const dailyDemandRate = totalSold7Days / 7;
      const forecast7Day = Math.round(dailyDemandRate * 7);
      
      const daysUntilStockout = item.stock_quantity > 0 
        ? (item.stock_quantity / dailyDemandRate).toFixed(1) 
        : 0;
      
      let stockoutProbability = Math.round((forecast7Day / (item.stock_quantity + 1)) * 100);
      if (stockoutProbability > 100) stockoutProbability = 99;
      if (item.stock_quantity === 0) stockoutProbability = 100;

      let recommendation = null;
      if (stockoutProbability > 70) {
        recommendation = `Recommended reorder: ${forecast7Day + item.reorder_threshold - item.stock_quantity} units`;
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

// 3. POST: Live Event Ingestion / Simulator Endpoint (Allows users to simulate orders)
app.post('/api/simulate-order', async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity) {
    return res.status(400).json({ error: 'productId and quantity are required.' });
  }

  try {
    // Begin transaction
    await query('BEGIN');

    // Get product price
    const prodRes = await query('SELECT current_price FROM products WHERE id = $1', [productId]);
    if (prodRes.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found.' });
    }

    const price = parseFloat(prodRes.rows[0].current_price);
    const totalAmount = price * quantity;

    // Insert new order record
    await query(
      'INSERT INTO orders (product_id, quantity, total_amount, order_date) VALUES ($1, $2, $3, NOW())',
      [productId, quantity, totalAmount]
    );

    // Decrement inventory stock
    await query(
      'UPDATE inventory SET stock_quantity = GREATEST(0, stock_quantity - $1), updated_at = NOW() WHERE product_id = $2',
      [quantity, productId]
    );

    await query('COMMIT');

    res.json({
      success: true,
      message: `Successfully simulated order of ${quantity} units. Inventory depleted and forecasting pipeline updated.`
    });

  } catch (err) {
    await query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Failed to process order simulation.' });
  }
});

app.listen(PORT, () => {
  console.log(`Mercury Demand Intelligence running on port ${PORT}`);
});
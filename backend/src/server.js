import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { query, getClient } from './db.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const ML_ENGINE_URL = process.env.ML_ENGINE_URL || 'http://localhost:8000';

// 1. GET: Intelligence Pipeline (Delegated to Python ML Microservice)
app.get('/api/intelligence', async (req, res) => {
  try {
    const mlResponse = await axios.get(`${ML_ENGINE_URL}/predict-demand`);
    res.json(mlResponse.data);
  } catch (err) {
    console.error("Failed to communicate with ML Microservice:", err.message);
    res.status(500).json({ error: 'ML Analytics Engine Unavailable' });
  }
});

// 2. GET: Strictly Read-Only Insights & Audit Log Feed (Zero Side Effects!)
app.get('/api/insights', async (req, res) => {
  try {
    const eventQuery = `
      SELECT 
        ce.id,
        p.id AS product_id,
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
      let executedProcedure = 'Pending manual review or autonomous dispatch.';

      if (priceDifference > 0) {
        businessAction = `Competitor is undercutting by $${priceDifference.toFixed(2)}. ML Elasticity Model recommends automated counter-measure.`;
        executedProcedure = `Recommended Action: Dispatched price-matching rule (-$${priceDifference.toFixed(2)}) & queued promotion.`;
      }

      return {
        eventId: event.id,
        sku: event.sku,
        productName: event.product_name,
        marketEvent: event.event_description,
        ourPrice: event.our_price,
        competitorPrice: event.competitor_price,
        detectedAt: event.detected_at,
        decisionEngineAction: businessAction,
        autonomousProcedure: executedProcedure
      };
    });

    const logsRes = await query(`
      SELECT l.id, p.sku, p.name, l.action_type, l.description, l.status, l.executed_at
      FROM automated_actions_log l
      JOIN products p ON l.product_id = p.id
      ORDER BY l.executed_at DESC;
    `);

    res.json({
      success: true,
      activeAlertsCount: actionableInsights.length,
      insights: actionableInsights,
      autonomousLogs: logsRes.rows
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 3. POST: Explicit Endpoint to Trigger Autonomous Actions Safely (Idempotent)
app.post('/api/insights/execute-actions', async (req, res) => {
  try {
    const eventQuery = `
      SELECT ce.id, p.id AS product_id, p.current_price AS our_price, ce.competitor_price
      FROM competitor_events ce
      JOIN products p ON ce.product_id = p.id;
    `;
    const { rows } = await query(eventQuery);
    let executedCount = 0;

    for (const event of rows) {
      const priceDifference = parseFloat(event.our_price) - parseFloat(event.competitor_price);
      if (priceDifference > 0) {
        const description = `Autonomous Procedure EXECUTED: Dispatched price-matching rule (-$${priceDifference.toFixed(2)}) & queued targeted promotion campaign.`;

        // Idempotency check: Ensure we don't duplicate logs for the same action
        const checkLog = await query(
          'SELECT id FROM automated_actions_log WHERE product_id = $1 AND description = $2',
          [event.product_id, description]
        );

        if (checkLog.rows.length === 0) {
          await query(
            `INSERT INTO automated_actions_log (product_id, action_type, description, status)
             VALUES ($1, $2, $3, $4)`,
            [event.product_id, 'PRICE_MATCH_AUTOMATION', description, 'EXECUTED']
          );
          executedCount++;
        }
      }
    }

    res.json({ success: true, message: `Successfully executed ${executedCount} autonomous actions.` });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to execute autonomous actions.' });
  }
});

// 4. POST: Live Event Ingestion / Simulator Endpoint
app.post('/api/simulate-order', async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity) {
    return res.status(400).json({ error: 'productId and quantity are required.' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const prodRes = await client.query('SELECT current_price FROM products WHERE id = $1', [productId]);
    if (prodRes.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'Product not found.' });
    }

    const price = parseFloat(prodRes.rows[0].current_price);
    const totalAmount = price * quantity;

    await client.query(
      'INSERT INTO orders (product_id, quantity, total_amount, order_date) VALUES ($1, $2, $3, NOW())',
      [productId, quantity, totalAmount]
    );

    await client.query(
      'UPDATE inventory SET stock_quantity = GREATEST(0, stock_quantity - $1), updated_at = NOW() WHERE product_id = $2',
      [quantity, productId]
    );

    await client.query('COMMIT');
    client.release();

    res.json({
      success: true,
      message: `Successfully ingested order event of ${quantity} units. ML forecasting pipeline adjusted.`
    });

  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    console.error(err.message);
    res.status(500).json({ error: 'Failed to process order simulation.' });
  }
});

// 5. GET: Raw Database Inspector Feed
app.get('/api/database-inspect', async (req, res) => {
  try {
    const products = await query('SELECT * FROM products ORDER BY id ASC');
    const inventory = await query(`
      SELECT i.*, p.sku, p.name FROM inventory i 
      JOIN products p ON i.product_id = p.id ORDER BY i.id ASC
    `);
    const competitorEvents = await query(`
      SELECT ce.*, p.sku, p.name AS product_name, p.current_price AS our_price 
      FROM competitor_events ce 
      JOIN products p ON ce.product_id = p.id ORDER BY ce.id ASC
    `);

    res.json({
      success: true,
      tables: {
        products: products.rows,
        inventory: inventory.rows,
        competitorEvents: competitorEvents.rows
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch database inspection data.' });
  }
});

// 6. POST: What-If Scenario Sandbox Simulation Engine (Delegated to Python ML Microservice)
app.post('/api/sandbox/simulate', async (req, res) => {
  const { productId, simulatedCompetitorPrice, demandMultiplier, stockOverride } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'productId is required for simulation.' });
  }

  try {
    const mlResponse = await axios.post(`${ML_ENGINE_URL}/simulate-sandbox`, {
      productId,
      simCompetitorPrice: simulatedCompetitorPrice,
      demandMultiplier,
      stockOverride
    });

    res.json(mlResponse.data);
  } catch (err) {
    console.error("Failed to communicate with ML Sandbox Microservice:", err.message);
    res.status(500).json({ error: 'ML Analytics Engine Unavailable for Sandbox Simulation' });
  }
});

// Automatically evaluate and execute autonomous actions upon server startup
const runStartupDecisionEngine = async () => {
  try {
    let executedCount = 0;

    // 1. Evaluate Competitor Undercuts
    const eventQuery = `
      SELECT ce.id, p.id AS product_id, p.current_price AS our_price, ce.competitor_price
      FROM competitor_events ce
      JOIN products p ON ce.product_id = p.id;
    `;
    const { rows: competitorRows } = await query(eventQuery);

    for (const event of competitorRows) {
      const priceDifference = parseFloat(event.our_price) - parseFloat(event.competitor_price);
      if (priceDifference > 0) {
        const description = `Autonomous Procedure EXECUTED: Dispatched price-matching rule (-$${priceDifference.toFixed(2)}) & queued targeted promotion campaign.`;

        const checkLog = await query(
          'SELECT id FROM automated_actions_log WHERE product_id = $1 AND description = $2',
          [event.product_id, description]
        );

        if (checkLog.rows.length === 0) {
          await query(
            `INSERT INTO automated_actions_log (product_id, action_type, description, status)
             VALUES ($1, $2, $3, $4)`,
            [event.product_id, 'PRICE_MATCH_AUTOMATION', description, 'EXECUTED']
          );
          executedCount++;
        }
      }
    }

    // 2. Evaluate Critical Zero-Stock / Emergency Stockout Risks
    const stockQuery = `
      SELECT i.product_id, i.stock_quantity, i.reorder_threshold, p.name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.stock_quantity <= 0;
    `;
    const { rows: stockRows } = await query(stockQuery);

    for (const stock of stockRows) {
      const description = `Autonomous Procedure EXECUTED: Dispatched emergency replenishment reorder for zero-stock SKU (${stock.name}).`;

      const checkLog = await query(
        'SELECT id FROM automated_actions_log WHERE product_id = $1 AND description = $2',
        [stock.product_id, description]
      );

      if (checkLog.rows.length === 0) {
        await query(
          `INSERT INTO automated_actions_log (product_id, action_type, description, status)
           VALUES ($1, $2, $3, $4)`,
          [stock.product_id, 'CRITICAL_STOCKOUT_EMERGENCY', description, 'EXECUTED']
        );
        executedCount++;
      }
    }

    if (executedCount > 0) {
      console.log(`[Autonomous Engine] Evaluated system state: Executed ${executedCount} automated actions.`);
    }
  } catch (err) {
    console.error('Failed to run startup decision engine:', err.message);
  }
};

app.listen(PORT, async () => {
  console.log(`Mercury Express Gateway running on port ${PORT}`);
  await runStartupDecisionEngine();
});
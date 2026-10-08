import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { query, getClient } from './db.js';
import { runDecisionEngine } from './services/decisionEngine.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const ML_ENGINE_URL = process.env.ML_ENGINE_URL || 'http://localhost:8000';

// Helper validator for positive integers (IDs, quantities)
const isValidPositiveInt = (val) => {
  const num = Number(val);
  return Number.isInteger(num) && num > 0;
};

// Helper validator for non-negative numbers (prices, multipliers, overrides)
const isValidNonNegativeNumber = (val) => {
  const num = Number(val);
  return !isNaN(num) && num >= 0;
};

// 0. GET: Lightweight Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const start = Date.now();
    await query('SELECT 1');
    const dbLatency = Date.now() - start;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'connected',
        latencyMs: dbLatency
      }
    });
  } catch (err) {
    console.error('Health check failed:', err.message);

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'disconnected',
        error: err.message
      }
    });
  }
});

// 1. GET: Intelligence Pipeline (Delegated to Python ML Microservice)
app.get('/api/intelligence', async (req, res) => {
  try {
    const mlResponse = await axios.get(
      `${ML_ENGINE_URL}/predict-demand`,
      { timeout: 10000 }
    );

    res.json(mlResponse.data);
  } catch (err) {
    console.error(
      'Failed to communicate with ML Microservice:',
      err.message
    );

    res.status(500).json({
      success: false,
      error: 'ML Analytics Engine Unavailable',
      details: err.message
    });
  }
});

// 2. GET: Strictly Read-Only Insights & Audit Log Feed
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

    const actionableInsights = rows.map((event) => {
      const ourPrice = parseFloat(event.our_price);
      const competitorPrice = parseFloat(event.competitor_price);

      if (isNaN(ourPrice) || isNaN(competitorPrice)) {
        return {
          eventId: event.id,
          sku: event.sku,
          productName: event.product_name,
          marketEvent: event.event_description,
          ourPrice: event.our_price,
          competitorPrice: event.competitor_price,
          detectedAt: event.detected_at,
          decisionEngineAction: 'Monitor market position.',
          autonomousProcedure:
            'Pending manual review or autonomous execution.'
        };
      }

      const priceDifference = ourPrice - competitorPrice;

      let businessAction = 'Monitor market position.';
      let recommendedProcedure =
        'Pending manual review or autonomous execution.';

      if (priceDifference > 0) {
        businessAction =
          `Competitor is undercutting by $${priceDifference.toFixed(2)}. ` +
          'ML Elasticity Model recommends an automated counter-measure.';

        recommendedProcedure =
          `Recommended Action: Price-matching rule (-$${priceDifference.toFixed(2)}) ` +
          'and promotion queued for execution.';
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
        autonomousProcedure: recommendedProcedure
      };
    });

    const logsRes = await query(`
      SELECT
        l.id,
        p.sku,
        p.name,
        l.action_type,
        l.description,
        l.status,
        l.executed_at
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
    console.error('Error fetching insights:', err.message);

    res.status(500).json({
      success: false,
      error: 'Server Error while fetching insights.'
    });
  }
});

// 3. POST: Explicit Endpoint to Trigger Autonomous Actions Safely (Idempotent)
app.post('/api/insights/execute-actions', async (req, res) => {
  try {
    const executedCount = await runDecisionEngine();

    res.json({
      success: true,
      message: `Successfully executed ${executedCount} autonomous actions.`
    });
  } catch (err) {
    console.error(
      'Error executing autonomous actions:',
      err.message
    );

    res.status(500).json({
      success: false,
      error: 'Failed to execute autonomous actions.'
    });
  }
});

// 4. POST: Live Event Ingestion / Simulator Endpoint with Strict Validation
app.post('/api/simulate-order', async (req, res) => {
  const { productId, quantity } = req.body;

  if (productId === undefined || quantity === undefined) {
    return res.status(400).json({
      success: false,
      error: 'productId and quantity are required.'
    });
  }

  if (!isValidPositiveInt(productId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid productId. Must be a positive integer.'
    });
  }

  if (!isValidPositiveInt(quantity)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid quantity. Must be a positive integer greater than 0.'
    });
  }

  const sanitizedProductId = parseInt(productId, 10);
  const sanitizedQuantity = parseInt(quantity, 10);

  const client = await getClient();

  try {
    await client.query('BEGIN');

    const prodRes = await client.query(
      'SELECT current_price FROM products WHERE id = $1',
      [sanitizedProductId]
    );

    if (prodRes.rows.length === 0) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        success: false,
        error: 'Product not found.'
      });
    }

    const price = parseFloat(prodRes.rows[0].current_price);

    if (isNaN(price) || price < 0) {
      await client.query('ROLLBACK');

      return res.status(422).json({
        success: false,
        error: 'Invalid product pricing stored in database.'
      });
    }

    const totalAmount = price * sanitizedQuantity;

    await client.query(
      `
        INSERT INTO orders
          (product_id, quantity, total_amount, order_date)
        VALUES
          ($1, $2, $3, NOW())
      `,
      [sanitizedProductId, sanitizedQuantity, totalAmount]
    );

    await client.query(
      `
        UPDATE inventory
        SET
          stock_quantity = GREATEST(0, stock_quantity - $1),
          updated_at = NOW()
        WHERE product_id = $2
      `,
      [sanitizedQuantity, sanitizedProductId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message:
        `Successfully ingested order event of ${sanitizedQuantity} units. ` +
        'ML forecasting pipeline adjusted.'
    });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error(
        'Order simulation rollback failed:',
        rollbackErr.message
      );
    }

    console.error(
      'Order simulation transaction failed:',
      err.message
    );

    res.status(500).json({
      success: false,
      error: 'Failed to process order simulation due to server error.'
    });
  } finally {
    client.release();
  }
});

// 5. GET: Raw Database Inspector Feed
app.get('/api/database-inspect', async (req, res) => {
  try {
    const products = await query(
      'SELECT * FROM products ORDER BY id ASC'
    );

    const inventory = await query(`
      SELECT
        i.*,
        p.sku,
        p.name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      ORDER BY i.id ASC
    `);

    const competitorEvents = await query(`
      SELECT
        ce.*,
        p.sku,
        p.name AS product_name,
        p.current_price AS our_price
      FROM competitor_events ce
      JOIN products p ON ce.product_id = p.id
      ORDER BY ce.id ASC
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
    console.error(
      'Database inspection query failed:',
      err.message
    );

    res.status(500).json({
      success: false,
      error: 'Failed to fetch database inspection data.'
    });
  }
});

// 6. POST: What-If Scenario Sandbox Simulation Engine with Strict Validation
app.post('/api/sandbox/simulate', async (req, res) => {
  const {
    productId,
    simulatedCompetitorPrice,
    demandMultiplier,
    stockOverride
  } = req.body;

  if (productId === undefined || productId === null) {
    return res.status(400).json({
      success: false,
      error: 'productId is required for simulation.'
    });
  }

  if (!isValidPositiveInt(productId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid productId. Must be a positive integer.'
    });
  }

  const sanitizedProductId = parseInt(productId, 10);

  const payload = {
    productId: sanitizedProductId
  };

  if (
    simulatedCompetitorPrice !== undefined &&
    simulatedCompetitorPrice !== null
  ) {
    if (!isValidNonNegativeNumber(simulatedCompetitorPrice)) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid simulatedCompetitorPrice. Must be a non-negative number.'
      });
    }

    payload.simCompetitorPrice = parseFloat(
      simulatedCompetitorPrice
    );
  }

  if (
    demandMultiplier !== undefined &&
    demandMultiplier !== null
  ) {
    if (!isValidNonNegativeNumber(demandMultiplier)) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid demandMultiplier. Must be a non-negative number.'
      });
    }

    payload.demandMultiplier = parseFloat(demandMultiplier);
  }

  if (
    stockOverride !== undefined &&
    stockOverride !== null
  ) {
    const stockNum = Number(stockOverride);

    if (!Number.isInteger(stockNum) || stockNum < 0) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid stockOverride. Must be a non-negative integer.'
      });
    }

    payload.stockOverride = stockNum;
  }

  try {
    const mlResponse = await axios.post(
      `${ML_ENGINE_URL}/simulate-sandbox`,
      payload,
      { timeout: 10000 }
    );

    res.json(mlResponse.data);
  } catch (err) {
    console.error(
      'Failed to communicate with ML Sandbox Microservice:',
      err.message
    );

    res.status(500).json({
      success: false,
      error: 'ML Analytics Engine Unavailable for Sandbox Simulation',
      details: err.message
    });
  }
});

app.listen(PORT, async () => {
  console.log(
    `Mercury Express Gateway running on port ${PORT}`
  );

  try {
    await runDecisionEngine();
  } catch (err) {
    console.error(
      'Failed to run startup decision engine:',
      err.message
    );
  }
});

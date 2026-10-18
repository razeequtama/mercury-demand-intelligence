import { query } from '../db.js';

/**
 * Evaluates market competitor undercuts and zero-stock inventory risks,
 * executing automated actions idempotently scoped to a visitor session.
 * @param {string} sessionId Visitor session identifier (defaults to 'baseline').
 * @returns {Promise<number>} Number of actions executed.
 */
export const runDecisionEngine = async (sessionId = 'baseline') => {
  let executedCount = 0;

  try {
    // 1. Evaluate Competitor Undercuts
    const eventQuery = `
      SELECT ce.id, p.id AS product_id, p.current_price AS our_price, ce.competitor_price
      FROM competitor_events ce
      JOIN products p ON ce.product_id = p.id;
    `;
    const { rows: competitorRows } = await query(eventQuery);

    for (const event of competitorRows) {
      const ourPrice = parseFloat(event.our_price);
      const competitorPrice = parseFloat(event.competitor_price);
      if (isNaN(ourPrice) || isNaN(competitorPrice)) continue;

      const priceDifference = ourPrice - competitorPrice;
      if (priceDifference > 0) {
        const description = `Autonomous Procedure EXECUTED: Dispatched price-matching rule (-$${priceDifference.toFixed(2)}) & queued targeted promotion campaign.`;

        const checkLog = await query(
          'SELECT id FROM automated_actions_log WHERE product_id = $1 AND description = $2 AND session_id = $3',
          [event.product_id, description, sessionId]
        );

        if (checkLog.rows.length === 0) {
          await query(
            `INSERT INTO automated_actions_log (product_id, action_type, description, status, session_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [event.product_id, 'PRICE_MATCH_AUTOMATION', description, 'EXECUTED', sessionId]
          );
          executedCount++;
        }
      }
    }

    // 2. Evaluate Critical Zero-Stock / Emergency Stockout Risks for this session
    const stockQuery = `
      SELECT i.product_id, i.stock_quantity, i.reorder_threshold, p.name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.stock_quantity <= 0 AND i.session_id = $1;
    `;
    const { rows: stockRows } = await query(stockQuery, [sessionId]);

    for (const stock of stockRows) {
      const description = `Autonomous Procedure EXECUTED: Dispatched emergency replenishment reorder for zero-stock SKU (${stock.name}).`;

      const checkLog = await query(
        'SELECT id FROM automated_actions_log WHERE product_id = $1 AND description = $2 AND session_id = $3',
        [stock.product_id, description, sessionId]
      );

      if (checkLog.rows.length === 0) {
        await query(
          `INSERT INTO automated_actions_log (product_id, action_type, description, status, session_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [stock.product_id, 'CRITICAL_STOCKOUT_EMERGENCY', description, 'EXECUTED', sessionId]
        );
        executedCount++;
      }
    }

    if (executedCount > 0) {
      console.log(`[Autonomous Engine] [Session: ${sessionId}] Executed ${executedCount} automated actions.`);
    }

    return executedCount;
  } catch (err) {
    console.error(`Failed to run decision engine for session ${sessionId}:`, err.message);
    throw err;
  }
};
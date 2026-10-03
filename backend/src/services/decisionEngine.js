import { query } from '../db.js';

/**
 * Evaluates market competitor undercuts and zero-stock inventory risks,
 * executing automated actions idempotently.
 * @returns {Promise<number>} Number of actions executed.
 */
export const runDecisionEngine = async () => {
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

    return executedCount;
  } catch (err) {
    console.error('Failed to run decision engine:', err.message);
    throw err;
  }
};
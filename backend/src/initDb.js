import { query } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Idempotent database initialization with session sandboxing support.
 * Creates required tables if they do not exist and populates initial demo data
 * ONLY when the products table is empty. Existing data is NEVER dropped or overwritten.
 */
export const initDatabase = async () => {
  try {
    // 1. Ensure all required tables and session columns exist non-destructively
    await query(`
      CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          sku VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100),
          current_price DECIMAL(10, 2) NOT NULL,
          cost_price DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS inventory (
          id SERIAL PRIMARY KEY,
          product_id INT REFERENCES products(id) ON DELETE CASCADE,
          warehouse_name VARCHAR(100) NOT NULL,
          stock_quantity INT NOT NULL DEFAULT 0,
          reorder_threshold INT NOT NULL DEFAULT 50,
          session_id VARCHAR(64) NOT NULL DEFAULT 'baseline',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          product_id INT REFERENCES products(id) ON DELETE CASCADE,
          quantity INT NOT NULL,
          total_amount DECIMAL(10, 2) NOT NULL,
          session_id VARCHAR(64) NOT NULL DEFAULT 'baseline',
          order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS competitor_events (
          id SERIAL PRIMARY KEY,
          product_id INT REFERENCES products(id) ON DELETE CASCADE,
          competitor_price DECIMAL(10, 2) NOT NULL,
          event_description TEXT,
          detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS automated_actions_log (
          id SERIAL PRIMARY KEY,
          product_id INT REFERENCES products(id) ON DELETE CASCADE,
          action_type VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'EXECUTED',
          session_id VARCHAR(64) NOT NULL DEFAULT 'baseline',
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Safe schema migration for existing databases: ensure session_id column exists
      ALTER TABLE inventory ADD COLUMN IF NOT EXISTS session_id VARCHAR(64) NOT NULL DEFAULT 'baseline';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_id VARCHAR(64) NOT NULL DEFAULT 'baseline';
      ALTER TABLE automated_actions_log ADD COLUMN IF NOT EXISTS session_id VARCHAR(64) NOT NULL DEFAULT 'baseline';

      CREATE INDEX IF NOT EXISTS idx_inventory_session ON inventory(session_id);
      CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id);
      CREATE INDEX IF NOT EXISTS idx_actions_session ON automated_actions_log(session_id);
    `);

    // 2. Check if baseline data already exists
    const countRes = await query('SELECT COUNT(*)::int AS count FROM products');
    const productCount = countRes.rows[0]?.count || 0;

    if (productCount > 0) {
      console.log(`[Database Init] Existing records found (${productCount} products). Skipping demo seeding to preserve data.`);
      return false;
    }

    console.log('[Database Init] Database is empty. Populating baseline demo dataset...');

    const productsRes = await query(`
      INSERT INTO products (sku, name, category, current_price, cost_price) VALUES
      ('MOU-WIR-01', 'Wireless Mouse X', 'Electronics', 49.99, 18.50),
      ('PRD-Y-02', 'Product Y (Smart Hub)', 'Smart Home', 129.99, 55.00),
      ('KEY-MEC-03', 'Mechanical Keyboard Z', 'Accessories', 89.99, 35.00),
      ('HUB-USC-04', 'USB-C Multiport Pro', 'Accessories', 39.99, 12.00),
      ('MAT-ERG-05', 'Ergonomic Desk Mat', 'Office', 24.99, 7.50)
      RETURNING id, sku;
    `);

    const productMap = {};
    productsRes.rows.forEach((p) => {
      productMap[p.sku] = p.id;
    });

    await query(`
      INSERT INTO inventory (product_id, warehouse_name, stock_quantity, reorder_threshold, session_id) VALUES
      ($1, 'Warehouse North (WH-A)', 182, 50, 'baseline'),
      ($2, 'Warehouse West (WH-B)', 45, 60, 'baseline'),
      ($3, 'Warehouse Central (WH-C)', 310, 100, 'baseline'),
      ($4, 'Warehouse North (WH-A)', 0, 40, 'baseline'),
      ($5, 'Warehouse West (WH-B)', 500, 150, 'baseline');
    `, [
      productMap['MOU-WIR-01'],
      productMap['PRD-Y-02'],
      productMap['KEY-MEC-03'],
      productMap['HUB-USC-04'],
      productMap['MAT-ERG-05']
    ]);

    await query(`
      INSERT INTO orders (product_id, quantity, total_amount, session_id, order_date) VALUES
      ($1, 32, 1599.68, 'baseline', NOW() - INTERVAL '1 day'),
      ($1, 28, 1399.72, 'baseline', NOW() - INTERVAL '2 days'),
      ($1, 35, 1749.65, 'baseline', NOW() - INTERVAL '3 days'),
      ($2, 3, 389.97, 'baseline', NOW() - INTERVAL '1 day'),
      ($3, 10, 899.90, 'baseline', NOW() - INTERVAL '2 days'),
      ($4, 8, 319.92, 'baseline', NOW() - INTERVAL '1 day')
    `, [
      productMap['MOU-WIR-01'],
      productMap['PRD-Y-02'],
      productMap['KEY-MEC-03'],
      productMap['HUB-USC-04']
    ]);

    await query(`
      INSERT INTO competitor_events (product_id, competitor_price, event_description) VALUES
      ($1, 99.99, 'Competitor slashed price by 23%. Demand for Product Y is rapidly dropping.'),
      ($2, 29.99, 'Flash sale by rival supplier on USB-C accessories. Market price undercut detected.');
    `, [
      productMap['PRD-Y-02'],
      productMap['HUB-USC-04']
    ]);

    console.log('[Database Init] Baseline demo dataset populated successfully.');
    return true;
  } catch (err) {
    console.error('[Database Init] Failed to initialize database:', err.message || err);
    throw err;
  }
};

// Allow running directly via `node src/initDb.js`
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('src/initDb.js')) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

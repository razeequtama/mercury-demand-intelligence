import { query } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('Starting destructive database reset & seeding with session-sandboxed schema...');

    await query(`
      DROP TABLE IF EXISTS automated_actions_log CASCADE;
      DROP TABLE IF EXISTS competitor_events CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS inventory CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
    `);

    await query(`
      CREATE TABLE products (
          id SERIAL PRIMARY KEY,
          sku VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100),
          current_price DECIMAL(10, 2) NOT NULL,
          cost_price DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE inventory (
          id SERIAL PRIMARY KEY,
          product_id INT REFERENCES products(id) ON DELETE CASCADE,
          warehouse_name VARCHAR(100) NOT NULL,
          stock_quantity INT NOT NULL DEFAULT 0,
          reorder_threshold INT NOT NULL DEFAULT 50,
          session_id VARCHAR(64) NOT NULL DEFAULT 'baseline',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          product_id INT REFERENCES products(id) ON DELETE CASCADE,
          quantity INT NOT NULL,
          total_amount DECIMAL(10, 2) NOT NULL,
          session_id VARCHAR(64) NOT NULL DEFAULT 'baseline',
          order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE competitor_events (
          id SERIAL PRIMARY KEY,
          product_id INT REFERENCES products(id) ON DELETE CASCADE,
          competitor_price DECIMAL(10, 2) NOT NULL,
          event_description TEXT,
          detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE automated_actions_log (
          id SERIAL PRIMARY KEY,
          product_id INT REFERENCES products(id) ON DELETE CASCADE,
          action_type VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'EXECUTED',
          session_id VARCHAR(64) NOT NULL DEFAULT 'baseline',
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_product_action_desc_session UNIQUE (product_id, description, session_id)
      );

      CREATE INDEX IF NOT EXISTS idx_inventory_session ON inventory(session_id);
      CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id);
      CREATE INDEX IF NOT EXISTS idx_actions_session ON automated_actions_log(session_id);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_action_log_product_desc_session ON automated_actions_log(product_id, description, session_id);
    `);

    // Grant permissions to least-privilege roles if they exist
    try {
      await query(`
        DO $$
        BEGIN
            IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mercury_app') THEN
                GRANT USAGE ON SCHEMA public TO mercury_app;
                GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mercury_app;
                GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO mercury_app;
            END IF;
            IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mercury_ml') THEN
                GRANT USAGE ON SCHEMA public TO mercury_ml;
                GRANT SELECT ON products, inventory, orders, competitor_events TO mercury_ml;
                REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM mercury_ml;
            END IF;
        END
        $$;
      `);
    } catch (_) {
      // Role creation or grants may fail if running as non-admin role; continue gracefully
    }

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
    productsRes.rows.forEach(p => {
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

    console.log('Database reset & seeded successfully with session-sandboxed schema, zero-stock edge case, and multi-competitor events!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err.message || err);
    process.exit(1);
  }
};

seedDatabase();
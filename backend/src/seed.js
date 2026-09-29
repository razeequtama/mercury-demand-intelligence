import { query } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding with high-velocity historical data...');

    await query(`
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
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          product_id INT REFERENCES products(id) ON DELETE CASCADE,
          quantity INT NOT NULL,
          total_amount DECIMAL(10, 2) NOT NULL,
          order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE competitor_events (
          id SERIAL PRIMARY KEY,
          product_id INT REFERENCES products(id) ON DELETE CASCADE,
          competitor_price DECIMAL(10, 2) NOT NULL,
          event_description TEXT,
          detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

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
      INSERT INTO inventory (product_id, warehouse_name, stock_quantity, reorder_threshold) VALUES
      ($1, 'Warehouse North (WH-A)', 182, 50),
      ($2, 'Warehouse West (WH-B)', 45, 60),
      ($3, 'Warehouse Central (WH-C)', 310, 100),
      ($4, 'Warehouse North (WH-A)', 12, 40),
      ($5, 'Warehouse West (WH-B)', 500, 150);
    `, [
      productMap['MOU-WIR-01'],
      productMap['PRD-Y-02'],
      productMap['KEY-MEC-03'],
      productMap['HUB-USC-04'],
      productMap['MAT-ERG-05']
    ]);

    // Inject heavy past orders for Wireless Mouse X to drive 7-day demand up (~30 units/day -> ~210 7-day forecast vs 182 stock = high risk!)
    await query(`
      INSERT INTO orders (product_id, quantity, total_amount, order_date) VALUES
      ($1, 32, 1599.68, NOW() - INTERVAL '1 day'),
      ($1, 28, 1399.72, NOW() - INTERVAL '2 days'),
      ($1, 35, 1749.65, NOW() - INTERVAL '3 days'),
      ($1, 30, 1499.70, NOW() - INTERVAL '4 days'),
      ($1, 29, 1449.71, NOW() - INTERVAL '5 days'),
      ($1, 31, 1549.69, NOW() - INTERVAL '6 days'),
      ($1, 33, 1649.67, NOW() - INTERVAL '7 days'),
      
      -- Light orders for others
      ($2, 3, 389.97, NOW() - INTERVAL '1 day'),
      ($3, 10, 899.90, NOW() - INTERVAL '2 days'),
      ($4, 8, 319.92, NOW() - INTERVAL '1 day')
    `, [
      productMap['MOU-WIR-01'],
      productMap['PRD-Y-02'],
      productMap['KEY-MEC-03'],
      productMap['HUB-USC-04']
    ]);

    await query(`
      INSERT INTO competitor_events (product_id, competitor_price, event_description) VALUES
      ($1, 99.99, 'Competitor slashed price by 23%. Demand for Product Y is rapidly dropping.');
    `, [productMap['PRD-Y-02']]);

    console.log('Database seeded with correct high-velocity orders!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err.message);
    process.exit(1);
  }
};

seedDatabase();
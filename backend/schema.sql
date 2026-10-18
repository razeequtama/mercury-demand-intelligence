-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    current_price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Warehouses / Inventory Levels (Session-Sandboxed)
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    warehouse_name VARCHAR(100) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    reorder_threshold INT NOT NULL DEFAULT 50,
    session_id VARCHAR(64) NOT NULL DEFAULT 'baseline',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historical Orders (Session-Sandboxed)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    session_id VARCHAR(64) NOT NULL DEFAULT 'baseline',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Competitor Intelligence & Market Events Feed
CREATE TABLE IF NOT EXISTS competitor_events (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    competitor_price DECIMAL(10, 2) NOT NULL,
    event_description TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Autonomous Actions Log (Session-Sandboxed)
CREATE TABLE IF NOT EXISTS automated_actions_log (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'EXECUTED',
    session_id VARCHAR(64) NOT NULL DEFAULT 'baseline',
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_session ON inventory(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_actions_session ON automated_actions_log(session_id);
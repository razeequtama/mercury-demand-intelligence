-- Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    current_price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Warehouses / Inventory Levels
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    warehouse_name VARCHAR(100) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    reorder_threshold INT NOT NULL DEFAULT 50,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historical Orders (for demand analysis)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Competitor Intelligence & Market Events
CREATE TABLE competitor_events (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    competitor_price DECIMAL(10, 2) NOT NULL,
    event_description TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Competitors Registry
CREATE TABLE competitors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    market_tier VARCHAR(50) DEFAULT 'Direct'
);

-- Competitor Pricing & Scraped Intelligence Feed
CREATE TABLE competitor_pricing (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    competitor_id INT REFERENCES competitors(id) ON DELETE CASCADE,
    competitor_price DECIMAL(10, 2) NOT NULL,
    price_difference_percentage DECIMAL(5, 2), -- e.g., -23.00%
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
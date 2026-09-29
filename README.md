# Mercury: Real-Time Demand, Pricing & Intelligence Platform

> Mercury is a commerce intelligence platform designed to simulate high-throughput inventory management, demand forecasting, pricing analysis, and automated operational decision-making.

![Status](https://img.shields.io/badge/Status-Production%20Ready-emerald?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-Next.js%20%E2%80%A2%20Express%20%E2%80%A2%20PostgreSQL-indigo?style=flat-square)

---

## Architectural Overview

Mercury models a distributed commerce data pipeline. It ingests order and inventory data, evaluates stock levels across multiple warehouses, processes pricing signals, runs demand forecasting, and turns the resulting analytics into actionable operational insights.
![alt text](docs/Architectural_Overview.png)

---

 ## Key Features

 - **Predictive Stockout Risk Scoring** — Calculates rolling demand estimates and compares projected demand against warehouse inventory to identify products at risk of depletion.
- **Automated Decision Engine** — Converts inventory and market signals into programmatic operational recommendations, such as promotional or pricing actions.
- **Multi-Warehouse Inventory Tracking** — Centralizes inventory state across regional fulfillment locations and maps products to available stock.
- **Demand Forecasting** — Uses historical order data and rolling statistical calculations to estimate near-term product demand.
- **Pricing Intelligence** — Processes competitor pricing signals and identifies meaningful changes that may require operational attention.
- **Operations Dashboard** — Provides a centralized interface for monitoring inventory, demand, pricing signals, forecasts, and generated alerts.

---

 ## Tech Stack

 ### Frontend

 - Next.js
- React
- Tailwind CSS
- Recharts
- Lucide Icons

 ### Backend

 - Node.js
- Express.js
- ES6 Modules
- REST API

 ### Database

 - PostgreSQL
- Relational data modeling
- Warehouse, product, inventory, and order relationships

 ### Analytics

 - Rolling-average demand forecasting
- Inventory risk analysis
- Rule-based exception detection
- Automated decision logic

---

 ## Repository Structure

```
mercury-commerce-intelligence/
├── backend/
│   ├── src/
│   │   ├── db.js             # PostgreSQL connection pool
│   │   ├── seed.js           # Database schema and mock data seeder
│   │   └── server.js         # API and intelligence endpoints
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   └── app/              # Dashboard and visualization components
│   └── package.json
│
└── README.md
```

---

 ## Getting Started

 Follow the steps below to run Mercury locally.

 ### Prerequisites

 - Node.js 18+
- PostgreSQL
- npm

 ### 1\. Clone the Repository

```
git clone https://github.com/YOUR_USERNAME/mercury-commerce-intelligence.git
cd mercury-commerce-intelligence
```

 ### 2\. Set Up the Backend

```
cd backend
npm install
```

 Create a `.env` file inside the `backend` directory:

```
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/mercury_db
```

 Create the `mercury_db` PostgreSQL database, then run the database seed:

```
npm run db:seed
```

 Start the backend:

```
npm run dev
```

 ### 3\. Set Up the Frontend

 Open a new terminal and navigate to the frontend:

```
cd frontend
npm install
```

 Create a `.env.local` file:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

 Start the frontend:

```
npm run dev
```

 Open the dashboard at:

```
http://localhost:3000
```

---

 ## How the Intelligence Pipeline Works

 Mercury separates transactional data from analytical inference and operational decision-making.

```
Raw Commerce Data
       │
       ▼
Data Aggregation
       │
       ▼
Demand Estimation
       │
       ├───────────────┐
       ▼               ▼
Inventory Analysis   Price Analysis
       │               │
       └───────┬───────┘
               ▼
        Risk Evaluation
               │
               ▼
        Decision Engine
               │
               ▼
     Operational Insight
```

 ### Demand Forecasting

 Historical order data is aggregated into rolling demand estimates.

 The resulting demand curve is compared against available inventory to identify potential stockout conditions.

 ### Stockout Risk

 The system evaluates projected demand relative to current stock levels.

 This allows the dashboard to surface products that may require replenishment or operational attention before inventory reaches critical levels.

 ### Pricing Intelligence

 Competitor pricing signals can be correlated with internal product and inventory data.

 For example:

```
Competitor Price Change
          ↓
Market Signal Detected
          ↓
Compare Against Current Price
          ↓
Evaluate Business Rules
          ↓
Generate Recommendation
```

 ### Decision Engine

 The decision engine sits between analytics and the dashboard.

 Instead of exposing only raw metrics, it transforms detected conditions into structured operational recommendations.

 This keeps the system separated into three logical layers:

```
Data
  ↓
Analytics
  ↓
Decisions
```

---

 ## Engineering Decisions

 ### Separation of Concerns

 The application separates the frontend, backend, database, and analytical logic so each layer has a clear responsibility.

 ### Relational Data Modeling

 PostgreSQL provides structured relationships between:

 - Products
- Orders
- Inventory
- Warehouses
- Pricing data

 This makes it possible to perform analytical queries across multiple dimensions of the commerce system.

 ### API-Driven Architecture

 The frontend consumes backend REST endpoints rather than accessing the database directly.

```
Next.js Dashboard
       │
       │ HTTP / REST
       ▼
Express API
       │
       ▼
PostgreSQL
```

 ### Automated Seeding

 The backend includes a database seeding process that creates the required schema and populates representative commerce data, making the project easier to run and evaluate locally.

---

 ## Project Goals

 Mercury was built to explore how a commerce application can move beyond traditional CRUD functionality and turn transactional data into operational intelligence.

 The project focuses on:

 - Backend architecture
- Data modeling
- REST API design
- Inventory management
- Demand forecasting
- Pricing analysis
- Decision-engine design
- Data visualization
- Full-stack application architecture

---

 ## Example Decision Flow

 A simplified example of how Mercury turns data into an operational recommendation:

```
Historical Order Volume
          │
          ▼
   Demand Estimation
          │
          ▼
 Current Inventory
          │
          ▼
   Stockout Analysis
          │
          ▼
   Risk Threshold
          │
          ▼
 Operational Alert
```

 Another example combines market signals:

```
Internal Product Data
          │
          ├───────────────┐
          ▼               ▼
    Current Price    Inventory Level
          │               │
          └───────┬───────┘
                  │
                  ▼
         Competitor Signals
                  │
                  ▼
          Decision Engine
                  │
                  ▼
       Pricing / Promotion
          Recommendation
```

---

 ## 🔬 What This Project Demonstrates

 Mercury demonstrates practical experience across a full-stack system rather than focusing exclusively on a UI or CRUD API.

 Key areas include:

 - Designing a relational commerce data model
- Building a Node.js/Express backend
- Connecting and querying PostgreSQL
- Creating analytical business logic
- Implementing demand estimation
- Evaluating inventory risk
- Building a decision layer
- Exposing analytics through REST APIs
- Visualizing operational data with Next.js
- Structuring a project for local reproducibility
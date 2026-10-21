# MERUCY: Real-Time Demand Intelligence

> **Full-stack demand forecasting, inventory risk scoring, and margin-aware pricing intelligence platform.**

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,react,nodejs,express,postgres,python,fastapi,sklearn,tailwind,docker" alt="Mercury Tech Stack Icons" />
</p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-20_LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
  <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-5.2-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" /></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" /></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://scikit-learn.org/"><img src="https://img.shields.io/badge/scikit--learn-1.5-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white" alt="Scikit-Learn" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="https://docs.docker.com/compose/"><img src="https://img.shields.io/badge/Docker-Compose_v2-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Compose" /></a>
</p>

Mercury is an end-to-end commerce intelligence command center that transforms raw transactional data, inventory levels, and competitor market shifts into auditable operational decisions. It couples a responsive Next.js 16 frontend, an Express 5 API gateway, a PostgreSQL 16 relational data store, and a Python FastAPI microservice powered by Scikit-Learn continuous linear regression.

Designed with enterprise-grade defensive architecture, Mercury features session-sandboxed multi-tenant isolation, atomic concurrency guards against race conditions, ACID-compliant order transactions, least-privilege database role separation, and dual-language internationalization (English & Indonesian).

---

## Table of Contents

- [Why Mercury](#why-mercury)
- [System Architecture](#system-architecture)
  - [Architecture Overview](#architecture-overview)
  - [Service Boundaries & Responsibilities](#service-boundaries--responsibilities)
  - [Core Request Lifecycles](#core-request-lifecycles)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Database Management & Mandatory Seeding Specification](#database-management--mandatory-seeding-specification)
  - [1. Seed Implementation & Entry Points](#1-seed-implementation--entry-points)
  - [2. Exact Seeding Commands](#2-exact-seeding-commands)
  - [3. Execution Order & Migrations](#3-execution-order--migrations)
  - [4. Environment & Service Prerequisites](#4-environment--service-prerequisites)
  - [5. Initial Baseline Dataset & Accounts](#5-initial-baseline-dataset--accounts)
  - [6. Repeatability & Idempotency](#6-repeatability--idempotency)
  - [7. Data Safety & Destructive Boundaries](#7-data-safety--destructive-boundaries)
  - [8. Environment Separation (Dev vs. Production)](#8-environment-separation-dev-vs-production)
  - [9. Data Persistence & Docker Volume Lifecycle](#9-data-persistence--docker-volume-lifecycle)
  - [10. Seed Verification Procedures](#10-seed-verification-procedures)
  - [Relational Schema Entities](#relational-schema-entities)
- [Run This Project Locally!](#run-this-project-locally)
  - [Prerequisites](#prerequisites)
  - [Option A: One-Command Docker Compose Setup (Recommended)](#option-a-one-command-docker-compose-setup-recommended)
  - [Option B: Local Native Development Setup](#option-b-local-native-development-setup)
- [Configuration Reference](#configuration-reference)
- [Usage Guide & API Reference](#usage-guide--api-reference)
  - [Primary User Workflow](#primary-user-workflow)
  - [Interactive Interface Modes](#interactive-interface-modes)
  - [Verified API Endpoints & Request Examples](#verified-api-endpoints--request-examples)
- [Security & Defensive Architecture](#security--defensive-architecture)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Docker Architecture & Deployment](#docker-architecture--deployment)
- [Project Directory Layout](#project-directory-layout)
- [Known Limitations & Roadmap](#known-limitations--roadmap)
- [Contributing & Development Conventions](#contributing--development-conventions)
- [License & Acknowledgments](#license--acknowledgments)

---

## Why Mercury

In modern omnichannel commerce, inventory planners and pricing analysts face a fragmented visibility problem:

1. **Disconnected Signals:** Inventory burn rates, supplier reorder thresholds, and aggressive competitor price undercuts are often stored across siloed databases and external feeds.
2. **Blind Price Wars:** Automated pricing engines frequently match rival discounts blindly, slashing prices below wholesale costs and destroying unit economics.
3. **Delayed Stockout Intervention:** Supply chain planners typically discover inventory depletion after a stockout occurs rather than preemptively routing purchase orders based on forecast velocity.

Mercury solves these challenges in a unified, inspectable platform:

- **Predicts 7-Day Demand:** Aggregates order history across calendar days with continuous date padding, fitting a linear regression regressor to estimate near-term product velocity.
- **Enforces Margin Safety Floors:** Evaluates whether price-matching rival discounts breaches a strict **15% gross-margin safety threshold** before recommending or authorizing promotions.
- **Automates Auditable Actions:** Dispatches idempotent price adjustments and zero-stock replenishment actions into an append-only relational audit log.
- **Isolates Visitor Simulations:** Provides a copy-on-write visitor session sandbox where multiple evaluators can simulate order surges, override inventory stock, and stress-test assumptions simultaneously without corrupting the baseline dataset.

---

## System Architecture

### Architecture Overview

Mercury follows a decoupled microservices architecture designed around clear domain boundaries, separation of concerns, and defensive network posture:

```mermaid
flowchart TD
    subgraph Client["Presentation Tier"]
        UI["Next.js 16 Web Application<br/>(React 19, Tailwind CSS 4, Recharts)<br/>Port :3000"]
    end

    subgraph Gateway["API Gateway Tier"]
        GW["Express 5 Gateway<br/>(Node.js 20 ES Modules)<br/>Port :5000"]
        Limiter["Rate Limiting Middleware<br/>(Global, ML, Mutation)"]
        SessionMgr["Session Sandboxing<br/>(Copy-on-Write)"]
        Cache["In-Memory TTL Cache<br/>(6-second Window)"]
        DecEngine["Autonomous Decision Engine<br/>(Atomic Upserts)"]
    end

    subgraph Inference["Forecasting Tier"]
        ML["FastAPI Inference Engine<br/>(Python 3.11, Scikit-Learn)<br/>Port :8000"]
        Regress["Daily Continuous Regressor<br/>(Calendar Padding + MAE)"]
        Elasticity["Economic Elasticity &<br/>Cross-Price Substitution Model"]
    end

    subgraph DataTier["Data Persistence Tier"]
        PG[("PostgreSQL 16 Database<br/>Port :5432")]
        RoleApp[("Role: mercury_app<br/>CRUD on Public Schema")]
        RoleML[("Role: mercury_ml<br/>Strictly Read-Only")]
    end

    UI -->|"HTTP / REST<br/>x-session-id token"| GW
    GW --> Limiter
    Limiter --> SessionMgr
    SessionMgr --> Cache
    SessionMgr --> DecEngine

    GW -->|"HTTP / JSON<br/>/predict-demand<br/>/simulate-sandbox"| ML
    ML --> Regress
    ML --> Elasticity

    GW -->|"SQL Transactions<br/>ACID Order Locking"| RoleApp
    RoleApp --> PG

    ML -->|"SQL Pooled Queries<br/>Read-Only Analytics"| RoleML
    RoleML --> PG
```

### Service Boundaries & Responsibilities

| Service | Technology Stack | Primary Responsibilities |
|---|---|---|
| **Frontend Application** | Next.js 16, React 19, Tailwind CSS 4, Recharts, Lucide Icons | Client-side reactive dashboard, What-If simulation levers, raw PostgreSQL inspector modal, visitor session persistence, and English/Indonesian i18n switching. |
| **Backend Gateway** | Node.js 20 (ESM), Express 5, `pg` (node-postgres), Helmet, `express-rate-limit` | Reverse proxy trust, CORS enforcement, visitor session token validation, ACID transactional order simulation, atomic decision rule evaluation, and error masking. |
| **Forecasting Engine** | Python 3.11, FastAPI, Uvicorn, pandas, NumPy, Scikit-Learn, `psycopg2-binary` | Continuous calendar date reindexing, linear regression demand prediction, in-sample MAE calculation, economic price-elasticity modeling, and cross-price substitution analysis. |
| **Relational Database** | PostgreSQL 16 (Alpine) | Stores catalog products, inventory levels, historical orders, competitor price events, and the immutable autonomous actions audit log. Enforces least-privilege role boundaries. |

### Core Request Lifecycles

#### 1. Demand Forecasting Pipeline (`GET /api/intelligence`)
1. The browser requests intelligence data from Express with an `x-session-id` header.
2. Express checks its in-memory TTL cache (`intelligenceCache`). If a valid entry exists for this session, it immediately returns the cached forecast.
3. On a cache miss, Express queries FastAPI's `/predict-demand` with the visitor's `session_id`.
4. FastAPI pulls catalog and order records using a pooled, read-only PostgreSQL connection (`mercury_ml` role).
5. FastAPI aggregates order quantities by calendar date, reindexes missing dates with zero demand over the date range, fits `LinearRegression`, clips negative projections to zero, sums 7-day estimates, and computes in-sample Mean Absolute Error (MAE).
6. FastAPI returns the projections, stockout depletion timelines, and reorder recommendations to Express, which caches and relays them to the client.

#### 2. What-If Scenario Simulation (`POST /api/sandbox/simulate`)
1. The user adjusts scenario levers (competitor price, demand surge multiplier, or inventory stock override) in the sandbox UI.
2. The browser dispatches a debounced (250ms) payload to Express.
3. Express validates input parameters (ensuring non-negative numbers and valid integers) and forwards the request to FastAPI's `/simulate-sandbox`.
4. FastAPI evaluates price elasticity:
   - **Safe Undercut (Gross Margin $\ge$ 15%):** Authorizes a price-match recommendation; own-price elasticity stimulates demand.
   - **Dangerous Undercut (Gross Margin < 15%):** Triggers a margin guardrail alert; advises holding price and recommends product bundling. Cross-price substitution dampens demand as buyers migrate to the competitor.
5. FastAPI calculates the updated weekly burn rate and returns simulation projections without mutating stored database records.

#### 3. ACID Transactional Order Ingestion (`POST /api/simulate-order`)
1. The user inputs an order quantity in the Live Order Simulator.
2. Express verifies that an active visitor session header is present (rejecting unauthenticated requests or direct attempts to mutate the baseline dataset).
3. Express begins a PostgreSQL transaction (`BEGIN`) using a dedicated pool client.
4. It verifies or clones the baseline inventory for this visitor (`ensureSessionInventory`).
5. It acquires an exclusive row lock on the product's inventory row (`SELECT stock_quantity FROM inventory ... FOR UPDATE`).
6. It validates that requested quantity $\le$ available stock and $\le 1000$ units.
7. It inserts the order record into `orders` and subtracts the exact quantity from `inventory`.
8. It commits the transaction (`COMMIT`), releases the client, and invalidates the session's forecast cache.

---

## Key Features

- **Continuous 7-Day Demand Forecasting:** Aggregates orders into daily time-series buckets. Missing calendar dates are padded with 0 demand before model fitting, ensuring linear regression models learn genuine velocity rather than skipping inactive trading days.
- **In-Sample MAE & Depletion Horizons:** Computes in-sample Mean Absolute Error (MAE) and translates projected 7-day demand into an actionable burn rate (days until stockout).
- **Margin-Aware Pricing Guardrails:** Automatically checks whether a competitor price undercut leaves at least a **15% gross profit margin** ($(\text{Price} - \text{Cost}) / \text{Price} \ge 0.15$). Prevents automated value destruction.
- **Economic Elasticity & Substitution Modeling:** The sandbox models own-price elasticity (surges demand when price cuts are matched) and cross-price substitution (drops demand when rival discounts are not matched).
- **TOCTOU Race Condition Prevention:** The autonomous decision engine writes actions using atomic PostgreSQL upserts (`INSERT INTO ... ON CONFLICT DO NOTHING`), eliminating time-of-check to time-of-use race conditions under concurrent triggers.
- **Row-Locked ACID Transactions:** Simulated order ingestion uses `SELECT ... FOR UPDATE` row locks to prevent negative inventory depletion and demand poisoning.
- **Multi-Tenant Visitor Sandboxing:** Generates unique client UUIDs (`x-session-id`). State modifications clone baseline inventory on demand, allowing concurrent visitors to explore and test the platform without shared data contamination.
- **Dual-Language Internationalization (i18n):** Native support for English (`en`) and Indonesian (`id`) using a lightweight React context and persistent first-party cookie.
- **Raw PostgreSQL Database Inspector:** Built-in modal displaying actual relational tables (`products`, `inventory`, `competitor_events`, `orders`, and `automated_actions_log`) with proprietary wholesale cost figures safely redacted.
- **Enterprise Defensive Controls:** Reverse proxy trust configuration (`trust proxy 1`), session-aware rate limiters (Global: 150 req/min, ML: 60 req/min, Mutations: 30 req/min), Helmet security headers, strict CORS origin whitelisting, and internal infrastructure error masking.

---

## Technology Stack

| Layer | Technology & Stack Badge | Version / Spec | Project Role & Implementation Rationale |
|---|---|---|---|
| **Frontend Framework** | [![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/) | `16.4.2` | React Server Components, standalone output build for lean Docker containers, and client-side view management. |
| **UI Library** | [![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/) | `19.2.8` | Component rendering, state synchronization via `useSyncExternalStore`, and optimized memoized hooks. |
| **Styling Engine** | [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/) | `4.x` | Modern utility-first styling with dual-mode warm dark/light palettes and responsive layouts. |
| **Data Visualization** | [![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=flat-square&logo=chartdotjs&logoColor=white)](https://recharts.org/) | `3.10.1` | Responsive SVG bar charts comparing current stock against 7-day predicted demand. |
| **Backend Runtime** | [![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/) | `20.x LTS` | Native ES Modules runtime powering the API gateway and transactional orchestration. |
| **API Framework** | [![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/) | `5.2.1` | REST gateway handling routing, reverse proxy headers, security policies, and error boundaries. |
| **Database Client** | [![PostgreSQL](https://img.shields.io/badge/node--postgres-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://node-postgres.com/) | `8.23.0` | Connection pooling, parameterized queries, and ACID transaction control (`BEGIN` / `FOR UPDATE` / `COMMIT`). |
| **Security Headers** | [![Helmet](https://img.shields.io/badge/Helmet-FFDA44?style=flat-square&logo=helmet&logoColor=black)](https://helmetjs.github.io/) | `8.3.0` | Sets HTTP security headers (`Cross-Origin-Resource-Policy`, frameguards, and MIME sniffing protection). |
| **Rate Limiter** | [![Express Rate Limit](https://img.shields.io/badge/Rate_Limiter-gray?style=flat-square)](https://github.com/express-rate-limit/express-rate-limit) | `8.7.1` | Session-aware and IP-normalized rate limiting preventing ML inference exhaustion and mutation flooding. |
| **ML Framework** | [![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/) | `0.110.0` | High-performance Python async web framework serving analytical endpoints with automatic OpenAPI validation. |
| **ML Server** | [![Uvicorn](https://img.shields.io/badge/Uvicorn-499848?style=flat-square&logo=gunicorn&logoColor=white)](https://www.uvicorn.org/) | `0.28.0` | Lightweight ASGI web server worker for Python services. |
| **Data Analytics** | [![pandas](https://img.shields.io/badge/pandas-150458?style=flat-square&logo=pandas&logoColor=white)](https://pandas.pydata.org/) & [![NumPy](https://img.shields.io/badge/NumPy-013243?style=flat-square&logo=numpy&logoColor=white)](https://numpy.org/) | `2.2.3` / `1.26.4` | Dataframe manipulation, time-series aggregation, and matrix transformations. |
| **Predictive Modeling** | [![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=flat-square&logo=scikitlearn&logoColor=white)](https://scikit-learn.org/) | `1.5.0` | `LinearRegression` fitting on calendar-padded order sequences and `mean_absolute_error` evaluation. |
| **Python DB Driver** | [![psycopg2](https://img.shields.io/badge/psycopg2-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.psycopg.org/) | `2.9.10` | Threaded connection pool manager (`ThreadedConnectionPool`) providing pooled SQL access for analytics. |
| **Relational Database** | [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/) | `16-alpine` | Persistent relational store supporting foreign keys, cascading deletes, index constraints, and row-level locks. |
| **Container Engine** | [![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docs.docker.com/compose/) | Compose v2 | Multi-stage image builds, healthchecks, loopback-restricted port bindings, and volume management. |

---

## Database Management & Mandatory Seeding Specification

Mercury relies on a relational database populated with synthetic commerce data to demonstrate demand forecasting, stockout warnings, and price-matching rules. The seeding implementation has been audited to guarantee safety, idempotency, and reproducibility.

### 1. Seed Implementation & Entry Points

The repository provides two distinct database seeding entry points:

1. **Non-Destructive Initialization (`backend/src/initDb.js`):**
   - **Entry point:** Executed via `npm run db:init` or `npm run db:seed`.
   - **Automatic execution:** Also invoked automatically upon Express gateway startup (`server.js`) when `isMainModule` runs.
   - **Logic:** Non-destructively creates tables and session indexes (`IF NOT EXISTS`). Checks `SELECT COUNT(*)::int AS count FROM products`. If records already exist, it **aborts without modifying data**. If the table is empty, it inserts baseline demo records.
2. **Destructive Hard Reset (`backend/src/seed.js`):**
   - **Entry point:** Executed via `npm run db:reset`.
   - **Logic:** Executes `DROP TABLE IF EXISTS ... CASCADE` on all application tables, recreates schema definitions from scratch, and repopulates the baseline dataset.
3. **Docker Initdb Container Hooks (`docker-compose.yml`):**
   - `./backend/schema.sql` mounted to `/docker-entrypoint-initdb.d/01-schema.sql:ro` (provisions tables on fresh volume creation).
   - `./backend/roles.sh` mounted to `/docker-entrypoint-initdb.d/02-roles.sh:ro` (dynamically provisions least-privilege roles using environment variables).

### 2. Exact Seeding Commands

Always execute commands from the appropriate directory:

| Intent | Repository Root Command | Backend Directory Command |
|---|---|---|
| **Safe Baseline Initialization (Idempotent)** | `npm run db:init` *(or `npm run db:seed`)* | `npm run db:init` *(or `npm run db:seed`)* |
| **Hard Destructive Reset (Drops All Tables)** | `npm run db:reset` | `npm run db:reset` |

> [!NOTE]
> The root `package.json` delegates directly to the backend workspace via `npm --prefix backend run <script>`. Never assume ad-hoc commands like `npm run seed` exist.

### 3. Execution Order & Migrations

- **Do migrations need to run before seeding?** **No.** Both `initDb.js` and `seed.js` are self-contained. They bundle complete DDL statements (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, and indexing). There are no external migration tools (such as Prisma, Knex, or Flyway) required.
- **Must the application be running?** **No.** Seeding can be performed offline as long as the PostgreSQL database is reachable. When starting Express normally (`npm run dev:backend`), the server runs `initDatabase()` on boot, meaning manual seeding is often completely optional on fresh installs.

### 4. Environment & Service Prerequisites

Before running the seed commands, ensure:
1. PostgreSQL 16+ is running and accepting TCP connections.
2. The target database (default: `mercury_db`) exists.
3. `DATABASE_URL` is configured in `backend/.env` (or via root `.env`):
   ```text
   DATABASE_URL=postgresql://mercury_app:mercury_app_secret@localhost:5432/mercury_db
   ```
4. Dependencies are installed (`npm install` inside `backend`).

### 5. Initial Baseline Dataset & Accounts

The seeding process creates synthetic commerce records designed to exercise edge cases in forecasting and decision rules:

- **5 Catalog Products:**
  - `MOU-WIR-01` — Wireless Mouse X (Electronics, Price: $49.99, Cost: $18.50)
  - `PRD-Y-02` — Product Y Smart Hub (Smart Home, Price: $129.99, Cost: $55.00)
  - `KEY-MEC-03` — Mechanical Keyboard Z (Accessories, Price: $89.99, Cost: $35.00)
  - `HUB-USC-04` — USB-C Multiport Pro (Accessories, Price: $39.99, Cost: $12.00)
  - `MAT-ERG-05` — Ergonomic Desk Mat (Office, Price: $24.99, Cost: $7.50)
- **5 Warehouse Inventory Rows (`session_id = 'baseline'`):**
  - Includes a healthy stock item (`MAT-ERG-05`, 500 units), a low-stock SKU (`PRD-Y-02`, 45 units vs threshold 60), and a deliberate **zero-stock edge case** (`HUB-USC-04`, 0 units vs threshold 40) to test emergency replenishment paths.
- **6 Historical Demand Orders (`session_id = 'baseline'`):**
  - Orders distributed over prior days (`NOW() - INTERVAL '1 day'`, etc.) providing daily velocity observations for model training.
- **2 Competitor Pricing Events:**
  - Undercuts for `PRD-Y-02` ($99.99 vs our $129.99) and `HUB-USC-04` ($29.99 vs our $39.99) to activate decision-engine alerts.
- **Automated Actions Log:**
  - Initialized empty; populated automatically when the gateway's decision engine runs its first evaluation.
- **Demo Credentials:**
  - Mercury does not maintain user account tables (visitor access uses session sandboxing). Database connection roles created for services are `mercury_app` (`mercury_app_secret`) and `mercury_ml` (`mercury_ml_secret`). No production secrets are exposed.

### 6. Repeatability & Idempotency

- `npm run db:init` / `npm run db:seed` is **100% idempotent**. Running it repeatedly produces:
  ```text
  [Database Init] Existing records found (5 products). Skipping demo seeding to preserve data.
  ```
  It will never create duplicate products, duplicate orders, or conflict with existing rows.
- `npm run db:reset` is explicitly repeatable by design because it recreates tables before repopulating.

### 7. Data Safety & Destructive Boundaries

> [!CAUTION]
> **Data Destruction Warning:**
> - `npm run db:init` and `npm run db:seed` are **non-destructive** and safe to run in any existing development environment.
> - `npm run db:reset` is **destructive**. It issues `DROP TABLE IF EXISTS ... CASCADE` and will permanently erase all custom visitor sessions, simulated orders, and recorded audit logs. Never run `db:reset` in a shared or staging database.

### 8. Environment Separation (Dev vs. Production)

- **Development / Demo:** Relies on the synthetic baseline dataset with tagged `session_id = 'baseline'`. Modifying data via the UI or API clones inventory into isolated visitor sessions, keeping the shared demo pristine.
- **Production:** Production deployments must use `backend/schema.sql` and `backend/roles.sql` (or `roles.sh`) executed by a database administrator. The automatic seeding in `initDb.js` verifies product counts; if production tables contain live inventory records, seeding will permanently disengage.

### 9. Data Persistence & Docker Volume Lifecycle

- When running under Docker Compose, database records reside in the named volume `mercury_pgdata` mounted to `/var/lib/postgresql/data`.
- **Survives Container Lifecycle:** Seeded data persists across `docker compose stop`, `docker compose down`, and container rebuilds (`docker compose up --build`).
- **Data Erasure:** Data is only deleted if Docker volumes are explicitly cleared with `docker compose down -v` or `docker volume rm mercury-demand-intelligence_mercury_pgdata`.

### 10. Seed Verification Procedures

A developer can verify successful database seeding through three independent methods:

1. **Via Gateway Health & Database Inspector API:**
   ```bash
   curl -s http://localhost:5000/api/health
   # Expected: {"status":"healthy",...,"database":{"status":"connected"}}

   curl -s -H "x-session-id: verification-check" http://localhost:5000/api/database-inspect | grep -o '"sku":"MOU-WIR-01"'
   # Expected: "sku":"MOU-WIR-01"
   ```
2. **Via Automated Test Suite:**
   ```bash
   npm run test:backend
   # Runs 26 integration tests verifying seeded tables, transactions, and session cloning.
   ```
3. **Via PostgreSQL CLI (`psql`):**
   ```sql
   SELECT sku, name, current_price FROM products ORDER BY id;
   -- Expected: 5 rows (MOU-WIR-01 through MAT-ERG-05)
   ```

### Relational Schema Entities

```text
┌─────────────────────────┐         ┌─────────────────────────────────┐
│        products         │1       *│            inventory            │
├─────────────────────────┼─────────┼─────────────────────────────────┤
│ id (PK, SERIAL)         │         │ id (PK, SERIAL)                 │
│ sku (VARCHAR, UNIQUE)   │         │ product_id (FK -> products.id)  │
│ name (VARCHAR)          │         │ warehouse_name (VARCHAR)        │
│ category (VARCHAR)      │         │ stock_quantity (INT)            │
│ current_price (DECIMAL) │         │ reorder_threshold (INT)         │
│ cost_price (DECIMAL)    │         │ session_id (VARCHAR, DEFAULT)   │
│ created_at (TIMESTAMP)  │         │ updated_at (TIMESTAMP)          │
└────────────┬────────────┘         └─────────────────────────────────┘
             │1
             │                      ┌─────────────────────────────────┐
             ├─────────────────────*│             orders              │
             │                      ├─────────────────────────────────┤
             │                      │ id (PK, SERIAL)                 │
             │                      │ product_id (FK -> products.id)  │
             │                      │ quantity (INT)                  │
             │                      │ total_amount (DECIMAL)          │
             │                      │ session_id (VARCHAR, DEFAULT)   │
             │                      │ order_date (TIMESTAMP)          │
             │                      └─────────────────────────────────┘
             │1
             │                      ┌─────────────────────────────────┐
             ├─────────────────────*│        competitor_events        │
             │                      ├─────────────────────────────────┤
             │                      │ id (PK, SERIAL)                 │
             │                      │ product_id (FK -> products.id)  │
             │                      │ competitor_price (DECIMAL)      │
             │                      │ event_description (TEXT)        │
             │                      │ detected_at (TIMESTAMP)         │
             │                      └─────────────────────────────────┘
             │1
             │                      ┌─────────────────────────────────┐
             └─────────────────────*│      automated_actions_log      │
                                    ├─────────────────────────────────┤
                                    │ id (PK, SERIAL)                 │
                                    │ product_id (FK -> products.id)  │
                                    │ action_type (VARCHAR)           │
                                    │ description (TEXT)              │
                                    │ status (VARCHAR)                │
                                    │ session_id (VARCHAR, DEFAULT)   │
                                    │ executed_at (TIMESTAMP)         │
                                    │ UNIQUE(prod_id, desc, sess_id)  │
                                    └─────────────────────────────────┘
```

---

## Run This Project Locally!

### Prerequisites

| Tool | Supported Version | Notes |
|---|---|---|
| **Docker Engine & Docker Compose** | Docker v24+ / Compose v2+ | **Required for Option A.** Eliminates local language runtime requirements. |
| **Node.js** | `v20.9.0` or higher (Node 20 LTS recommended) | Required for Option B. Next.js 16 requires Node $\ge 20.9.0$. |
| **Python** | `3.10` or `3.11` | Required for Option B. |
| **PostgreSQL** | `15` or `16` | Required for Option B (standard port `5432` or custom). |
| **Git** | Any modern version | For cloning the repository. |

---

### Option A: One-Command Docker Compose Setup (Recommended)

Docker Compose provides a reproducible environment, orchestrating PostgreSQL with healthchecks, least-privilege role initialization, the FastAPI ML engine, the Express gateway, and the Next.js standalone container.

#### 1. Clone Repository & Setup Environment

```bash
git clone https://github.com/razeequtama/mercury-demand-intelligence.git
cd mercury-demand-intelligence
cp .env.example .env
```

#### 2. Start Services

To launch in local development mode (automatically mounting `./frontend` with Next.js Fast Refresh and polling via `docker-compose.override.yml`):

```bash
docker compose up --build
```

*(Alternatively, run in the background with `docker compose up -d`).*

For production container testing (using the Next.js standalone runner stage without source mounts):

```bash
docker compose -f docker-compose.yml up --build -d
```

#### 3. Access the Application

- **Web Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Express Gateway Health:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **FastAPI Health:** [http://localhost:8000/health](http://localhost:8000/health)

#### 4. Stopping the Stack

```bash
# Stop containers while preserving database volume
docker compose down

# Stop containers and erase persistent database volume
docker compose down -v
```

---

### Option B: Local Native Development Setup

If running directly on your host machine without Docker:

#### 1. Clone Repository & Configure Database

```bash
git clone https://github.com/razeequtama/mercury-demand-intelligence.git
cd mercury-demand-intelligence
```

Create an empty database named `mercury_db` in your local PostgreSQL instance:

```bash
# Example via psql CLI
psql -U postgres -h localhost -c "CREATE DATABASE mercury_db;"
```

#### 2. Configure Environment Files

Create the required configuration files based on the `.env.example` templates:

**Backend Configuration (`backend/.env`):**
```dotenv
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/mercury_db
ML_ENGINE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

**ML Engine Configuration (`ml-engine/.env`):**
```dotenv
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/mercury_db
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Frontend Configuration (`frontend/.env.local`):**
```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

#### 3. Initialize & Seed Database

```bash
cd backend
npm install
npm run db:init
cd ..
```

#### 4. Install Dependencies & Launch Services

You can start each service in separate terminal windows, or run the unified concurrent launcher:

**Terminal 1 — Backend Gateway:**
```bash
cd backend
npm run dev
# Express starts on port 5000
```

**Terminal 2 — Python Forecasting Engine:**
```bash
cd ml-engine
python -m venv .venv

# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 3 — Next.js Frontend:**
```bash
cd frontend
npm install
npm run dev
# Next.js starts on port 3000
```

**All-in-One Shortcut (from root):**
```bash
npm install
npm run dev
# Uses concurrently to launch Gateway, Frontend, and ML Engine simultaneously
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Configuration Reference

Mercury uses environment variables to configure ports, credentials, and inter-service communication. All variables are verified in the codebase:

| Variable | Target Service | Purpose | Required? | Default / Example Value |
|---|---|---|---|---|
| `DATABASE_URL` | `backend`, `ml-engine` | PostgreSQL connection string with credentials, host, port, and database. | **Yes** | `postgresql://mercury_app:mercury_app_secret@localhost:5432/mercury_db` |
| `POSTGRES_USER` | `postgres` (Docker) | Superuser username for container initialization. | Optional | `postgres` |
| `POSTGRES_PASSWORD` | `postgres` (Docker) | Superuser password for container initialization. | Optional | `your_secure_password_here` |
| `POSTGRES_DB` | `postgres` (Docker) | Database name created on container startup. | Optional | `mercury_db` |
| `POSTGRES_PORT` | `postgres` (Docker) | Host port mapped to PostgreSQL. | Optional | `5432` |
| `APP_DB_USER` | `postgres` (Docker) | Least-privilege application role username (SEC-12). | Optional | `mercury_app` |
| `APP_DB_PASSWORD` | `postgres` (Docker) | Least-privilege application role password. | Optional | `mercury_app_secret` |
| `ML_DB_USER` | `postgres` (Docker) | Least-privilege read-only ML role username (SEC-12). | Optional | `mercury_ml` |
| `ML_DB_PASSWORD` | `postgres` (Docker) | Least-privilege read-only ML role password. | Optional | `mercury_ml_secret` |
| `PORT` | `backend` | Port on which the Express gateway listens. | Optional | `5000` |
| `ML_PORT` | `ml-engine` | Port on which FastAPI / Uvicorn listens. | Optional | `8000` |
| `ML_ENGINE_URL` | `backend` | Internal URL used by Express to communicate with FastAPI. | Optional | `http://localhost:8000` *(Docker: `http://ml-engine:8000`)* |
| `FRONTEND_URL` | `backend` | Allowed frontend origin for CORS policies. | Optional | `http://localhost:3000` |
| `ALLOWED_ORIGINS` | `backend`, `ml-engine` | Comma-separated list of allowed browser origins for CORS. | Optional | `http://localhost:3000,http://127.0.0.1:3000` |
| `NEXT_PUBLIC_API_URL` | `frontend` | Public API gateway base URL consumed by the React browser client. | Optional | `http://localhost:5000/api` |

---

## Usage Guide & API Reference

### Primary User Workflow

1. **Review High-Risk Inventory:** Access the dashboard to view products where predicted 7-day demand exceeds available stock (risk ratio $> 70\%$). Review the AI-generated reorder quantity recommendation.
2. **Ingest a Real-Time Order:** Navigate to the **Transactional Order Ingestion Simulator** card. Select a product, choose a quantity (e.g., 10 units), and click **Simulate Ingestion**. Observe the row-locked transaction decrement inventory in real time and refresh the demand prediction.
3. **Execute Autonomous Actions:** View the **Active Market Alerts** card. When competitor undercuts are detected, click **Execute Rules**. The decision engine evaluates policies, inserts action items, and records them in the **Autonomous Decision Engine Audit Log**.
4. **Stress-Test in the What-If Sandbox:** Switch to the **What-If Sandbox** tab. Select an SKU and adjust the scenario levers:
   - Move the **Simulated Competitor Price** slider below our price. Observe whether the margin floor is breached.
   - Adjust the **Demand Surge Multiplier** from `1.0x` to `2.5x` to simulate viral demand spikes.
   - Override the **Inventory Buffer** to `0` or `10` units to inspect emergency stockout alerts.
5. **Inspect the Raw Database:** Click **Inspect DB** in the navigation header. Browse the live database tables (`products`, `inventory`, `competitorEvents`, `orders`, `automatedActionsLog`) to audit database state. Notice that proprietary wholesale cost prices remain redacted.
6. **Reset Visitor Sandbox:** Click **Reset Sandbox** in the header or inspector modal to purge visitor-specific mutations and restore the baseline demo environment.

---

### Interactive Interface Modes

Mercury features visual modes and language support:

- **Dual-Mode Theme Engine:** Seamlessly toggle between dark and light themes using the sun/moon icon in the header. The theme preference synchronizes via `useSyncExternalStore` across tabs and persists in local storage.
- **English & Indonesian i18n:** Switch between English (`en`) and Indonesian (`id`) with zero bundle overhead. Translations cover the entire dashboard, scenario controls, welcome tour, error boundaries, and database inspector labels.

---

### Verified API Endpoints & Request Examples

#### 1. System Health Check
`GET /api/health` — Verifies database connection pool latency and uptime.

```bash
curl -X GET http://localhost:5000/api/health
```

*Response (200 OK):*
```json
{
  "status": "healthy",
  "timestamp": "2026-10-19T05:04:30.123Z",
  "uptime": 42.85,
  "database": {
    "status": "connected",
    "latencyMs": 3
  }
}
```

#### 2. Get Intelligence Predictions
`GET /api/intelligence` — Fetches cached or fresh ML demand predictions for the active visitor session.

```bash
curl -X GET http://localhost:5000/api/intelligence \
  -H "x-session-id: b913ddfa-a893-43f7-97b2-0123bb66f88c"
```

*Response (200 OK):*
```json
{
  "success": true,
  "engine": "Python FastAPI + Scikit-Learn Daily-Continuous Regressor (Connection-Pooled)",
  "totalTrackedProducts": 5,
  "data": [
    {
      "id": 1,
      "sku": "MOU-WIR-01",
      "name": "Wireless Mouse X",
      "category": "Electronics",
      "currentPrice": 49.99,
      "warehouse": "Warehouse North (WH-A)",
      "currentInventory": 182,
      "forecast7Day": 218,
      "daysUntilStockout": 5.8,
      "modelMAE": 1.25,
      "stockoutProbability": "100%",
      "recommendation": "ML Recommended reorder: 86 units",
      "statusAlert": "High Stockout Risk"
    }
  ]
}
```

#### 3. Transactional Order Simulation
`POST /api/simulate-order` — Ingests a new order in an ACID transaction with row-level locking.

```bash
curl -X POST http://localhost:5000/api/simulate-order \
  -H "Content-Type: application/json" \
  -H "x-session-id: b913ddfa-a893-43f7-97b2-0123bb66f88c" \
  -d '{"productId": 1, "quantity": 5}'
```

*Response (200 OK):*
```json
{
  "success": true,
  "sessionId": "b913ddfa-a893-43f7-97b2-0123bb66f88c",
  "message": "Successfully ingested order event of 5 units. ML forecasting pipeline adjusted for your visitor sandbox."
}
```

#### 4. What-If Scenario Simulation
`POST /api/sandbox/simulate` — Simulates price elasticity and margin projections without mutating data.

```bash
curl -X POST http://localhost:5000/api/sandbox/simulate \
  -H "Content-Type: application/json" \
  -H "x-session-id: b913ddfa-a893-43f7-97b2-0123bb66f88c" \
  -d '{
    "productId": 2,
    "simulatedCompetitorPrice": 99.99,
    "demandMultiplier": 1.5,
    "stockOverride": 45
  }'
```

*Response (200 OK):*
```json
{
  "success": true,
  "engine": "Python FastAPI + Scikit-Learn Sandbox Predictor",
  "simulation": {
    "sku": "PRD-Y-02",
    "productName": "Product Y (Smart Hub)",
    "baselineStock": 45,
    "simulatedDemand": 74,
    "daysUntilStockout": 4.3,
    "stockoutRiskScore": "High Stockout Risk (85%)",
    "baseOurPrice": 129.99,
    "simulatedOurPrice": 99.99,
    "simulatedCompetitorPrice": 99.99,
    "projectedMarginPercent": 45.0,
    "actionSeverity": "CRITICAL_STOCKOUT",
    "engineRecommendation": "AUTONOMOUS MATCH — Competitor undercuts by $30.00. Safe margin preserved (45.0%). Price-match rule execution authorized. EMERGENCY: Stock depletion projected in 4.3 days. Automated warehouse reorder triggered."
  }
}
```

#### 5. Reset Visitor Sandbox
`POST /api/session/reset` — Purges visitor mutations and invalidates cached inferences.

```bash
curl -X POST http://localhost:5000/api/session/reset \
  -H "x-session-id: b913ddfa-a893-43f7-97b2-0123bb66f88c"
```

*Response (200 OK):*
```json
{
  "success": true,
  "message": "Visitor sandbox session successfully reset to baseline."
}
```

---

## Security & Defensive Architecture

Mercury implements defense-in-depth engineering practices to protect application stability, prevent data poisoning, and restrict administrative access:

1. **Least-Privilege Database Roles (SEC-12):**
   - **`mercury_app` Role:** Used exclusively by the Express gateway. Granted CRUD permissions on tables and sequence usage. Denied superuser rights and arbitrary schema alteration.
   - **`mercury_ml` Role:** Used exclusively by the Python ML service. Enforces **strict read-only access** (`SELECT` on `products`, `inventory`, `orders`, and `competitor_events`). Mutations (`INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`) are explicitly revoked, preventing the analytics service from modifying transactional state.
2. **Reverse Proxy Trust & IP Normalization:**
   - Express sets `app.set('trust proxy', 1)`, allowing deployment behind load balancers (AWS ALB, Nginx, Cloudflare, Railway, Render) while correctly resolving the client IP from `X-Forwarded-For`.
3. **Session-Aware Multi-Tier Rate Limiting:**
   - **Global Limiter:** Caps general requests to 150 per minute per IP.
   - **ML Inference Limiter:** Caps computationally expensive `/api/intelligence` and `/api/sandbox/simulate` calls to 60 per minute per session (preventing CPU/memory starvation).
   - **Mutation Limiter:** Restricts `/api/simulate-order` and `/api/insights/execute-actions` to 30 requests per minute per session to protect PostgreSQL write throughput.
4. **Defensive Input Validation & Numeric Overflow Guards:**
   - Simulated order quantities are strictly constrained to integers between $1$ and $1000$ (`MAX_ORDER_QUANTITY`). Order totals are verified against PostgreSQL decimal capacity (`99999999.99`) to prevent numeric overflow crashes.
5. **TOCTOU Race Condition Elimination:**
   - Concurrent evaluation of the autonomous decision engine uses atomic PostgreSQL upserts:
     ```sql
     INSERT INTO automated_actions_log (product_id, action_type, description, status, session_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (product_id, description, session_id) DO NOTHING
     RETURNING id;
     ```
     Guarantees that parallel requests never log duplicate automated actions.
6. **Wholesale Margin Redaction & Error Masking:**
   - `GET /api/database-inspect` explicitly excludes `cost_price` from the query projection, ensuring proprietary wholesale margins are never leaked to browser inspectors.
   - Express catch-all error handlers mask internal PostgreSQL syntax errors and private microservice URLs from client responses.

---

## Testing & Quality Assurance

Mercury includes a comprehensive automated test suite built on the **native Node.js test runner (`node:test`)**.

### Running Automated Backend Tests

Ensure PostgreSQL is reachable and the database is initialized, then execute:

```bash
# From repository root:
npm run test:backend

# Or directly within backend:
cd backend
npm test
```

### Verified Test Results

All **26 automated integration tests** run and pass cleanly:

```text
TAP version 13
ok 1 - CORS Policy: Authorized origin receives explicit Access-Control-Allow-Origin header (never wildcard)
ok 2 - CORS Policy: Unauthorized origin is rejected and denied Access-Control-Allow-Origin
ok 3 - CORS Policy: Non-browser requests without Origin header (curl, backend-to-backend) pass cleanly
ok 4 - TOCTOU Prevention: Concurrent execution of decision engine produces zero duplicate action log entries
ok 5 - TOCTOU Prevention: Concurrent HTTP POST /api/insights/execute-actions produces zero duplicate records
ok 6 - Error Masking: /api/health masks raw database error messages on failure
ok 7 - Error Masking: /api/intelligence masks internal microservice URL and error details
ok 8 - Error Masking: /api/sandbox/simulate masks internal microservice URL and error details
ok 9 - Input Validation: /api/simulate-order rejects excessive quantity exceeding MAX_ORDER_QUANTITY with HTTP 400
ok 10 - Inventory Check: /api/simulate-order rejects order when requested quantity exceeds available stock
ok 11 - Least-Privilege Roles: mercury_ml is strictly read-only and denied mutating tables
ok 12 - Least-Privilege Roles: mercury_app has operational CRUD access on application tables
ok 13 - MemoryCache: Stores, retrieves, and invalidates cached data
ok 14 - sessionOrIpKeyGenerator: Generates session keys for visitor sandboxes and falls back to IP
ok 15 - Rate limiting: Enforces limits and rejects excessive requests with HTTP 429
ok 16 - Rate limiting: Session-isolated keying ensures one visitor session does not exhaust another
ok 17 - Rate limiting: Express trust proxy correctly identifies client IP from X-Forwarded-For header
ok 18 - Security Headers: Express emits hardened security headers via helmet
ok 19 - Session isolation: Clones baseline inventory and protects baseline from mutation
ok 20 - Database Inspector excludes cost_price from product listings
ok 21 - requireSession middleware denies unauthenticated requests without x-session-id
ok 22 - requireSession middleware forbids direct mutation of baseline session
ok 23 - requireSession middleware authorizes requests with valid visitor UUID
ok 24 - Visitor Session Reset: Deletes visitor mutations and restores baseline state
ok 25 - Database transaction rollbacks safely on invalid product ID
ok 26 - Order simulation updates inventory correctly within a transaction
1..26
# tests 26
# pass 26
# fail 0
```

### Running Frontend Linter & Build Verification

```bash
# Run ESLint (Next.js core web vitals)
npm --prefix frontend run lint

# Run Next.js production build check
npm --prefix frontend run build
```

*(Both linting and builds complete with zero errors).*

---

## Docker Architecture & Deployment

Mercury utilizes optimized multi-stage Docker builds to keep images small, secure, and fast:

### Multi-Stage Container Architecture

1. **Frontend Container (`frontend/Dockerfile`):**
   - **`base`:** Node 20 Alpine with production dependencies.
   - **`dev`:** Exposes Next.js with Fast Refresh and file watching (`docker-compose.override.yml`).
   - **`builder`:** Generates optimized Next.js standalone artifacts.
   - **`runner`:** Production runtime copying only `.next/standalone` and static public assets. Drops privileges to run as unprivileged `USER node`.
2. **Backend Gateway Container (`backend/Dockerfile`):**
   - Built on `node:20-alpine`.
   - Runs non-root (`USER node`) on port `5000`.
   - Binds to host loopback (`127.0.0.1:5000`) in `docker-compose.yml`.
3. **ML Forecasting Container (`ml-engine/Dockerfile`):**
   - **`builder`:** `python:3.11-slim` with `build-essential` and `libpq-dev` to compile C extensions.
   - **`runner`:** Lean runtime with `libpq5` only (omits compilers). Runs as unprivileged `USER appuser` (UID 1000). Binds to host loopback (`127.0.0.1:8000`).
4. **PostgreSQL Container:**
   - `postgres:16-alpine` mounting `mercury_pgdata` volume and automated initialization scripts.

### Checking Container Health

All services include native healthcheck probes:

```bash
docker compose ps
```

*Example Healthy Output:*
```text
NAME                 IMAGE                      COMMAND                  SERVICE      STATUS
mercury-backend      mercury-backend            "docker-entrypoint.s…"   backend      Up (healthy)
mercury-frontend     mercury-frontend           "docker-entrypoint.s…"   frontend     Up (healthy)
mercury-ml-engine    mercury-ml-engine          "uvicorn main:app --…"   ml-engine    Up (healthy)
mercury-postgres     postgres:16-alpine         "docker-entrypoint.s…"   postgres     Up (healthy)
```

---

## Project Directory Layout

```text
mercury-demand-intelligence/
├── .env.example                       # Documented environment template with secure defaults
├── docker-compose.yml                 # Production multi-service container definitions
├── docker-compose.override.yml        # Development overrides (hot-reloading & volume mounts)
├── package.json                       # Root workspace orchestrator (concurrent dev launcher)
│
├── backend/                           # Node.js Express 5 API Gateway
│   ├── Dockerfile                     # Unprivileged Node.js container build
│   ├── package.json                   # Backend dependencies & test scripts
│   ├── roles.sh                       # Dynamic least-privilege role setup (Docker entrypoint)
│   ├── roles.sql                      # SQL reference for least-privilege role provisioning
│   ├── schema.sql                     # Canonical PostgreSQL DDL definitions & indexes
│   └── src/
│       ├── db.js                      # node-postgres (pg) connection pool configuration
│       ├── initDb.js                  # Safe idempotent database initialization & seeder
│       ├── seed.js                    # Destructive hard reset & demo seeder
│       ├── server.js                  # Express gateway, reverse proxy, and route handlers
│       ├── middleware/
│       │   ├── rateLimiter.js         # Global, ML inference, and mutation rate limiters
│       │   └── session.js             # Visitor session extraction & copy-on-write isolation
│       ├── services/
│       │   └── decisionEngine.js      # Competitor undercut & stockout rule engine
│       ├── tests/                     # 26 automated integration & security test suites
│       └── utils/
│           └── cache.js               # In-memory TTL cache for ML demand predictions
│
├── frontend/                          # Next.js 16 / React 19 Frontend Application
│   ├── Dockerfile                     # Multi-stage standalone Next.js container build
│   ├── package.json                   # UI dependencies (Tailwind 4, Recharts, Lucide)
│   ├── next.config.mjs                # Next.js configuration (standalone output mode)
│   ├── public/                        # Static brand assets & web fonts
│   └── src/
│       ├── app/
│       │   ├── page.js                # Main view controller, state sync & error bounds
│       │   ├── layout.js              # Root HTML layout with cookie-based lang detection
│       │   ├── globals.css            # Tailwind CSS 4 theme rules & animations
│       │   ├── utils/session.js       # Client UUID token management & session reset
│       │   └── components/
│       │       ├── DashboardView.jsx  # Inventory KPI cards, Recharts chart, & action log
│       │       ├── SandboxView.jsx    # What-If scenario sliders & elasticity preview
│       │       ├── DatabaseInspectorModal.jsx # Raw PostgreSQL relational browser (5 tables)
│       │       ├── Header.jsx         # Navigation bar, language picker, & theme toggle
│       │       ├── WelcomeModal.jsx   # Guided product walkthrough & documentation
│       │       └── MercuryRockSlider.jsx # Custom tactile UI range slider
│       └── i18n/
│           ├── LanguageProvider.jsx   # React Context for client-side localization
│           ├── formatters.js          # Dynamic i18n message interpolation helpers
│           └── messages/              # Locale JSON dictionaries (en.json & id.json)
│
└── ml-engine/                         # Python FastAPI Machine Learning Microservice
    ├── Dockerfile                     # Multi-stage builder & slim runner container
    ├── main.py                        # Continuous linear regression pipeline & simulation
    └── requirements.txt               # Pinned Python dependencies (Scikit-Learn, pandas)
```

---

## Known Limitations & Roadmap

In the interest of full technical transparency, the following design boundaries and future improvements are noted:

### Current Implementation Boundaries
- **Baseline Forecasting Model:** Demand forecasting utilizes Scikit-Learn continuous linear regression. While robust for near-term trend extrapolation on small daily samples, it does not model annual seasonality, holiday spikes, or intermittent Poisson demand patterns.
- **Heuristic Stockout Risk Metric:** The `stockoutProbability` field expresses the ratio of projected 7-day demand to available inventory as a percentage index. It is an operational heuristic rather than a statistically calibrated Bayesian probability.
- **In-Memory Volatility:** In-memory caching (`intelligenceCache`) and rate-limiting counters are bound to the single Express process. Running multiple horizontal gateway replicas requires configuring a distributed Redis store.
- **Stateless Client Authentication:** Multi-tenancy is implemented through browser session tokens (`x-session-id`) rather than cryptographic user accounts (JWT / OAuth2).

### Planned Roadmap
- [ ] **Advanced Time-Series Models:** Integrate Prophet and LightGBM models for SKU catalogs with $>90$ days of recorded sales history.
- [ ] **Distributed Cache & State:** Migrate in-memory rate limiting and forecast caching to Redis / Valkey.
- [ ] **Automated Supplier Webhooks:** Trigger automated webhook notifications (e.g., Slack or ERP purchase orders) when high stockout risk items are logged.
- [ ] **Role-Based Authentication:** Introduce RBAC (Viewer, Inventory Planner, Pricing Administrator) with JWT tokens.

---

## Contributing & Development Conventions

Contributions are welcome! Please follow these engineering conventions:

1. **Branch Naming:** Use feature branches (`feature/add-sku-export`, `fix/cache-invalidation-edgecase`).
2. **Pre-Commit Verification:** Run the full automated test suite and frontend linter before opening pull requests:
   ```bash
   npm run test:backend
   npm --prefix frontend run lint
   ```
3. **Database Integrity:** Never modify existing seed scripts destructively without adding matching idempotent fallbacks.
4. **Security Focus:** Do not commit credentials, tokens, or environment files. Use `.env.example` placeholders.

---

## License & Acknowledgments

- **License:** The backend gateway and database provisioning code are distributed under the [ISC License](https://opensource.org/licenses/ISC). The repository is configured for portfolio and technical evaluation.
- **Open-Source Credits:** Built with gratitude upon [Next.js](https://nextjs.org/), [FastAPI](https://fastapi.tiangolo.com/), [Scikit-Learn](https://scikit-learn.org/), [Tailwind CSS](https://tailwindcss.com/), [Express](https://expressjs.com/), [Recharts](https://recharts.org/), and [Lucide Icons](https://lucide.dev/).

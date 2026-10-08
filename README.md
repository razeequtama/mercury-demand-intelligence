# Mercury Demand Intelligence

> **Turn commerce signals into operational decisions.** Mercury is a full-stack demand and pricing intelligence demo for exploring inventory forecasts, stockout exposure, competitor signals, and margin-aware responses.

Mercury brings a live operations dashboard, a REST gateway, PostgreSQL-backed commerce data, and a Python forecasting service together in one locally runnable project. It is designed to make the path from raw commerce records to understandable recommendations visible and interactive.

**At a glance:** explore seven-day demand forecasts, flag inventory risk, inspect the source records, and stress-test price, demand, and stock assumptions in a what-if sandbox.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-ES%20Modules-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Relational%20Data-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-ML%20Service-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![scikit--learn](https://img.shields.io/badge/scikit--learn-Linear%20Regression-F7931E?logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Recharts-Data%20Visualization-22B5BF)](https://recharts.org/)

---

## Why Mercury

For a non-technical reader, Mercury is a miniature command center for questions such as: *Which products may run short? How could a competitor's price affect our response? What happens if demand rises while stock stays fixed?*

For an engineering team, it demonstrates an end-to-end path across a React interface, an Express API, relational records and transactions, a separately hosted Python inference service, and an auditable decision log.

### Product capabilities

- **Seven-day demand forecasting:** aggregates historical order quantities by day and fits a Scikit-Learn linear regression model when sufficient observations are available.
- **Inventory risk scoring:** compares projected weekly demand with available units, estimates days until depletion, and surfaces reorder guidance.
- **Competitor price analysis:** identifies seeded market events where a competitor price is below the product's current price.
- **Margin-aware scenario evaluation:** previews whether a price match remains above the sandbox's 15% gross-margin safety floor.
- **Decision-engine audit trail:** records idempotent price-match and zero-stock replenishment actions in PostgreSQL.
- **Interactive operations UI:** combines KPI cards, inventory and forecast comparisons, market insights, an action log, and a scenario sandbox.

> **Demo scope:** the included data is synthetic and the forecasting and decision policies are intentionally small, inspectable examples. Results illustrate a workflow; they are not a production demand model, calibrated probability, or a connection to a live retailer or competitor feed.

---

## Architecture and system design

Mercury is split into three runnable services plus the shared PostgreSQL database:

| Component | Technology | Responsibility |
| --- | --- | --- |
| Web application | Next.js 16, React 19, Tailwind CSS 4, Recharts | Presents dashboard and sandbox; calls the gateway over HTTP. |
| Gateway API | Node.js, Express 5, `pg` | Serves dashboard data, validates simulation/order requests, coordinates the ML service, and runs/logs operational decisions. |
| Forecasting API | Python, FastAPI, pandas, NumPy, Scikit-Learn, psycopg2 | Reads product, inventory, and order records; generates forecasts and sandbox results. |
| Shared data store | PostgreSQL | Stores products, inventory, orders, competitor events, and automated action history. |

```text
                         ┌──────────────────────────────┐
                         │ Next.js / React web client   │
                         │ Dashboard · Inspector ·      │
                         │ What-If Sandbox              │
                         └──────────────┬───────────────┘
                                        │ HTTP / JSON
                                        ▼
                         ┌──────────────────────────────┐
                         │ Express gateway :5000        │
                         │ /api/intelligence            │
                         │ /api/insights                │
                         │ /api/sandbox/simulate        │
                         │ /api/database-inspect        │
                         └─────────┬───────────┬────────┘
                                   │           │
                     inference     │           │ SQL, actions,
                     request       ▼           │ transactions
                         ┌────────────────┐    │
                         │ FastAPI /      │    │
                         │ Scikit-Learn   │    │
                         │ :8000          │    │
                         └───────┬────────┘    │
                                 │ SQL         │ SQL
                                 └──────┬──────┘
                                        ▼
                         ┌──────────────────────────────┐
                         │ PostgreSQL :5433             │
                         │ products · inventory ·       │
                         │ orders · competitor_events · │
                         │ automated_actions_log        │
                         └──────────────────────────────┘
```

### Request lifecycles

**Dashboard intelligence**

1. The browser requests `GET /api/intelligence` and `GET /api/insights` from the Express gateway.
2. Express forwards the intelligence request to FastAPI's `/predict-demand` endpoint.
3. FastAPI reads products, inventory, and order history from PostgreSQL, computes forecasts and risk indicators, then returns JSON through Express to the dashboard.
4. The insights endpoint reads competitor events and the action log through Express/PostgreSQL. When the gateway starts, it also evaluates the decision engine and records qualifying actions.

**What-If Sandbox**

1. The user chooses a product and adjusts competitor price, demand multiplier, or inventory override.
2. The browser sends those inputs to `POST /api/sandbox/simulate`.
3. Express validates the values and forwards the request to FastAPI's `/simulate-sandbox`.
4. FastAPI uses the product's stored order history as its baseline, applies the scenario adjustments, then returns demand, stockout timing/risk, projected margin, and a recommendation.
5. The sandbox response is a **simulation preview**: changing its sliders does not update the stored price, inventory, or order records.

### API surface

| Method and route | Purpose |
| --- | --- |
| `GET /api/health` | Checks API availability and PostgreSQL connectivity. |
| `GET /api/intelligence` | Returns forecasts and inventory-risk indicators from the ML service. |
| `GET /api/insights` | Returns competitor-event insights and the autonomous action log. |
| `POST /api/insights/execute-actions` | Explicitly evaluates and logs eligible decision-engine actions. |
| `POST /api/simulate-order` | Records an order and reduces matching inventory in a database transaction. |
| `GET /api/database-inspect` | Returns the product, inventory, and competitor-event records shown in the inspector. |
| `POST /api/sandbox/simulate` | Validates and forwards scenario inputs to the ML service. |

The gateway listens on port `5000` by default. The ML service listens on port `8000`; the frontend uses `http://localhost:5000/api` unless `NEXT_PUBLIC_API_URL` is set.

---

## Database schema and demo seeding

The schema is defined in [`backend/schema.sql`](./backend/schema.sql) and created by the backend seed script. The core entities are:

| PostgreSQL table | What it represents |
| --- | --- |
| `products` | SKU, display name, category, current price, and cost price. |
| `inventory` | Product stock by warehouse, reorder threshold, and last update time. |
| `orders` | Historical or simulated order quantity, amount, and timestamp; this is the demand model's input. |
| `competitor_events` | Observed competitor price and event description associated with a product. |
| `automated_actions_log` | Action type, description, status, and execution time for engine decisions. |

Foreign keys connect inventory, orders, competitor events, and action records to products; deleting a product cascades to its related rows. The SQL table names use `snake_case`. The Database Inspector's client-facing tab is labeled `competitorEvents`, and its endpoint joins the event rows to product details.

### What the seed creates

From the `backend` directory, `npm run db:seed` runs [`backend/src/seed.js`](./backend/src/seed.js). It initializes an immediately explorable demo dataset:

- **Five synthetic products** across electronics, smart home, accessories, and office categories.
- **One warehouse inventory row per product**, including a deliberately low-stock SKU and a zero-stock SKU to exercise risk and replenishment paths.
- **Six recent order records** with timestamps over the previous few days, providing a small historical demand sample.
- **Two competitor price events** describing undercuts for selected products.
- **A clean action log table**; qualifying automated actions are logged when the gateway's decision engine runs.

> **Important: seeding is destructive.** The script drops and recreates all five tables (using `CASCADE`) before inserting sample rows. Run it only against a disposable local/demo database whose existing data can be erased. It is not an incremental migration or production-safe reset.

`schema.sql` documents the table definitions. The seed script also contains its own drop-and-create statements, so running the seed does not require a separate migration command.

---

## Machine learning and decision engine

### Forecast and stock-risk pipeline

The forecasting service is implemented in [`ml-engine/main.py`](./ml-engine/main.py) with FastAPI, pandas, NumPy, and Scikit-Learn:

1. Load product, inventory, and related order rows from PostgreSQL.
2. Aggregate observed order quantities by calendar day for each product/warehouse grouping.
3. If there are at least two daily observations, fit `sklearn.linear_model.LinearRegression` over the ordered daily observations and project the next seven time steps. Sum those daily estimates and round up to produce the seven-day forecast.
4. If history is sparse or absent, use the implementation's fallback calculation rather than claiming a trained, high-confidence forecast.
5. Estimate days until stockout from current stock and forecast demand. Calculate the displayed stock-risk percentage from forecast demand divided by available stock, capped at 100%; zero inventory is assigned 100%.
6. When the risk ratio is above 70%, return a reorder recommendation based on forecast demand, reorder threshold, and current stock.

The service reports an in-sample mean absolute error (MAE) when it has enough observations to fit a model. With a tiny synthetic dataset, that value is descriptive only and is not a holdout validation score.

**Interpretation of “probability”:** the API field is named `stockoutProbability`, but the current implementation produces a demand-to-stock **heuristic risk index** as a percent. It is not statistically calibrated to the probability of a stockout. Likewise, the sandbox classifies risk bands using the ratio and estimated days remaining; treat those as scenario indicators, not guarantees.

### Autonomous rules and pricing guardrails

The Node decision engine in [`backend/src/services/decisionEngine.js`](./backend/src/services/decisionEngine.js) checks two conditions:

- **Competitor undercut:** if an event's competitor price is below the product's current price, it records a price-match/promotion action.
- **Zero inventory:** if stock is zero or lower, it records an emergency replenishment action.

Before inserting, it checks for an existing matching product-and-description action, making repeated evaluations idempotent for the same condition. The engine is evaluated at API startup and can also be explicitly invoked through `POST /api/insights/execute-actions`.

The **sandbox** applies additional scenario-only pricing logic. If a simulated competitor price is lower than the current price, it previews a match; if the resulting gross margin would be below **15%**, it warns against matching and recommends bundling instead. At or above the floor, it marks a match as eligible. A simulated stock-risk ratio of at least 70% adds emergency reorder guidance. This sandbox recommendation does not itself write an action log or mutate the database.

---

## Interactive features walkthrough

### Live Operations

The main dashboard summarizes tracked SKUs, high-risk items, competitor-event alerts, and service status. Its inventory table places available stock, seven-day forecast, risk indicator, and reorder recommendation side by side; a Recharts visualization compares stock with predicted demand. The action-log panel shows decisions already recorded by the backend.

### Database Inspector

Select **Inspect DB** in the header to view the current product, inventory, and competitor-event rows returned by the Express API. This is a read-only view of selected raw database records, not a general-purpose SQL console; orders and `automated_actions_log` are not tabs in the inspector.

### What-If Sandbox

Select **What-If Sandbox**, choose a target SKU, then move the scenario controls:

| Control | Range | Scenario effect |
| --- | --- | --- |
| Simulated competitor price | `$10`–`$250`, step `$1` | Tests undercut/match logic and projected gross margin. |
| Demand surge multiplier | `0.5x`–`3.0x`, step `0.1x` | Scales scenario demand against the model's baseline forecast. |
| Inventory buffer override | `0`–`500` units, step `5` | Replaces the stored stock value for this inference only. |

The result panel updates with simulated demand, estimated stockout timing/risk, projected margin, and the decision engine's recommendation preview. These values do not persist when you move the controls.

---

## Internationalization (English and Indonesian)

The Next.js interface supports English (`en`) and Indonesian (`id`) through a small React context and local JSON dictionaries; it does not add a localization package dependency. Use the flag buttons in the header to switch languages immediately. The preference is saved in a first-party cookie and restored on the next visit, including in the initial server-rendered document language.

Translation resources live in `frontend/src/i18n/messages/en.json` and `frontend/src/i18n/messages/id.json`. `LanguageProvider` exposes the active locale and a `t('section.key')` helper to client components. Add matching keys to both dictionaries when adding user-facing interface labels. The document's `lang` attribute follows the selected locale.

The current dictionaries cover the dashboard, sandbox, database-inspector labels, welcome guide, and gateway connection error. Values returned by the backend—such as model-generated recommendation and audit-log descriptions—remain in the language supplied by the service.

---

## Getting started

### Prerequisites

- Node.js 20.9+ and npm (required by the repository's Next.js 16 frontend).
- Python 3.10+ and `pip`.
- PostgreSQL available locally.
- Git.

The application and ML service both need to connect to the same database. The repository's database connection fallback uses PostgreSQL port `5433`; if your PostgreSQL server listens on another port, configure the same explicit `DATABASE_URL` for both services.

### 1. Clone the repository

```bash
git clone https://github.com/razeequtama/mercury-demand-intelligence.git
cd mercury-demand-intelligence
```

### 2. Create a local PostgreSQL database

Create an empty database named `mercury_db` using your local PostgreSQL tools. For example, from a terminal with `psql` available (replace the port or credentials to match your PostgreSQL installation):

```bash
psql -h localhost -p 5433 -U postgres -d postgres
```

Then run this SQL in the `psql` prompt:

```sql
CREATE DATABASE mercury_db;
```

Use a PostgreSQL connection URL in the following form in both service environment files:

```text
postgresql://USERNAME:PASSWORD@localhost:5433/mercury_db
```

URL-encode special characters in the password where necessary. If you use the conventional PostgreSQL port `5432`, set that port in both `DATABASE_URL` values.

### 3. Configure and start the backend gateway

Create `backend/.env` (do not commit credentials):

```dotenv
PORT=5000
DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5433/mercury_db
ML_ENGINE_URL=http://localhost:8000
```

Install the Node dependencies, create the schema and synthetic sample data, then start Express:

```bash
cd backend
npm install
npm run db:seed
npm run dev
```

The seed operation resets the tables; see [Database schema and demo seeding](#database-schema-and-demo-seeding) before running it against any database with data you need to keep.

### 4. Configure and start the Python ML service

In a second terminal, create `ml-engine/.env` with the **same** database URL:

```dotenv
DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5433/mercury_db
```

Install the pinned/declared dependencies and launch FastAPI from the `ml-engine` directory:

```bash
cd ml-engine
python -m venv .venv
```

Activate the virtual environment:

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

```bash
# macOS / Linux
source .venv/bin/activate
```

Then install packages and start the service:

```bash
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The forecasting endpoint will be available at `http://localhost:8000/predict-demand`.

### 5. Configure and start the Next.js frontend

In a third terminal, create `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Install packages and start the development server:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Keep PostgreSQL, the Express gateway, and FastAPI running while you use the application.

### Service check and commands

Check the gateway and its database connection at `http://localhost:5000/api/health`. The dashboard's intelligence view additionally requires the Python service to be available.

| Workspace | Command | Purpose |
| --- | --- | --- |
| `backend` | `npm run dev` | Start Express with nodemon. |
| `backend` | `npm start` | Start Express without nodemon. |
| `backend` | `npm run db:seed` | Destructively recreate and seed demo tables. |
| `backend` | `npm test` | Run the Node transaction tests (requires a reachable configured PostgreSQL database and seeded product data). |
| `frontend` | `npm run dev` | Start the Next.js development server. |
| `frontend` | `npm run build` | Build the frontend for production. |
| `frontend` | `npm run lint` | Run ESLint. |
| `ml-engine` | `python -m uvicorn main:app --reload --port 8000` | Start the FastAPI inference service. |

---

## Repository layout

```text
mercury-demand-intelligence/
├── backend/
│   ├── schema.sql                    # PostgreSQL table definitions
│   ├── package.json                  # API scripts and Node dependencies
│   └── src/
│       ├── db.js                     # PostgreSQL connection pool
│       ├── seed.js                   # Destructive schema reset and demo seeding
│       ├── server.js                 # Express routes and ML-service gateway
│       ├── services/
│       │   └── decisionEngine.js     # Idempotent competitor/stock actions
│       └── tests/
│           └── transaction.test.js   # Transaction behavior tests
├── frontend/
│   ├── package.json                  # Next.js scripts and UI dependencies
│   └── src/app/
│       ├── page.js                   # Dashboard state and API integration
│       └── components/               # Dashboard, sandbox, inspector, and UI
├── ml-engine/
│   ├── main.py                       # FastAPI prediction and simulation routes
│   └── requirements.txt              # Python service dependencies
└── README.md
```

---

## Engineering notes

- **Clear service boundaries:** the browser calls the Express API rather than connecting directly to PostgreSQL. Express delegates model inference to FastAPI.
- **Transactional order ingestion:** the simulated-order route writes an order and adjusts inventory in a PostgreSQL transaction, rolling back on failure.
- **Inspectable decision path:** source rows, computed results, rule thresholds, and recorded actions can all be traced through the code and UI.
- **Reproducible demo setup:** a small synthetic dataset exposes normal, low-stock, zero-stock, and competitor-undercut cases without an external data feed.
- **Pragmatic model baseline:** linear regression over a few days is transparent and easy to explore, while production use would require richer history, backtesting, calibration, and operational monitoring.

## Potential next steps

- Replace the demo dataset with validated point-of-sale and inventory feeds.
- Evaluate forecasting accuracy using time-based holdouts and product-level metrics.
- Calibrate stockout probabilities and tune reorder policies against service-level targets.
- Add authentication, authorization, observability, and deployment-specific configuration before exposing services beyond a trusted local environment.

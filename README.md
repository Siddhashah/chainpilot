# ChainPilot — Supply Chain Management System

Rebuilt from scratch as a TypeScript MERN stack, with a from-scratch ML forecasting lineup.

## Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 19 + TypeScript + Vite, custom CSS, React Router, Lucide icons |
| Backend    | Node.js + Express 5 + TypeScript, layered architecture (routes → controllers → services → models) |
| Database   | MongoDB via Mongoose |
| ML Service | FastAPI — Naive baseline, Holt-Winters, Theta, XGBoost, Croston's method (weighted ensemble) |
| Testing    | Vitest + Supertest (backend), Vitest + React Testing Library (frontend) |
| Tooling    | ESLint 9 (flat config) + Prettier across both TS packages |

## ML model lineup

Rebuilt from the ground up rather than reusing the original project's models:

| Model | Min. data points | Why it's here |
|---|---|---|
| Naive baseline | 3 | Moving-average-with-drift; guaranteed fallback |
| Croston's method | 5 | Purpose-built for intermittent/sparse usage (many zero-usage days) |
| Holt-Winters | 10 | Trend + weekly seasonality |
| Theta | 14 | Replaces SARIMA — M3-competition-proven, far less tuning |
| XGBoost | 20 | Lag/rolling features, non-linear patterns when data is rich |

Prophet was considered and deliberately excluded: it's arguably the most purpose-built tool for business demand forecasting, but it's historically one of the more fragile Python packages to install on Windows (needs a C++ toolchain or a large CmdStan download). Every dependency here installs with a plain `pip install`.

**Honest note on Croston's:** in testing against synthetic intermittent demand, Croston's didn't top the MAPE ranking — Holt-Winters and Theta scored better. This is a known nuance: MAPE is a poor metric for intermittent series (it heavily penalizes any model that doesn't hit sporadic bursts on the exact right day), not a flaw specific to this implementation. Croston's is still included, still competes fairly, and still contributes to the ensemble when it performs well — but if you want it weighted more heavily for genuinely sparse materials, the ranking metric in `pipeline.py` is the place to adjust.

## Project structure

```
chainpilot/
├── backend/        # Express 5 + TypeScript API (port 8001)
│   ├── src/
│   │   ├── config/        # env, Mongoose connection
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # thin route definitions
│   │   ├── controllers/   # HTTP layer only
│   │   ├── services/      # business logic
│   │   ├── middleware/    # JWT auth, error handling
│   │   └── utils/         # tokens, async wrapper
│   └── tests/integration/ # Vitest + Supertest (needs mongodb-memory-server)
│
├── frontend/        # React 19 + TypeScript + Vite (port 5173)
│   └── src/
│       ├── pages/          # Dashboard done; Products/Inventory/Predictions/Calendar are placeholders
│       ├── components/     # Layout, ProtectedRoute, illustrations
│       ├── context/        # Auth + Theme (light/dark)
│       └── api/            # typed axios client
│
├── ml-service/      # FastAPI (port 8000)
│   ├── main.py / routers/predict.py   # unchanged wrapper
│   ├── pipeline.py                    # orchestrates the 5 models
│   └── models/                        # one file per model
│
└── docker-compose.yml
```

## Local setup

**MongoDB:** `net start MongoDB` (Windows service) or run `mongod` directly.

**Backend:**
```
cd backend
cp .env.example .env
npm install
npm run dev
```

**ML service:**
```
cd ml-service
python -m venv venv
venv\Scripts\Activate.ps1        # PowerShell
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open **http://localhost:5173**

## Testing

```
cd backend && npm test    # needs internet access for mongodb-memory-server's first run
cd frontend && npm test
```

## Docker

```
docker compose up --build
```

## What's built vs. what's next

**Done, tested, and running:** full backend (all 6 resources), the frontend shell + design system + auth pages + Dashboard, and the complete ML service with the new model lineup.

**Not yet built:** the Products, Inventory, Predictions, and Calendar frontend pages are routed placeholders — the backend endpoints and API client methods they'll call already exist and work.

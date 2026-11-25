# 日本 Nihon Urbanization Growth

> An end-to-end spatial machine learning pipeline for predicting prefecture-level population change across Japan's 47 prefectures, deployed as an interactive web dashboard.

**🔗 Live Demo: [nihonurbanization.vercel.app](https://nihonurbanization.vercel.app)**

---

## Table of Contents

- [Overview](#overview)
- [Project Architecture](#project-architecture)
- [The Model](#the-model)
- [Backend API](#backend-api)
- [Frontend Dashboard](#frontend-dashboard)
- [Tech Stack](#tech-stack)
- [Local Development](#local-development)

---

## Overview

Japan is undergoing one of the most severe demographic transitions in modern history. With a total fertility rate around **1.14** and over **30% of its population aged 65+**, rural prefectures face systemic population collapse while metropolitan centres continue to grow.

This project builds a spatial ML pipeline that:

1. Engineers features from multi-source government data (e-Stat, Kaggle GDP data)
2. Trains a regularized Ridge Regression model validated with Leave-One-Out Cross-Validation
3. Performs spatial diagnostics using Moran's I and LISA cluster analysis on the model residuals
4. Serves out-of-sample predictions, residuals, LISA clusters and feature attributions via a REST API
5. Visualizes everything on an interactive choropleth map with a what-if simulator driven by the model

---

## Project Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     NIHON URBANIZATION GROWTH                       │
└─────────────────────────────────────────────────────────────────────┘

          ┌──────────────────┐         ┌──────────────────┐
          │   DATA SOURCES   │         │   ML PIPELINE    │
          │                  │         │  (Python / src/) │
          │  • e-Stat API    │──────▶  │                  │
          │  • Kaggle CSV    │         │  1. Merge Panel  │
          │  • GeoJSON       │         │  2. Engineer     │
          └──────────────────┘         │     Features     │
                                       │  3. Ridge + LOOCV│
                                       │     + LISA       │
                                       │  4. 2035 project │
                                       └────────┬─────────┘
                                                │ outputs
                                                ▼
                                    ┌───────────────────────┐
                                    │   data/processed/     │
                                    │                       │
                                    │  spatial_panel.csv    │
                                    │  model_outputs.csv    │
                                    │  model_meta.json      │
                                    │  projections_2035.csv │
                                    └───────────┬───────────┘
                                                │
                        ┌───────────────────────▼──────────────────────┐
                        │             BACKEND  (FastAPI)                │
                        │             web/backend/                      │
                        │                                               │
                        │   GET /api/spatial-data   → 47 prefectures   │
                        │   GET /api/geojson        → map polygons      │
                        │   GET /api/feature-impacts → coefficients     │
                        │   GET /api/model-meta     → metrics + model   │
                        │   GET /api/predictions    → 2035 projections  │
                        └───────────────────────┬──────────────────────┘
                                                │  JSON over HTTP
                                                ▼
                        ┌───────────────────────────────────────────────┐
                        │             FRONTEND  (Next.js)               │
                        │             web/frontend/                     │
                        │                                               │
                        │  ┌─────────────┐  ┌────────────────────────┐ │
                        │  │ Choropleth  │  │  Inspector Panel       │ │
                        │  │ Map         │  │  • Pop. metrics        │ │
                        │  │ (Leaflet)   │  │  • SHAP bar chart      │ │
                        │  └─────────────┘  └────────────────────────┘ │
                        │  ┌─────────────┐  ┌────────────────────────┐ │
                        │  │ Simulation  │  │  Leaderboard           │ │
                        │  │ Sliders     │  │  Ranking Table         │ │
                        │  └─────────────┘  └────────────────────────┘ │
                        └───────────────────────────────────────────────┘
```

### Deployment

```
GitHub Repository
      │
      ├──▶  Vercel (Frontend)
      │         Next.js build
      │         NEXT_PUBLIC_API_URL → Render URL
      │
      └──▶  Render (Backend)
                FastAPI + uvicorn
                Reads from data/ directory
```

---

## The Model

### Problem Definition

Predict `target_pop_change_pct`: the percentage change in prefecture population between 2020 and 2024 for all 47 Japanese prefectures.

### Feature Engineering

| Feature | Description | Transformation |
|---|---|---|
| `log_pop_2020` | Baseline population | `log(population_2020)` to reduce scale variance |
| `aging_rate_pct` | % of population aged 65+ | Raw |
| `net_migration_rate` | Net migration per 1,000 people | Raw |
| `gdp_usd_ppp_2014` | GDP in USD (PPP) | Raw |
| `vacancy_rate_pct` | Housing vacancy rate | Raw |
| `dist_to_tokyo_km` | Great-circle (haversine) distance between prefecture centroids and Tokyo | Raw |

> **Leakage prevention**: `population_2024` was explicitly excluded from features since it is part of the target variable derivation.
>
> **Caveat**: `net_migration_rate` and the 2024 `aging_rate_pct` are measured within the same 2020–2024 window as the target, and net migration is itself a component of population change. The model is therefore **explanatory** (which factors account for the differences between prefectures) rather than a forecast of future change, and its R² is higher than a true forecast would achieve.

### Model Selection

```
Candidates evaluated:
  XGBoost Baseline    → Overfits with n=47, poor generalization
  Spatial Lag Model   → Requires contiguous neighbors, breaks for islands
  Ridge Regression    → Best balance: handles multicollinearity, generalizes well
        ↓
  Selected: Ridge Regression  (alpha=5.0, StandardScaler)
```

The notebooks record the XGBoost runs: LOOCV R² 0.891 (baseline) and 0.887 (with spatial lags). The spatial lag model is still fitted in `src/spatial_ridge_regression.py` for comparison; its spatial coefficient ρ = 0.19 is significant (p ≈ 0.003).

### Validation: Leave-One-Out Cross-Validation (LOOCV)

With only 47 data points (one per prefecture), LOOCV was used instead of a train/test split to maximize the use of available data.

```
For each prefecture i in 1..47:
  Fit StandardScaler + Ridge on the other 46 prefectures
  Predict on held-out prefecture i
  Record (y_true_i, y_pred_i)

Final metrics:
  LOOCV RMSE : 0.483 percentage points
  LOOCV MAE  : 0.389 percentage points
  LOOCV R²   : 0.914
```

The scaler is refit inside every fold (an `sklearn` pipeline), so the held-out prefecture never influences scaling. These out-of-sample predictions are what the dashboard maps.

### Classification Metrics (Relative to Median, LOOCV)

Because 46 out of 47 prefectures in Japan are facing population decline, absolute binary classification (Growth > 0%) is heavily imbalanced. To properly evaluate the model's discriminative power, prefectures were classified as performing "Better than Average" or "Worse than Average" based on the national median population change (-3.06%).

| Metric | Score | Interpretation |
|---|---|---|
| **Accuracy** | **85.1%** | Correctly predicts if a prefecture is in the top or bottom half of the country |
| **Precision** | **0.90** | When predicting "Above Median", it is correct 90% of the time |
| **Recall** | **0.79** | Successfully identifies 79% of all "Above Median" prefectures |
| **F1 Score** | **0.84** | Harmonic mean of precision and recall |

### Ridge Coefficients (Feature Impacts)

These are the standardized coefficients from fitting Ridge on the full dataset. They are served directly by the API and used to render SHAP-style bar charts in the dashboard.

| Feature | Coefficient | Direction |
|---|---|---|
| Aging Rate | **-0.9368** | Strongest negative driver |
| Net Migration Rate | **+0.6746** | Strongest positive driver |
| GDP (USD PPP) | -0.1367 | Mild negative (structural transition) |
| Log Population 2020 | +0.1315 | Scale cushion |
| Vacancy Rate | +0.0957 | Mild positive |
| Distance to Tokyo | +0.0676 | Mild positive |

Coefficients are per standard deviation of each feature, in percentage points of population change. The API serves them along with the scaler mean and standard deviation, so the dashboard can compute exact per-prefecture contributions (linear SHAP values) and what-if responses.

### Spatial Diagnostics

After fitting the model, **Anselin Local Moran's I** is computed on the LOOCV residuals (actual − predicted) using a row-standardized **k-nearest-neighbour (k=4)** spatial weights matrix. KNN is used instead of Queen contiguity so that island prefectures (Hokkaido, Okinawa) still have neighbours. Significance comes from 999 permutations (seeded), at p < 0.05.

```
Residual clusters (p < 0.05):
  HH (High-High)  → 11 prefectures: cluster where population held up better than predicted
  LL (Low-Low)    →  6 prefectures: cluster where population fell faster than predicted
  LH / HL         →  1 spatial outlier
  Not significant → 29 prefectures
```

The global Moran's I of the residuals is **0.38 (p = 0.001)**. The errors are still spatially clustered, so there is regional structure the six features don't capture. This is the most promising direction for improving the model.

### 2035 Projection

`src/projections_2035.py` extends each prefecture's 2020–2024 annual growth rate to 2035 (national total: 123.8M → 117.8M). An earlier Prophet model trained on 1950–2024 history was dropped: it was dominated by post-war growth and projected 34 of 47 prefectures growing. The constant-rate projection ignores the accelerating decline from aging. Use the official IPSS cohort projections if you need authoritative numbers.

---

## Backend API

Built with **FastAPI** and served by **uvicorn**.

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/spatial-data` | Returns all 47 prefectures with features, LOOCV prediction, residual, LISA cluster and 2035 projection |
| `GET` | `/api/geojson` | Returns the simplified GeoJSON polygon data for rendering the choropleth map |
| `GET` | `/api/feature-impacts` | Returns the Ridge coefficients with scaler mean/std, used for SHAP attribution and the what-if sliders |
| `GET` | `/api/model-meta` | Returns intercept, coefficients and all evaluation metrics |
| `GET` | `/api/predictions` | Returns 2035 population projections per prefecture |
| `GET` | `/docs` | Auto-generated interactive API documentation (Swagger UI) |

### CORS

The backend accepts requests from any origin (`allow_origins=["*"]`). That's acceptable here because the API is read-only and serves public data. The frontend finds the backend through `NEXT_PUBLIC_API_URL`.

### Directory Structure

```
web/backend/
├── main.py          # FastAPI app entrypoint, CORS config
└── api/
    └── routes.py    # All API route handlers
```

---

## Frontend Dashboard

Built with **Next.js 16** (App Router).

### Pages

| Route | Description |
|---|---|
| `/` | Landing page with project narrative and scroll-driven sections |
| `/model` | Interactive model dashboard |

### Dashboard Components

```
/model page
│
├── MapVisualizer       (Leaflet choropleth — 3 layer modes)
│     ├── Prediction    LOOCV-predicted % change vs national median
│     ├── Residuals     Actual − predicted per prefecture
│     └── Hotspots      LISA clusters of the residuals (p < 0.05)
│
├── SimulationControls  (Left sidebar)
│     ├── Net migration shift (±5 per 1,000)
│     ├── Aging rate shift (±5 pts)
│     └── Vacancy rate shift (±5 pts)
│         → Pushed through the Ridge coefficients client-side (src/lib/model.ts)
│
├── InspectorPanel      (Right sidebar, on prefecture click)
│     ├── Socio-economic indicators + model output (prediction, residual, LISA, 2035)
│     └── Linear SHAP bar chart (coefficient × z-score)
│
├── LeaderboardTable    (Bottom drawer)
│     └── Ranked list of all 47 prefectures by predicted change (with what-if shifts)
│
└── ComparisonModal     (Triggered from InspectorPanel)
      ├── Side-by-side metrics table
      └── Dual SHAP charts (one per prefecture)
```

---

## Tech Stack

### Machine Learning & Data

| Library | Use |
|---|---|
| `scikit-learn` | Ridge Regression, StandardScaler, LOOCV |
| `geopandas` | Spatial data loading and CRS transforms |
| `libpysal` | KNN (k=4) spatial weights matrix |
| `esda` | Moran's I and LISA cluster analysis |
| `spreg` | Spatial Lag regression (ML_Lag), for comparison |
| `xgboost` / `shap` | Tree baselines in the notebooks |
| `pandas / numpy` | Data wrangling and feature engineering |

### Backend

| Library | Use |
|---|---|
| `FastAPI` | REST API framework |
| `uvicorn` | ASGI server |

### Frontend

| Library | Use |
|---|---|
| `Next.js 16` | React framework (App Router) |
| `react-leaflet` | Interactive choropleth map |
| `recharts` | SHAP bar charts |
| `framer-motion` | UI transitions |
| `GSAP` | Landing page scroll animations |
| `Tailwind CSS` | Styling |

---

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- `uv` package manager

### Backend

```bash
# From web/backend/
uv run uvicorn main:app --reload --port 8000
```

### Pipeline

```bash
# From project root. The first two steps need the raw e-Stat / Kaggle files in data/raw/ (not committed);
# everything from merge_panel.py onward runs on the committed data/processed/ files.
uv run python src/create_prefecture_mapping.py
uv run python src/preprocess_datasets.py
uv run python src/merge_panel.py
uv run python src/engineer_spatial_features.py
uv run python src/spatial_ridge_regression.py   # LOOCV, metrics, LISA -> model_outputs.csv, model_meta.json
uv run python src/projections_2035.py           # -> projections_2035.csv
```

### Frontend

```bash
# From web/frontend/
npm install
npm run dev
```

### Run Both Together

```bash
# From web/frontend/ — runs both concurrently
npm run fullstack
```

### Environment Variables

Create `web/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# Optional: background map tiles under the prefectures (any XYZ tile provider; the URL may contain your API key)
# NEXT_PUBLIC_MAP_TILE_URL=https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=YOUR_KEY
# NEXT_PUBLIC_MAP_TILE_ATTRIBUTION=© MapTiler © OpenStreetMap contributors
```

On Vercel, set the same variables under **Settings → Environment Variables** and redeploy. Without a tile URL the map is drawn from the prefecture shapes alone.

---

## Data Sources

| Dataset | Source | Description |
|---|---|---|
| Population estimates 2020–2024 | [e-Stat](https://www.e-stat.go.jp/) | Official Japanese government statistics |
| Prefecture GDP (USD PPP) | Kaggle | Economic output per prefecture |
| Geospatial polygons | Natural Earth / GeoJSON | Prefecture boundary shapefiles |

---

## Repository Structure

```
urbanisation-growth/
├── data/
│   ├── processed/          # Merged, cleaned, model-ready CSVs + GeoJSON
│   └── raw/geospatial/     # Prefecture boundary files
├── notebooks/              # EDA and model development Jupyter notebooks
├── src/                    # Python pipeline scripts
│   ├── merge_panel.py
│   ├── engineer_spatial_features.py
│   ├── spatial_ridge_regression.py
│   ├── projections_2035.py
│   └── ...
└── web/
    ├── backend/            # FastAPI app
    └── frontend/           # Next.js app
```

---

*Built by [Piyush-Fr](https://github.com/Piyush-Fr)*

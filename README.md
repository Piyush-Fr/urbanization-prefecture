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

1. Engineers features from multi-source government data (e-Stat, Kaggle census data)
2. Trains a regularized Ridge Regression model validated with Leave-One-Out Cross-Validation
3. Performs spatial diagnostics using Moran's I and LISA cluster analysis
4. Serves predictions and feature attributions via a REST API
5. Visualizes everything on an interactive choropleth map

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
                                       │  4. Spatial Diag │
                                       └────────┬─────────┘
                                                │ outputs
                                                ▼
                                    ┌───────────────────────┐
                                    │   data/processed/     │
                                    │                       │
                                    │  spatial_panel.csv    │
                                    │  prophet_2035.csv     │
                                    │  prefectures.geojson  │
                                    └───────────┬───────────┘
                                                │
                        ┌───────────────────────▼──────────────────────┐
                        │             BACKEND  (FastAPI)                │
                        │             web/backend/                      │
                        │                                               │
                        │   GET /api/spatial-data   → 47 prefectures   │
                        │   GET /api/geojson        → map polygons      │
                        │   GET /api/feature-impacts → coefficients     │
                        │   GET /api/predictions    → 2035 forecasts    │
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
| `dist_to_tokyo_km` | Geographic distance to Tokyo | Raw |

> **Leakage prevention**: `population_2024` was explicitly excluded from features since it is part of the target variable derivation.

### Model Selection

```
Candidates evaluated:
  XGBoost Baseline    → Overfits with n=47, poor generalization
  Spatial Lag Model   → Requires contiguous neighbors, breaks for islands
  Ridge Regression    → Best balance: handles multicollinearity, generalizes well
        ↓
  Selected: Ridge Regression  (alpha=5.0, StandardScaler)
```

### Validation: Leave-One-Out Cross-Validation (LOOCV)

With only 47 data points (one per prefecture), LOOCV was used instead of a train/test split to maximize the use of available data.

```
For each prefecture i in 1..47:
  Train Ridge on 46 prefectures
  Predict on held-out prefecture i
  Record (y_true_i, y_pred_i)

Final metrics:
  LOOCV RMSE : 0.4890
  LOOCV R²   : 0.9120
```

### Classification Metrics (Relative to Median)

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
| Aging Rate | **-0.9389** | Strongest negative driver |
| Net Migration Rate | **+0.6742** | Strongest positive driver |
| GDP (USD PPP) | -0.1382 | Mild negative (structural transition) |
| Log Population 2020 | +0.1292 | Scale cushion |
| Vacancy Rate | +0.0949 | Mild positive |
| Distance to Tokyo | +0.0611 | Mild positive |

### Spatial Diagnostics

After fitting the model, **Anselin Local Moran's I** was computed on the residuals using a Queen contiguity spatial weights matrix to detect spatial autocorrelation.

```
Residual clustering types detected:
  HH (High-High)  → Cluster of over-predicted prefectures
  LL (Low-Low)    → Cluster of under-predicted prefectures
  HL / LH         → Spatial outliers
```

Island prefectures (Hokkaido, Okinawa) that have no Queen neighbors were patched by connecting them to their nearest neighbor using a KNN-1 fallback.

---

## Backend API

Built with **FastAPI** and served by **uvicorn**.

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/spatial-data` | Returns all 47 prefectures with metrics (population, aging rate, migration, GDP, vacancy, distance) |
| `GET` | `/api/geojson` | Returns the simplified GeoJSON polygon data for rendering the choropleth map |
| `GET` | `/api/feature-impacts` | Returns the Ridge regression coefficients used for SHAP attribution |
| `GET` | `/api/predictions` | Returns Prophet 2035 population projections per prefecture |
| `GET` | `/docs` | Auto-generated interactive API documentation (Swagger UI) |

### CORS

The backend is configured to accept requests from any origin (`allow_origins=["*"]`). In production this is scoped to the Vercel frontend URL via the `NEXT_PUBLIC_API_URL` environment variable on the frontend side.

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
│     ├── Prediction    Predicted % pop change per prefecture
│     ├── Residuals     Model error per prefecture
│     └── Hotspots      Moran's I LISA cluster map
│
├── SimulationControls  (Left sidebar)
│     ├── Migration multiplier slider
│     ├── Aging rate multiplier slider
│     └── Vacancy rate multiplier slider
│         → Updates map colors in real-time (client-side only)
│
├── InspectorPanel      (Right sidebar, on prefecture click)
│     ├── Population metrics card
│     └── SHAP-style horizontal bar chart (Ridge coefficients × z-scores)
│
├── LeaderboardTable    (Bottom drawer)
│     └── Ranked list of all 47 prefectures by predicted change
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
| `libpysal` | Queen contiguity spatial weights matrix |
| `esda` | Moran's I and LISA cluster analysis |
| `spreg` | Spatial Lag regression (ML_Lag) |
| `prophet` | 2035 population projections |
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
# From project root
uv run uvicorn web/backend/main:app --reload --port 8000
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
```

---

## Data Sources

| Dataset | Source | Description |
|---|---|---|
| Population estimates 2020–2024 | [e-Stat](https://www.e-stat.go.jp/) | Official Japanese government statistics |
| Historical population 1870–2015 | Kaggle | Long-run demographic trends |
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
│   ├── spatial_ridge_regression.py
│   ├── engineer_spatial_features.py
│   ├── merge_panel.py
│   └── ...
└── web/
    ├── backend/            # FastAPI app
    └── frontend/           # Next.js app
```

---

*Built by [Piyush-Fr](https://github.com/Piyush-Fr)*

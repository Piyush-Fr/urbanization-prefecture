# Japan Prefecture Urbanization Analysis — Architecture

## 1. System Architecture Overview
The project uses a **Streamlit + FastAPI Hybrid** architecture. It strikes the best balance for rapid prototyping and providing an interactive web dashboard to showcase the ML pipeline, data exploration, and spatial diagnostics.

```text
┌─────────────────────────────────────────────────────────────────┐
│                        ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │   Frontend   │────▶│   Backend    │────▶│   ML Engine  │   │
│  │  (Streamlit) │     │  (FastAPI)   │     │  (Python)    │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
│        │                    │                    │              │
│        ▼                    ▼                    ▼              │
│  • Interactive         • REST API           • XGBoost Model   │
│    choropleths         • Model serving       • SHAP values      │
│  • LISA cluster        • Predictions        • Spatial weights │
│    maps                • SHAP endpoints     • Moran's I calc  │
│  • Feature             • Data endpoints     • Feature eng.    │
│    importance          • WebSocket for      • Cross-val results │
│  • Model comparison      live updates                             │
│  • Storytelling                                                 │
│    narrative                                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Tech Stack

| Category | Tools/Libraries | Version (Recommended) |
|----------|-----------------|----------------------|
| **Core Language** | Python | 3.10+ |
| **Data Manipulation** | pandas, numpy | pandas≥2.0, numpy≥1.24 |
| **Geospatial** | geopandas, shapely, pyproj, libpysal, esda | geopandas≥0.14, libpysal≥5.0 |
| **Machine Learning** | xgboost, scikit-learn, optuna | xgboost≥2.0, scikit-learn≥1.3 |
| **Spatial Statistics** | esda (Moran's I, LISA), spreg (spatial regression) | esda≥2.5, spreg≥1.2 |
| **Visualization (Static)** | matplotlib, seaborn, folium, contextily | matplotlib≥3.7, folium≥0.14 |
| **Data Download** | requests, kagglehub, ddgs | requests≥2.31, kagglehub≥0.3 |
| **Environment** | uv (preferred) / pip, venv | uv≥0.4 |
| **Notebook/IDE** | JupyterLab / VS Code | - |
| **Version Control** | git, git-lfs (for large GeoJSON) | - |
| **Web Framework** | streamlit, fastapi, uvicorn | - |

## 3. Project Structure

```
japan-urbanization-ml/
├── data/
│   ├── raw/                 # Raw downloaded datasets (Kaggle, e-Stat, GeoJSON)
│   └── processed/           # Normalized and merged datasets, engineered features, spatial weights
├── src/                     # Data processing scripts
├── web/                     # Web application
│   ├── backend/             # FastAPI app, API routes, inference, spatial logic
│   ├── frontend/            # Streamlit app, pages, interactive components
│   ├── shared/              # Shared config and constants
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
├── notebooks/               # Jupyter notebooks for EDA and model dev
├── models/                  # Saved XGBoost and other models
├── outputs/                 # Evaluation figures and prediction results
├── tests/                   # Unit/integration tests
├── requirements.txt
├── pyproject.toml
└── README.md
```

# Japan Prefecture Urbanization Analysis — Data Collection & Merging Procedures

> **Project**: ML Model for Japan Urbanization/Population Decline Analysis  
> **Approach**: XGBoost + Spatial Autocorrelation (Moran's I, Spatial Lag/Error Models)  
> **Target**: Prefecture-level population change classification (45/47 prefectures declining as of 2024)  
> **Last Updated**: 2026-07-24

---

## 🛠 Tech Stack

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

---

## 🌐 Modern Web UI Stack (Interactive Dashboard for Recruiters)

> **Goal**: Build a polished, interactive web dashboard to showcase the full ML pipeline — data exploration, model training, spatial diagnostics, predictions, and feature importance — with recruiter-friendly storytelling.

### Recommended Architecture Options

| Approach | Best For | Complexity | Deployment |
|----------|----------|------------|------------|
| **Streamlit** | Rapid prototyping, ML-focused dashboards, minimal frontend code | ⭐ Low | Streamlit Cloud, Hugging Face Spaces, Railway, Render |
| **Dash (Plotly)** | Production-grade, complex interactions, custom callbacks, enterprise | ⭐⭐ Medium | Heroku, AWS, Docker, Azure |
| **FastAPI + React/Vue/Svelte** | Full control, custom design, scalable API, portfolio showcase | ⭐⭐⭐ High | Vercel + Railway/Render, Docker, Kubernetes |
| **Marimo** | Reactive notebooks-as-apps, Git-friendly, modern alternative to Streamlit | ⭐ Low | Marimo Cloud, any static host |
| **Panel (HoloViz)** | Complex multi-page apps, Bokeh/HoloViews integration, parameterized | ⭐⭐ Medium | Panel serve, Bokeh server |

---

### 🎯 Recommended: **Streamlit + FastAPI Hybrid** (Best Balance)

```
┌─────────────────────────────────────────────────────────────────┐
│                        ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Frontend   │────▶│   Backend    │────▶│   ML Engine  │    │
│  │  (Streamlit) │     │  (FastAPI)   │     │  (Python)    │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│        │                    │                    │               │
│        ▼                    ▼                    ▼               │
│  • Interactive         • REST API           • XGBoost Model    │
│    choropleths         • Model serving       • SHAP values      │
│  • LISA cluster        • Predictions        • Spatial weights  │
│    maps                • SHAP endpoints     • Moran's I calc   │
│  • Feature             • Data endpoints     • Feature eng.     │
│    importance          • WebSocket for      • Cross-val results│
│  • Model comparison      live updates                              │
│  • Storytelling                                                 │
│    narrative                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 📦 Web UI Dependencies (Add to `uv add`)

```bash
# Core web framework
uv add streamlit fastapi uvicorn[standard] pydantic pydantic-settings

# Visualization for web
uv add plotly folium streamlit-folium pydeck altair vega_datasets

# ML serving & explanation
uv add shap mlflow optuna-streamlit

# State & caching
uv add streamlit-extras streamlit-aggrid streamlit-elements

# Deployment
uv add gunicorn python-multipart
```

---

### 🗂 Project Structure with Web UI

```
japan-urbanization-ml/
├── data/                          # (same as before)
├── src/                           # (same as before)
├── web/                           # ← NEW: Web application
│   ├── backend/
│   │   ├── main.py                # FastAPI app
│   │   ├── api/
│   │   │   ├── routes_predict.py  # /predict endpoint
│   │   │   ├── routes_shap.py     # /shap endpoint
│   │   │   ├── routes_data.py     # /data endpoint
│   │   │   └── routes_spatial.py  # /moran, /lisa endpoints
│   │   ├── models/
│   │   │   ├── loader.py          # Model loading utility
│   │   │   └── registry.py        # MLflow model registry
│   │   ├── services/
│   │   │   ├── prediction.py      # Inference logic
│   │   │   ├── explanation.py     # SHAP computation
│   │   │   └── spatial.py         # Moran's I, LISA
│   │   └── schemas.py             # Pydantic request/response models
│   │
│   ├── frontend/
│   │   ├── app.py                 # Streamlit main entry
│   │   ├── pages/
│   │   │   ├── 1_🏠_Overview.py           # Project story, problem, data
│   │   │   ├── 2_📊_Data_Explorer.py      # Interactive data exploration
│   │   │   ├── 3_🗺️_Spatial_Analysis.py   # Moran's I, LISA clusters
│   │   │   ├── 4_🤖_Model_Performance.py  # Metrics, CV results, comparison
│   │   │   ├── 5_🔍_Explainability.py     # SHAP, feature importance
│   │   │   ├── 6_🎯_Predictions.py        # Interactive prediction tool
│   │   │   └── 7_📈_Scenario_Simulator.py # What-if analysis
│   │   ├── components/
│   │   │   ├── maps.py            # Choropleth, LISA map components
│   │   │   ├── charts.py          # Plotly/Altair chart components
│   │   │   ├── cards.py           # Metric cards, info boxes
│   │   │   └── sidebar.py         # Navigation, filters
│   │   ├── utils/
│   │   │   ├── api_client.py      # FastAPI client
│   │   │   ├── data_loader.py     # Cached data loading
│   │   │   └── styling.py         # Custom CSS, theme
│   │   └── assets/
│   │       ├── styles.css         # Custom styling
│   │       └── favicon.ico
│   │
│   ├── shared/
│   │   ├── config.py              # Shared config (paths, constants)
│   │   └── constants.py           # Prefecture codes, regions, colors
│   │
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── requirements.txt
│   └── .streamlit/
│       └── config.toml            # Streamlit theme config
│
├── notebooks/                     # (same)
├── models/                        # (same)
├── outputs/                       # (same)
├── tests/                         # NEW: Unit/integration tests
├── requirements.txt
├── pyproject.toml
└── README.md
```

---

### 🎨 Streamlit Theme Config (`.streamlit/config.toml`)

```toml
[theme]
primaryColor = "#1E3A8A"           # Deep blue (Japan flag inspired)
backgroundColor = "#F8FAFC"        # Slate 50
secondaryBackgroundColor = "#FFFFFF"
textColor = "#1E293B"              # Slate 800
font = "sans serif"

[server]
headless = true
port = 8501
enableCORS = false
enableXsrfProtection = true

[browser]
gatherUsageStats = false

[runner]
magicEnabled = true
installTracer = false
```

---

### 🔧 FastAPI Backend Skeleton (`web/backend/main.py`)

```python
# web/backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import joblib
import pandas as pd
import geopandas as gpd
from pathlib import Path

from api.routes_predict import router as predict_router
from api.routes_shap import router as shap_router
from api.routes_data import router as data_router
from api.routes_spatial import router as spatial_router
from models.loader import ModelLoader
from shared.config import settings

# Global model loader
model_loader: ModelLoader = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model_loader
    # Startup: Load model, data, spatial weights
    model_loader = ModelLoader(settings.MODEL_PATH, settings.DATA_PATH)
    await model_loader.load()
    yield
    # Shutdown: cleanup
    model_loader = None

app = FastAPI(
    title="Japan Urbanization ML API",
    description="API for XGBoost + Spatial Autocorrelation model on Japan prefecture population decline",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for Streamlit frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8501", "https://your-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predict_router, prefix="/api/v1", tags=["Predictions"])
app.include_router(shap_router, prefix="/api/v1", tags=["Explainability"])
app.include_router(data_router, prefix="/api/v1", tags=["Data"])
app.include_router(spatial_router, prefix="/api/v1", tags=["Spatial Analysis"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model_loader is not None}

@app.get("/")
async def root():
    return {
        "message": "Japan Urbanization ML API",
        "docs": "/docs",
        "health": "/health",
    }
```

---

### 📊 Streamlit Frontend Skeleton (`web/frontend/app.py`)

```python
# web/frontend/app.py
import streamlit as st
from streamlit_extras.switch_page_button import switch_page
from streamlit_extras.colored_header import colored_header
from streamlit_extras.add_vertical_space import add_vertical_space

from utils.api_client import APIClient
from utils.data_loader import load_master_data, load_geojson
from components.sidebar import render_sidebar
from components.cards import render_metric_cards

# Page config
st.set_page_config(
    page_title="Japan Urbanization Analysis",
    page_icon="🗾",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS
with open("assets/styles.css") as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

# Initialize API client
@st.cache_resource
def get_api_client():
    return APIClient(base_url="http://localhost:8000")

api = get_api_client()

# Load data (cached)
@st.cache_data
def load_data():
    df = load_master_data("data/processed/master_features_engineered.csv")
    gdf = load_geojson("data/processed/master_features_engineered.geojson")
    return df, gdf

df, gdf = load_data()

# Sidebar
render_sidebar(df, gdf)

# Main navigation
PAGES = {
    "🏠 Overview": "pages/1_🏠_Overview.py",
    "📊 Data Explorer": "pages/2_📊_Data_Explorer.py",
    "🗺️ Spatial Analysis": "pages/3_🗺️_Spatial_Analysis.py",
    "🤖 Model Performance": "pages/4_🤖_Model_Performance.py",
    "🔍 Explainability": "pages/5_🔍_Explainability.py",
    "🎯 Predictions": "pages/6_🎯_Predictions.py",
    "📈 Scenario Simulator": "pages/7_📈_Scenario_Simulator.py",
}

# Render current page (using st.navigation in Streamlit 1.30+)
pg = st.navigation([st.Page(page, title=title) for title, page in PAGES.items()])
pg.run()
```

---

### 🗺️ Key Interactive Components

#### 1. **Interactive Choropleth Map** (`components/maps.py`)

```python
# components/maps.py
import folium
from streamlit_folium import st_folium
import geopandas as gpd
import pandas as pd
import json

def render_choropleth(gdf: gpd.GeoDataFrame, column: str, title: str, 
                       color_scheme: str = "RdYlBu_r", 
                       legend_title: str = None) -> dict:
    """Render interactive choropleth map with hover tooltips."""
    
    # Ensure WGS84
    if gdf.crs != "EPSG:4326":
        gdf = gdf.to_crs("EPSG:4326")
    
    # Create map centered on Japan
    m = folium.Map(
        location=[36.2048, 138.2529],
        zoom_start=5.5,
        tiles="CartoDB positron",
        control_scale=True,
    )
    
    # Prepare GeoJSON data
    geojson_data = json.loads(gdf.to_json())
    
    # Choropleth layer
    folium.Choropleth(
        geo_data=geojson_data,
        data=gdf,
        columns=["prefecture_en", column],
        key_on="feature.properties.prefecture_en",
        fill_color=color_scheme,
        fill_opacity=0.7,
        line_opacity=0.3,
        line_color="white",
        line_weight=1,
        legend_name=legend_title or column,
        nan_fill_color="lightgray",
    ).add_to(m)
    
    # Add hover tooltips with all features
    folium.GeoJson(
        geojson_data,
        style_function=lambda x: {"fillColor": "transparent", "color": "transparent"},
        highlight_function=lambda x: {"fillColor": "#ffff00", "fillOpacity": 0.3, "weight": 2},
        tooltip=folium.GeoJsonTooltip(
            fields=["prefecture_en", "region", column, "population_2024", 
                    "aging_rate_pct", "vacant_housing_rate_pct", "gdp_per_capita_jpy"],
            aliases=["Prefecture:", "Region:", f"{column}:", "Population 2024:", 
                     "Aging Rate %:", "Vacancy Rate %:", "GDP per Capita (¥):"],
            localize=True,
            sticky=True,
            labels=True,
            style="""
                background-color: #F8FAFC; border: 1px solid #1E3A8A; 
                border-radius: 4px; padding: 8px; font-family: sans-serif;
            """,
        ),
    ).add_to(m)
    
    # Add prefecture labels
    for idx, row in gdf.iterrows():
        if row.geometry.centroid.is_valid:
            folium.Marker(
                location=[row.geometry.centroid.y, row.geometry.centroid.x],
                icon=folium.DivIcon(
                    html=f"""<div style="font-size: 10px; font-weight: bold; 
                          color: #1E293B; text-shadow: 1px 1px 2px white;">
                          {row['prefecture_en']}</div>""",
                ),
            ).add_to(m)
    
    return st_folium(m, width="100%", height=500, returned_objects=["last_active_drawing"])
```

#### 2. **LISA Cluster Map** (`components/maps.py` continued)

```python
def render_lisa_map(gdf: gpd.GeoDataFrame, lisa_results: dict, 
                    title: str = "Local Moran's I Clusters") -> dict:
    """Render LISA cluster map with 4 quadrant colors."""
    
    # Cluster color mapping
    cluster_colors = {
        "HH": "#D73027",  # High-High (Red)
        "LL": "#4575B4",  # Low-Low (Blue)
        "HL": "#F46D43",  # High-Low (Orange)
        "LH": "#74ADD1",  # Low-High (Light Blue)
        "NS": "#F7F7F7",  # Not Significant (Gray)
    }
    
    cluster_labels = {
        "HH": "High-High 🔴", "LL": "Low-Low 🔵",
        "HL": "High-Low 🟠", "LH": "Low-High 🔵",
        "NS": "Not Significant ⚪",
    }
    
    if gdf.crs != "EPSG:4326":
        gdf = gdf.to_crs("EPSG:4326")
    
    m = folium.Map(location=[36.2048, 138.2529], zoom_start=5.5, tiles="CartoDB positron")
    
    # Style function for clusters
    def style_function(feature):
        cluster = feature["properties"].get("lisa_cluster", "NS")
        return {
            "fillColor": cluster_colors.get(cluster, "#F7F7F7"),
            "fillOpacity": 0.8,
            "color": "white",
            "weight": 1.5,
        }
    
    folium.GeoJson(
        json.loads(gdf.to_json()),
        style_function=style_function,
        tooltip=folium.GeoJsonTooltip(
            fields=["prefecture_en", "region", "target_pop_change_pct", "lisa_cluster", "lisa_p_value"],
            aliases=["Prefecture:", "Region:", "Pop Change %:", "Cluster:", "P-value:"],
        ),
    ).add_to(m)
    
    # Custom legend
    legend_html = f"""
    <div style="position: fixed; bottom: 50px; left: 50px; z-index: 1000;
                background: white; padding: 12px; border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-family: sans-serif;">
        <b>{title}</b><br>
    """
    for cluster, color in cluster_colors.items():
        if cluster != "NS":
            legend_html += f'<i style="background:{color}; width: 18px; height: 18px; display: inline-block; margin-right: 8px; border: 1px solid #ccc;"></i>{cluster_labels[cluster]}<br>'
    legend_html += "</div>"
    m.get_root().html.add_child(folium.Element(legend_html))
    
    return st_folium(m, width="100%", height=500)
```

#### 3. **SHAP Feature Importance** (`components/charts.py`)

```python
# components/charts.py
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np

def render_shap_summary(shap_values: np.ndarray, feature_names: list, 
                         max_display: int = 15) -> go.Figure:
    """Render SHAP beeswarm/summary plot."""
    
    # Mean absolute SHAP values
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    importance_df = pd.DataFrame({
        "feature": feature_names,
        "importance": mean_abs_shap
    }).sort_values("importance", ascending=True).tail(max_display)
    
    # Beeswarm-style: create scatter for each feature
    fig = go.Figure()
    
    for i, feat in enumerate(importance_df["feature"]):
        idx = feature_names.index(feat)
        vals = shap_values[:, idx]
        
        # Jitter for beeswarm effect
        y = np.full_like(vals, i) + np.random.uniform(-0.3, 0.3, len(vals))
        
        fig.add_trace(go.Scatter(
            x=vals, y=y,
            mode="markers",
            marker=dict(
                size=4,
                color=vals,
                colorscale="RdBu",
                cmin=-vals.max(),
                cmax=vals.max(),
                showscale=False,
                opacity=0.6,
            ),
            name=feat,
            showlegend=False,
            hovertemplate=f"<b>{feat}</b><br>SHAP: %{{x:.3f}}<extra></extra>",
        ))
    
    fig.update_layout(
        title="SHAP Feature Importance (Beeswarm)",
        xaxis_title="SHAP Value (Impact on Model Output)",
        yaxis=dict(
            tickmode="array",
            tickvals=list(range(len(importance_df))),
            ticktext=importance_df["feature"].tolist(),
        ),
        height=500,
        margin=dict(l=200, r=50, t=50, b=50),
        template="plotly_white",
    )
    
    return fig

def render_shap_dependence(shap_values: np.ndarray, X: pd.DataFrame,
                            feature: str, interaction_feature: str = None) -> go.Figure:
    """SHAP dependence plot."""
    idx = X.columns.get_loc(feature)
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=X[feature],
        y=shap_values[:, idx],
        mode="markers",
        marker=dict(
            size=6,
            color=X[interaction_feature] if interaction_feature else "#1E3A8A",
            colorscale="Viridis" if interaction_feature else None,
            showscale=bool(interaction_feature),
            colorbar=dict(title=interaction_feature) if interaction_feature else None,
        ),
        hovertemplate=f"<b>{feature}</b>: %{{x}}<br>SHAP: %{{y:.3f}}<extra></extra>",
    ))
    
    fig.update_layout(
        title=f"SHAP Dependence: {feature}",
        xaxis_title=feature,
        yaxis_title="SHAP Value",
        template="plotly_white",
        height=400,
    )
    return fig
```

---

### 🚀 Deployment Configurations

#### Docker Compose (`web/docker-compose.yml`)

```yaml
version: "3.9"

services:
  backend:
    build:
      context: ./web
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    environment:
      - MODEL_PATH=/app/models/xgboost_model.pkl
      - DATA_PATH=/app/data/processed
    volumes:
      - ../models:/app/models:ro
      - ../data/processed:/app/data/processed:ro
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./web
      dockerfile: Dockerfile.frontend
    ports:
      - "8501:8501"
    environment:
      - API_BASE_URL=http://backend:8000/api/v1
    depends_on:
      backend:
        condition: service_healthy
    volumes:
      - ../data/processed:/app/data/processed:ro

  # Optional: MLflow tracking
  mlflow:
    image: ghcr.io/mlflow/mlflow:v2.12.0
    ports:
      - "5000:5000"
    command: mlflow server --host 0.0.0.0 --port 5000
    volumes:
      - mlflow_data:/mlflow

volumes:
  mlflow_data:
```

#### Backend Dockerfile (`web/Dockerfile.backend`)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# System deps for geopandas
RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin libgdal-dev libspatialindex-dev \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./backend ./backend
COPY ./shared ./shared

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Frontend Dockerfile (`web/Dockerfile.frontend`)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements-frontend.txt .
RUN pip install --no-cache-dir -r requirements-frontend.txt

COPY ./frontend ./frontend
COPY ./shared ./shared
COPY ./assets ./assets
COPY .streamlit .streamlit

EXPOSE 8501

CMD ["streamlit", "run", "frontend/app.py", "--server.address=0.0.0.0", "--server.port=8501"]
```

---

### 📱 Mobile-Responsive Design Tips

```css
/* web/frontend/assets/styles.css */
@media (max-width: 768px) {
    .main .block-container {
        padding-left: 1rem;
        padding-right: 1rem;
    }
    
    /* Stack metric cards vertically */
    [data-testid="column"] {
        width: 100% !important;
        flex: 1 1 100% !important;
    }
    
    /* Full-width maps */
    .stFolium {
        width: 100% !important;
    }
    
    /* Compact sidebar */
    section[data-testid="stSidebar"] {
        width: 280px !important;
    }
}

/* Custom metric cards */
.metric-card {
    background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
    transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(30, 58, 138, 0.4);
}

.metric-card h3 { margin: 0; font-size: 0.875rem; opacity: 0.9; }
.metric-card .value { font-size: 2rem; font-weight: 700; margin: 0.5rem 0; }
.metric-card .delta { font-size: 0.875rem; opacity: 0.8; }

/* Storytelling narrative sections */
.narrative-section {
    background: #F8FAFC;
    border-left: 4px solid #1E3A8A;
    padding: 1.5rem;
    margin: 1.5rem 0;
    border-radius: 0 12px 12px 0;
}

.narrative-section h3 { color: #1E3A8A; margin-top: 0; }

### Environment Setup (Recommended: `uv`)
```bash
# Install uv (fast Python package manager)
pip install uv

# Create project environment
uv init japan-urbanization-ml
cd japan-urbanization-ml

# Install core dependencies
uv add pandas numpy geopandas xgboost scikit-learn optuna \
       libpysal esda spreg matplotlib seaborn folium contextily \
       requests kagglehub ddgs jupyterlab

# For geopandas on Windows (if issues):
# uv add pyogrio fiona  # pyogrio is faster backend
```

---

## 📊 Data Sources Overview

| Tier | Source | Dataset | Format | Access Method | Priority |
|------|--------|---------|--------|---------------|----------|
| 1 | **Kaggle** | Japan Population (1870–2015) | CSV | `kagglehub` / direct download | ⭐⭐⭐ Start Here |
| 1 | **Kaggle** | Japan Prefecture GDP | CSV | `kagglehub` / direct download | ⭐⭐⭐ Start Here |
| 2 | **e-Stat** | Population Estimates 2020–2024 | Excel (.xlsx) | Direct download / API | ⭐⭐⭐ Critical |
| 2 | **e-Stat** | Aging Rate (% 65+) by Prefecture | Excel | Direct download | ⭐⭐⭐ Critical |
| 2 | **e-Stat** | Vacant Housing Rate (Akiya) 2023 | Excel | Direct download | ⭐⭐⭐ Critical |
| 2 | **e-Stat** | Net Migration Rate by Prefecture | Excel | Direct download | ⭐⭐ High |
| 3 | **GeoJSON** | Japan Prefecture Boundaries (47) | GeoJSON | GitHub / GADM / Geodata | ⭐⭐⭐ Critical |
| 3 | **World Bank** | Japan National Indicators | CSV | API / direct | ⭐ Low (context only) |

---

## 📥 Procedure 1: Kaggle Datasets (Fastest Start)

### 1.1 Japan Population Dataset (1870–2015)
**Source**: `https://www.kaggle.com/datasets/jd1325/japan-population-data`  
**Records**: ~2,632 | **Columns**: prefecture, year, population, capital, region, estimated_area

```python
# download_kaggle_population.py
import kagglehub
import pandas as pd
from pathlib import Path

# Download dataset (auto-caches to ~/.cache/kagglehub)
path = kagglehub.dataset_download("jd1325/japan-population-data")
print(f"Downloaded to: {path}")

# Find CSV file
csv_files = list(Path(path).glob("*.csv"))
df_pop = pd.read_csv(csv_files[0])
print(df_pop.head())
print(df_pop.columns.tolist())
print(f"Shape: {df_pop.shape}")
print(f"Years: {df_pop['year'].min()}–{df_pop['year'].max()}")
print(f"Prefectures: {df_pop['prefecture'].nunique()}")

# Save to project data/raw
out_dir = Path("data/raw")
out_dir.mkdir(parents=True, exist_ok=True)
df_pop.to_csv(out_dir / "kaggle_japan_population_1870_2015.csv", index=False)
print(f"Saved to {out_dir / 'kaggle_japan_population_1870_2015.csv'}")
```

**Run**:
```bash
python download_kaggle_population.py
```

---

### 1.2 Japan Prefecture GDP Dataset
**Source**: `https://www.kaggle.com/datasets/mathurinache/list-of-japanese-prefectures-by-gdp`  
**Records**: 47 (one per prefecture) | **Columns**: prefecture, gdp_millions_jpy, gdp_usd_ppp, gdp_share, rank

```python
# download_kaggle_gdp.py
import kagglehub
import pandas as pd
from pathlib import Path

path = kagglehub.dataset_download("mathurinache/list-of-japanese-prefectures-by-gdp")
print(f"Downloaded to: {path}")

csv_files = list(Path(path).glob("*.csv"))
df_gdp = pd.read_csv(csv_files[0])
print(df_gdp.head())
print(df_gdp.columns.tolist())
print(f"Shape: {df_gdp.shape}")

out_dir = Path("data/raw")
df_gdp.to_csv(out_dir / "kaggle_japan_prefecture_gdp.csv", index=False)
print(f"Saved to {out_dir / 'kaggle_japan_prefecture_gdp.csv'}")
```

**Run**:
```bash
python download_kaggle_gdp.py
```

---

## 📥 Procedure 2: e-Stat (Official Japanese Government Statistics)

> **Note**: e-Stat requires navigating Japanese interface. Use English version: `https://www.e-stat.go.jp/en`

### 2.1 Population Estimates (2020–2024) — Annual, by Prefecture
**URL**: `https://www.stat.go.jp/english/data/jinsui/2.html` → "Population Estimates" → Download Excel

**Manual Download Steps**:
1. Open: `https://www.stat.go.jp/english/data/jinsui/2.html`
2. Click **"Population Estimates by Prefecture"** (latest year)
3. Download Excel file (usually named `population_estimates_prefecture_YYYY.xlsx`)
4. Repeat for years 2020, 2021, 2022, 2023, 2024
5. Save to `data/raw/estat/`

**Automated Download (if direct links stable)**:
```python
# download_estat_population.py
import requests
from pathlib import Path
import pandas as pd

# Known stable URLs (verify on e-Stat first)
urls = {
    2020: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000032000000&fileKind=0",
    2021: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000032000001&fileKind=0",
    2022: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000032000002&fileKind=0",
    2023: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000032000003&fileKind=0",
    2024: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000032000004&fileKind=0",
}

out_dir = Path("data/raw/estat")
out_dir.mkdir(parents=True, exist_ok=True)

for year, url in urls.items():
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        filepath = out_dir / f"population_estimates_{year}.xlsx"
        filepath.write_bytes(resp.content)
        print(f"Downloaded {year}: {filepath}")
    except Exception as e:
        print(f"Failed {year}: {e}")
        print(f"  → Manual download needed: {url}")
```

---

### 2.2 Aging Rate (% Population 65+) by Prefecture
**URL**: `https://www.e-stat.go.jp/en/stat-search/files?toukei=00200521` (Social Security / Population)
**Search**: "aging rate prefecture" → "Ratio of Population Aged 65 and Over by Prefecture"

```python
# download_estat_aging.py
import requests
from pathlib import Path

url = "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000032000010&fileKind=0"
out_dir = Path("data/raw/estat")
out_dir.mkdir(parents=True, exist_ok=True)

resp = requests.get(url, timeout=30)
resp.raise_for_status()
filepath = out_dir / "aging_rate_by_prefecture.xlsx"
filepath.write_bytes(resp.content)
print(f"Saved: {filepath}")
```

---

### 2.3 Vacant Housing Rate (Akiya) by Prefecture — 2023 Survey
**URL**: `https://www.e-stat.go.jp/en/stat-search/files?toukei=00200522` (Housing and Land Survey)
**Key Stat**: "Vacancy Rate by Prefecture" — Wakayama 21.2%, Tokushima 21.2%, Kagoshima 20.4%, Kochi 20.3%, Ehime 20.1%

```python
# download_estat_vacant_housing.py
import requests
from pathlib import Path

url = "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000032000020&fileKind=0"
out_dir = Path("data/raw/estat")
out_dir.mkdir(parents=True, exist_ok=True)

resp = requests.get(url, timeout=30)
resp.raise_for_status()
filepath = out_dir / "vacant_housing_rate_2023.xlsx"
filepath.write_bytes(resp.content)
print(f"Saved: {filepath}")
```

---

### 2.4 Net Migration Rate by Prefecture
**URL**: `https://www.e-stat.go.jp/en/regional-statistics/ssdsview/prefectures` → "Population Migration"
**Measures**: Inflow/outflow for work/school — perfect for urban pull measurement

```python
# download_estat_migration.py
import requests
from pathlib import Path

url = "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000032000030&fileKind=0"
out_dir = Path("data/raw/estat")
out_dir.mkdir(parents=True, exist_ok=True)

resp = requests.get(url, timeout=30)
resp.raise_for_status()
filepath = out_dir / "net_migration_rate_prefecture.xlsx"
filepath.write_bytes(resp.content)
print(f"Saved: {filepath}")
```

---

## 📥 Procedure 3: Prefecture Boundaries (GeoJSON)

### Option A: GeoJSON from GitHub (Recommended — clean, 47 prefectures)
```python
# download_geojson.py
import requests
from pathlib import Path
import geopandas as gpd

# Source: https://github.com/dataofjapan/geojson (well-maintained)
url = "https://raw.githubusercontent.com/dataofjapan/geojson/master/prefectures.geojson"

out_dir = Path("data/raw/geospatial")
out_dir.mkdir(parents=True, exist_ok=True)

resp = requests.get(url, timeout=30)
resp.raise_for_status()
filepath = out_dir / "japan_prefectures.geojson"
filepath.write_bytes(resp.content)

# Verify load
gdf = gpd.read_file(filepath)
print(f"Loaded: {len(gdf)} prefectures")
print(f"Columns: {gdf.columns.tolist()}")
print(f"CRS: {gdf.crs}")
print(gdf.head())
```

### Option B: GADM (Global Administrative Areas) — Higher Detail
```bash
# Download from https://gadm.org/download_country.html → Japan → GeoJSON
# Level 1 = Prefectures
```

### Option C: Natural Earth (Simpler geometries)
```python
import geopandas as gpd
url = "https://naciscdn.org/naturalearth/110m/cultural/ne_110m_admin_1_states_provinces.zip"
# Filter for Japan (admin = "Japan")
```

---

## 📥 Procedure 4: World Bank (Optional Context Data)

```python
# download_worldbank.py
import pandas as pd
from pathlib import Path

# World Bank API for Japan indicators
indicators = {
    "SP.POP.TOTL": "total_population",
    "SP.URB.TOTL.IN.ZS": "urban_population_pct",
    "NY.GDP.MKTP.CD": "gdp_current_usd",
    "SP.DYN.LE00.IN": "life_expectancy",
}

url = "https://api.worldbank.org/v2/country/JPN/indicator/{indicator}?format=json&per_page=100"

out_dir = Path("data/raw/worldbank")
out_dir.mkdir(parents=True, exist_ok=True)

for code, name in indicators.items():
    import requests
    resp = requests.get(url.format(indicator=code), timeout=30)
    data = resp.json()[1]  # [0] is metadata, [1] is data
    df = pd.DataFrame(data)[['date', 'value']].rename(columns={'date': 'year', 'value': name})
    df.to_csv(out_dir / f"wb_{name}.csv", index=False)
    print(f"Saved: {name}")
```

---

## 🔧 Procedure 5: Data Inspection & Schema Understanding

Run this **after all downloads** to understand each dataset:

```python
# inspect_all_data.py
import pandas as pd
from pathlib import Path

raw_dir = Path("data/raw")

for csv_file in raw_dir.rglob("*.csv"):
    print(f"\n{'='*60}")
    print(f"FILE: {csv_file.relative_to(raw_dir)}")
    print(f"{'='*60}")
    df = pd.read_csv(csv_file)
    print(f"Shape: {df.shape}")
    print(f"Columns: {df.columns.tolist()}")
    print(f"Dtypes:\n{df.dtypes}")
    print(f"Sample:\n{df.head(3)}")
    print(f"Nulls:\n{df.isnull().sum()}")

for xlsx_file in raw_dir.rglob("*.xlsx"):
    print(f"\n{'='*60}")
    print(f"FILE: {xlsx_file.relative_to(raw_dir)}")
    print(f"{'='*60}")
    xls = pd.ExcelFile(xlsx_file)
    print(f"Sheets: {xls.sheet_names}")
    for sheet in xls.sheet_names[:2]:  # First 2 sheets
        df = pd.read_excel(xlsx_file, sheet_name=sheet, nrows=5)
        print(f"\nSheet: {sheet}")
        print(f"Columns: {df.columns.tolist()}")
        print(df)

# GeoJSON
import geopandas as gpd
gdf = gpd.read_file(raw_dir / "geospatial" / "japan_prefectures.geojson")
print(f"\nGeoJSON: {len(gdf)} prefectures")
print(f"Columns: {gdf.columns.tolist()}")
print(f"CRS: {gdf.crs}")
print(gdf[['name', 'name_en', 'geometry']].head())
```

---

## 🔗 Procedure 6: Prefecture Name Standardization (CRITICAL)

**Problem**: Each source uses different naming conventions:
- Kaggle: `"Hokkaido"`, `"Tokyo"`, `"Osaka"`
- e-Stat (Japanese): `"北海道"`, `"東京都"`, `"大阪府"`
- GeoJSON: `"Hokkaido"`, `"Tokyo"`, `"Osaka"` (or Japanese)
- World Bank: `"Japan"` (national only)

### 6.1 Create Master Prefecture Mapping

```python
# create_prefecture_mapping.py
import pandas as pd
from pathlib import Path

# Master mapping: all 47 prefectures
PREFECTURE_MAPPING = {
    # Hokkaido Region
    "北海道": {"en": "Hokkaido", "region": "Hokkaido", "pref_code": 1},
    # Tohoku Region
    "青森県": {"en": "Aomori", "region": "Tohoku", "pref_code": 2},
    "岩手県": {"en": "Iwate", "region": "Tohoku", "pref_code": 3},
    "宮城県": {"en": "Miyagi", "region": "Tohoku", "pref_code": 4},
    "秋田県": {"en": "Akita", "region": "Tohoku", "pref_code": 5},
    "山形県": {"en": "Yamagata", "region": "Tohoku", "pref_code": 6},
    "福島県": {"en": "Fukushima", "region": "Tohoku", "pref_code": 7},
    # Kanto Region
    "茨城県": {"en": "Ibaraki", "region": "Kanto", "pref_code": 8},
    "栃木県": {"en": "Tochigi", "region": "Kanto", "pref_code": 9},
    "群馬県": {"en": "Gunma", "region": "Kanto", "pref_code": 10},
    "埼玉県": {"en": "Saitama", "region": "Kanto", "pref_code": 11},
    "千葉県": {"en": "Chiba", "region": "Kanto", "pref_code": 12},
    "東京都": {"en": "Tokyo", "region": "Kanto", "pref_code": 13},
    "神奈川県": {"en": "Kanagawa", "region": "Kanto", "pref_code": 14},
    # Chubu Region
    "新潟県": {"en": "Niigata", "region": "Chubu", "pref_code": 15},
    "富山県": {"en": "Toyama", "region": "Chubu", "pref_code": 16},
    "石川県": {"en": "Ishikawa", "region": "Chubu", "pref_code": 17},
    "福井県": {"en": "Fukui", "region": "Chubu", "pref_code": 18},
    "山梨県": {"en": "Yamanashi", "region": "Chubu", "pref_code": 19},
    "長野県": {"en": "Nagano", "region": "Chubu", "pref_code": 20},
    "岐阜県": {"en": "Gifu", "region": "Chubu", "pref_code": 21},
    "静岡県": {"en": "Shizuoka", "region": "Chubu", "pref_code": 22},
    "愛知県": {"en": "Aichi", "region": "Chubu", "pref_code": 23},
    # Kansai Region
    "三重県": {"en": "Mie", "region": "Kansai", "pref_code": 24},
    "滋賀県": {"en": "Shiga", "region": "Kansai", "pref_code": 25},
    "京都府": {"en": "Kyoto", "region": "Kansai", "pref_code": 26},
    "大阪府": {"en": "Osaka", "region": "Kansai", "pref_code": 27},
    "兵庫県": {"en": "Hyogo", "region": "Kansai", "pref_code": 28},
    "奈良県": {"en": "Nara", "region": "Kansai", "pref_code": 29},
    "和歌山県": {"en": "Wakayama", "region": "Kansai", "pref_code": 30},
    # Chugoku Region
    "鳥取県": {"en": "Tottori", "region": "Chugoku", "pref_code": 31},
    "島根県": {"en": "Shimane", "region": "Chugoku", "pref_code": 32},
    "岡山県": {"en": "Okayama", "region": "Chugoku", "pref_code": 33},
    "広島県": {"en": "Hiroshima", "region": "Chugoku", "pref_code": 34},
    "山口県": {"en": "Yamaguchi", "region": "Chugoku", "pref_code": 35},
    # Shikoku Region
    "徳島県": {"en": "Tokushima", "region": "Shikoku", "pref_code": 36},
    "香川県": {"en": "Kagawa", "region": "Shikoku", "pref_code": 37},
    "愛媛県": {"en": "Ehime", "region": "Shikoku", "pref_code": 38},
    "高知県": {"en": "Kochi", "region": "Shikoku", "pref_code": 39},
    # Kyushu Region
    "福岡県": {"en": "Fukuoka", "region": "Kyushu", "pref_code": 40},
    "佐賀県": {"en": "Saga", "region": "Kyushu", "pref_code": 41},
    "長崎県": {"en": "Nagasaki", "region": "Kyushu", "pref_code": 42},
    "熊本県": {"en": "Kumamoto", "region": "Kyushu", "pref_code": 43},
    "大分県": {"en": "Oita", "region": "Kyushu", "pref_code": 44},
    "宮崎県": {"en": "Miyazaki", "region": "Kyushu", "pref_code": 45},
    "鹿児島県": {"en": "Kagoshima", "region": "Kyushu", "pref_code": 46},
    "沖縄県": {"en": "Okinawa", "region": "Kyushu", "pref_code": 47},
}

# Create lookup DataFrames
df_mapping = pd.DataFrame([
    {"pref_jp": jp, "pref_en": v["en"], "region": v["region"], "pref_code": v["pref_code"]}
    for jp, v in PREFECTURE_MAPPING.items()
])

# Save mapping
out_dir = Path("data/processed")
out_dir.mkdir(parents=True, exist_ok=True)
df_mapping.to_csv(out_dir / "prefecture_mapping.csv", index=False)
print(f"Saved mapping: {out_dir / 'prefecture_mapping.csv'}")
print(df_mapping.head(10))
```

---

### 6.2 Normalize Each Dataset to English Names

```python
# normalize_datasets.py
import pandas as pd
from pathlib import Path

mapping = pd.read_csv("data/processed/prefecture_mapping.csv")
jp_to_en = dict(zip(mapping["pref_jp"], mapping["pref_en"]))
en_to_jp = dict(zip(mapping["pref_en"], mapping["pref_jp"]))

def normalize_prefecture_names(df, source_col, target_col="prefecture_en"):
    """Map Japanese prefecture names to standard English names."""
    df = df.copy()
    df[target_col] = df[source_col].map(jp_to_en)
    # Handle already-English names
    mask = df[target_col].isna()
    df.loc[mask, target_col] = df.loc[mask, source_col]
    return df

# Apply to each dataset
raw_dir = Path("data/raw")
proc_dir = Path("data/processed")
proc_dir.mkdir(parents=True, exist_ok=True)

# 1. Kaggle Population
df_pop = pd.read_csv(raw_dir / "kaggle_japan_population_1870_2015.csv")
df_pop = normalize_prefecture_names(df_pop, "prefecture")
df_pop.to_csv(proc_dir / "population_normalized.csv", index=False)
print(f"Population: {df_pop['prefecture_en'].nunique()} unique prefectures")

# 2. Kaggle GDP
df_gdp = pd.read_csv(raw_dir / "kaggle_japan_prefecture_gdp.csv")
# Check column name for prefecture
pref_col = [c for c in df_gdp.columns if 'prefect' in c.lower() or 'region' in c.lower()][0]
df_gdp = normalize_prefecture_names(df_gdp, pref_col)
df_gdp.to_csv(proc_dir / "gdp_normalized.csv", index=False)
print(f"GDP: {df_gdp['prefecture_en'].nunique()} unique prefectures")

# 3. e-Stat Aging Rate (after reading Excel)
# df_aging = pd.read_excel(raw_dir / "estat" / "aging_rate_by_prefecture.xlsx", ...)
# df_aging = normalize_prefecture_names(df_aging, "prefecture_jp_column")
# df_aging.to_csv(proc_dir / "aging_rate_normalized.csv", index=False)

print("Normalization complete. Check for NaN in prefecture_en column!")
```

---

## 🔀 Procedure 7: Merge Core Datasets (4 Main + Spatial)

### 7.1 Create Master Prefecture Panel (2020–2024)

```python
# merge_core_datasets.py
import pandas as pd
import geopandas as gpd
from pathlib import Path

proc_dir = Path("data/processed")
proc_dir.mkdir(parents=True, exist_ok=True)

# Load normalized datasets
df_pop = pd.read_csv(proc_dir / "population_normalized.csv")  # Has year column
df_gdp = pd.read_csv(proc_dir / "gdp_normalized.csv")         # Single year (latest)
df_aging = pd.read_csv(proc_dir / "aging_rate_normalized.csv") # 2024
df_vacant = pd.read_csv(proc_dir / "vacant_housing_normalized.csv") # 2023
df_migration = pd.read_csv(proc_dir / "migration_normalized.csv")   # 2020-2024

# Load GeoJSON
gdf = gpd.read_file("data/raw/geospatial/japan_prefectures.geojson")
gdf = gdf.rename(columns={"name_en": "prefecture_en"})  # Adjust to match GeoJSON column

# ============================================================
# TARGET VARIABLE: Population Change Rate 2020→2024
# ============================================================
pop_2020 = df_pop[df_pop["year"] == 2020].set_index("prefecture_en")["population"]
pop_2024 = df_pop[df_pop["year"] == 2024].set_index("prefecture_en")["population"]

pop_change = ((pop_2024 - pop_2020) / pop_2020 * 100).rename("pop_change_pct_2020_2024")
print("Population change 2020-2024:")
print(pop_change.sort_values())

# ============================================================
# BUILD FEATURE MATRIX (one row per prefecture, latest year)
# ============================================================
features = pd.DataFrame(index=pop_change.index)
features["target_pop_change_pct"] = pop_change

# GDP per capita (latest)
gdp_latest = df_gdp.set_index("prefecture_en")["gdp_per_capita_jpy"]
features["gdp_per_capita_jpy"] = gdp_latest

# Aging rate (2024)
features["aging_rate_pct"] = df_aging.set_index("prefecture_en")["aging_rate_pct"]

# Vacant housing rate (2023)
features["vacant_housing_rate_pct"] = df_vacant.set_index("prefecture_en")["vacancy_rate_pct"]

# Net migration rate (avg 2020-2024)
migration_avg = df_migration.groupby("prefecture_en")["net_migration_rate"].mean()
features["net_migration_rate_avg"] = migration_avg

# Population 2024 (base)
features["population_2024"] = pop_2024

# Region
features["region"] = df_pop.drop_duplicates("prefecture_en").set_index("prefecture_en")["region"]

# Distance to Tokyo (approximate, from centroid)
import numpy as np
tokyo_centroid = gdf[gdf["prefecture_en"] == "Tokyo"].geometry.centroid.iloc[0]
features["dist_to_tokyo_km"] = gdf.set_index("prefecture_en").geometry.centroid.distance(tokyo_centroid) / 1000

# Coastal dummy
features["is_coastal"] = gdf.set_index("prefecture_en").geometry.apply(
    lambda geom: not geom.touches(gdf.unary_union)  # Simplified
).astype(int)

print(f"\nFeature matrix shape: {features.shape}")
print(features.head())
print(f"\nMissing values:\n{features.isnull().sum()}")

# Save
features.to_csv(proc_dir / "master_features.csv")
print(f"\nSaved: {proc_dir / 'master_features.csv'}")

# Save GeoDataFrame with features merged
gdf_merged = gdf.set_index("prefecture_en").join(features)
gdf_merged.to_file(proc_dir / "master_features.geojson", driver="GeoJSON")
print(f"Saved GeoJSON: {proc_dir / 'master_features.geojson'}")
```

---

## 🧮 Procedure 8: Feature Engineering for XGBoost + Spatial Models

```python
# feature_engineering.py
import pandas as pd
import numpy as np
from pathlib import Path
import geopandas as gpd
from libpysal.weights import Queen, KNN, DistanceBand
from esda.moran import Moran

proc_dir = Path("data/processed")
df = pd.read_csv(proc_dir / "master_features.csv", index_col=0)
gdf = gpd.read_file(proc_dir / "master_features.geojson")

# ============================================================
# SPATIAL WEIGHTS MATRICES
# ============================================================
# Queen contiguity (shared border)
w_queen = Queen.from_dataframe(gdf)
w_queen.transform = 'r'  # Row-standardized

# K-nearest neighbors (k=4)
w_knn = KNN.from_dataframe(gdf, k=4)
w_knn.transform = 'r'

# Distance band (e.g., 300km threshold)
w_dist = DistanceBand.from_dataframe(gdf, threshold=300000, binary=True)
w_dist.transform = 'r'

# Save weights for later use
import pickle
with open(proc_dir / "spatial_weights.pkl", "wb") as f:
    pickle.dump({"queen": w_queen, "knn4": w_knn, "dist300": w_dist}, f)

# ============================================================
# SPATIAL LAG FEATURES (for XGBoost)
# ============================================================
for var in ["aging_rate_pct", "vacant_housing_rate_pct", "gdp_per_capita_jpy", 
            "net_migration_rate_avg", "population_2024"]:
    lag_var = f"{var}_lag_queen"
    df[lag_var] = w_queen.sparse @ df[var].values

# ============================================================
# INTERACTION TERMS
# ============================================================
df["aging_x_vacant"] = df["aging_rate_pct"] * df["vacant_housing_rate_pct"]
df["gdp_x_migration"] = df["gdp_per_capita_jpy"] * df["net_migration_rate_avg"]
df["pop_x_dist_tokyo"] = df["population_2024"] * df["dist_to_tokyo_km"]

# ============================================================
# LAGGED POPULATION FEATURES (from historical data)
# ============================================================
df_pop_hist = pd.read_csv(proc_dir / "population_normalized.csv")
# Pivot to wide format: prefecture x year
pop_wide = df_pop_hist.pivot_table(index="prefecture_en", columns="year", values="population")
pop_wide.columns = [f"pop_{int(c)}" for c in pop_wide.columns]

# Compute growth rates for recent periods
for y1, y2 in [(2010, 2015), (2015, 2020), (2020, 2024)]:
    if f"pop_{y1}" in pop_wide.columns and f"pop_{y2}" in pop_wide.columns:
        df[f"pop_growth_{y1}_{y2}"] = (pop_wide[f"pop_{y2}"] - pop_wide[f"pop_{y1}"]) / pop_wide[f"pop_{y1}"] * 100

# Merge back
df = df.join(pop_wide, how="left")

# ============================================================
# TARGET ENCODING FOR REGION
# ============================================================
region_target_mean = df.groupby("region")["target_pop_change_pct"].mean()
df["region_target_encoded"] = df["region"].map(region_target_mean)

# ============================================================
# MORAN'S I ON TARGET (Diagnostic)
# ============================================================
moran = Moran(df["target_pop_change_pct"].dropna().values, w_queen)
print(f"Moran's I (target): {moran.I:.4f}, p-value: {moran.p_sim:.4f}")

# Save enhanced features
df.to_csv(proc_dir / "master_features_engineered.csv")
gdf_enhanced = gdf.set_index("prefecture_en").join(df)
gdf_enhanced.to_file(proc_dir / "master_features_engineered.geojson", driver="GeoJSON")

print(f"\nFinal feature count: {df.shape[1]}")
print(f"Features: {df.columns.tolist()}")
```

---

## ✅ Procedure 9: Data Validation & Quality Checks

```python
# validate_data.py
import pandas as pd
import geopandas as gpd
from pathlib import Path

proc_dir = Path("data/processed")
df = pd.read_csv(proc_dir / "master_features_engineered.csv", index_col=0)
gdf = gpd.read_file(proc_dir / "master_features_engineered.geojson")

print("=" * 60)
print("DATA VALIDATION REPORT")
print("=" * 60)

# 1. Completeness
print(f"\n1. COMPLETENESS")
print(f"   Rows (prefectures): {len(df)} (expected: 47)")
print(f"   Columns: {len(df.columns)}")
print(f"   Missing values:\n{df.isnull().sum()[df.isnull().sum() > 0]}")

# 2. Target distribution
print(f"\n2. TARGET DISTRIBUTION (pop_change_pct_2020_2024)")
target = df["target_pop_change_pct"]
print(f"   Mean: {target.mean():.2f}%")
print(f"   Std:  {target.std():.2f}%")
print(f"   Min:  {target.min():.2f}% ({target.idxmin()})")
print(f"   Max:  {target.max():.2f}% ({target.idxmax()})")
print(f"   Positive growth: {(target > 0).sum()} prefectures")
print(f"   Negative growth: {(target < 0).sum()} prefectures")

# 3. Feature correlations with target
print(f"\n3. TOP CORRELATIONS WITH TARGET")
corrs = df.select_dtypes(include=[np.number]).corr()["target_pop_change_pct"].drop("target_pop_change_pct")
print(corrs.abs().sort_values(ascending=False).head(10))

# 4. Spatial integrity
print(f"\n4. SPATIAL INTEGRITY")
print(f"   Geometry type: {gdf.geometry.type.unique()}")
print(f"   CRS: {gdf.crs}")
print(f"   Valid geometries: {gdf.geometry.is_valid.all()}")
print(f"   Duplicate prefectures: {gdf.index.duplicated().sum()}")

# 5. Outlier detection (IQR method)
print(f"\n5. POTENTIAL OUTLIERS")
for col in df.select_dtypes(include=[np.number]).columns:
    Q1 = df[col].quantile(0.25)
    Q3 = df[col].quantile(0.75)
    IQR = Q3 - Q1
    outliers = df[(df[col] < Q1 - 1.5*IQR) | (df[col] > Q3 + 1.5*IQR)]
    if len(outliers) > 0:
        print(f"   {col}: {len(outliers)} outliers → {outliers.index.tolist()}")

print("\n✅ Validation complete. Check outputs above.")
```

---

## 📁 Final Project Structure

```
japan-urbanization-ml/
├── data/
│   ├── raw/
│   │   ├── kaggle_japan_population_1870_2015.csv
│   │   ├── kaggle_japan_prefecture_gdp.csv
│   │   ├── estat/
│   │   │   ├── population_estimates_2020.xlsx
│   │   │   ├── population_estimates_2021.xlsx
│   │   │   ├── population_estimates_2022.xlsx
│   │   │   ├── population_estimates_2023.xlsx
│   │   │   ├── population_estimates_2024.xlsx
│   │   │   ├── aging_rate_by_prefecture.xlsx
│   │   │   ├── vacant_housing_rate_2023.xlsx
│   │   │   └── net_migration_rate_prefecture.xlsx
│   │   ├── geospatial/
│   │   │   └── japan_prefectures.geojson
│   │   └── worldbank/
│   │       ├── wb_total_population.csv
│   │       ├── wb_urban_population_pct.csv
│   │       └── wb_gdp_current_usd.csv
│   │
│   └── processed/
│       ├── prefecture_mapping.csv
│       ├── population_normalized.csv
│       ├── gdp_normalized.csv
│       ├── aging_rate_normalized.csv
│       ├── vacant_housing_normalized.csv
│       ├── migration_normalized.csv
│       ├── master_features.csv
│       ├── master_features.geojson
│       ├── spatial_weights.pkl
│       ├── master_features_engineered.csv
│       └── master_features_engineered.geojson
│
├── src/
│   ├── download_kaggle_population.py
│   ├── download_kaggle_gdp.py
│   ├── download_estat_*.py
│   ├── download_geojson.py
│   ├── create_prefecture_mapping.py
│   ├── normalize_datasets.py
│   ├── merge_core_datasets.py
│   ├── feature_engineering.py
│   └── validate_data.py
│
├── notebooks/
│   ├── 01_eda.ipynb
│   ├── 02_xgboost_baseline.ipynb
│   ├── 03_spatial_autocorrelation.ipynb
│   ├── 04_spatial_xgboost.ipynb
│   └── 05_model_evaluation.ipynb
│
├── models/
│   └── (saved models)
│
├── outputs/
│   ├── figures/
│   └── predictions/
│
├── requirements.txt
├── pyproject.toml (if using uv)
└── README.md
```

---

## 🚀 Quick Start Commands

```bash
# 1. Setup environment
uv init japan-urbanization-ml
cd japan-urbanization-ml
uv add pandas numpy geopandas xgboost scikit-learn optuna libpysal esda spreg matplotlib seaborn folium contextily requests kagglehub ddgs jupyterlab pyogrio

# 2. Download all data (run in order)
uv run python src/download_kaggle_population.py
uv run python src/download_kaggle_gdp.py
uv run python src/download_estat_population.py
uv run python src/download_estat_aging.py
uv run python src/download_estat_vacant_housing.py
uv run python src/download_estat_migration.py
uv run python src/download_geojson.py

# 3. Process & merge
uv run python src/create_prefecture_mapping.py
uv run python src/normalize_datasets.py
uv run python src/merge_core_datasets.py
uv run python src/feature_engineering.py
uv run python src/validate_data.py

# 4. Start modeling
uv run jupyter lab notebooks/
```

---

## ⚠️ Known Issues & Troubleshooting

| Issue | Solution |
|-------|----------|
| e-Stat URLs change | Check e-Stat website manually; use browser DevTools to find direct .xlsx links |
| Prefecture name mismatch | Always use `prefecture_mapping.csv` as single source of truth |
| GeoJSON CRS not WGS84 | `gdf = gdf.to_crs("EPSG:4326")` after loading |
| Missing 2024 population in Kaggle data | Use e-Stat 2024 estimates for target calculation |
| Spatial weights matrix singular | Use `w.transform = 'r'` (row-standardize) |
| XGBoost overfitting on 47 samples | Use spatial CV (Leave-One-Region-Out), limit tree depth, increase regularization |

---

## 📌 Key Reminders

1. **Only 47 observations** — use strong regularization, spatial CV, avoid overfitting
2. **Target is decline degree** — 45/47 prefectures losing population (Tokyo, Saitama only growth)
3. **Spatial autocorrelation exists** — Moran's I will be significant; use spatial lag features
4. **e-Stat is Japanese** — browser translate + manual download most reliable
5. **Name mapping is critical** — never merge on raw names without normalization

---

*Document generated for Japan Urbanization ML Project*  
*Next: Proceed to `notebooks/01_eda.ipynb` for exploratory analysis*
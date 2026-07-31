# Project Phases & Organization

To keep work organized and structured, the project is divided into the following phases. We will execute the work phase by phase.

## Phase 1: Environment Setup & Data Collection
- [x] Initialize Python environment using `uv`.
- [x] Install core dependencies (pandas, geopandas, xgboost, FastAPI, Streamlit, etc.).
- [x] Download Kaggle datasets (Population 1870-2015, Prefecture GDP).
- [x] Download e-Stat official statistics (Population Estimates, Aging Rate, Vacant Housing Rate, Net Migration).
- [x] Download Prefecture Boundaries (GeoJSON).
- [ ] Optionally download World Bank context data.

## Phase 2: Data Preprocessing & Merging
- [x] Inspect all raw datasets and understand their schemas.
- [x] Standardize and normalize Japanese prefecture names to English across all datasets (`prefecture_mapping.csv`).
- [x] Merge core datasets into a Master Prefecture Panel (2020-2024).
- [x] Construct the base Feature Matrix and target variable (`pop_change_pct_2020_2024`).

## Phase 3: Spatial Feature Engineering
- [x] Generate Spatial Weights Matrices (Queen contiguity, KNN, Distance Band).
- [x] Engineer spatial lag features using libpysal/esda.
- [x] Create interaction terms (e.g., aging * vacant housing, pop * dist_tokyo).
- [x] Validate data integrity, spatial components, and handle any outliers/missing values.

## Phase 4: Model Development & Spatial Diagnostics (COMPLETED)
- [x] Perform Exploratory Data Analysis (EDA) on the engineered features (`01_eda.ipynb`).
- [x] Train XGBoost baseline model (`02_xgboost_baseline.ipynb`).
- [x] Conduct Spatial Autocorrelation tests, like Moran's I and LISA (`03_spatial_autocorrelation.ipynb`).
- [x] Train Spatial-aware XGBoost models (`04_spatial_xgboost.ipynb`).
- [x] Evaluate model performance, compute SHAP values, and extract feature importance (`05_model_evaluation.ipynb`).

## Phase 5: Web Application Development
- [ ] Set up the FastAPI backend API structure (`web/backend/`).

## Phase 6: Stitch UI Generation & Integration
- [ ] Connect Stitch MCP API using the provided token.
- [ ] Generate the frontend UI React components from the Dashboard prompt.
- [ ] Integrate the Stitch-generated UI with our backend models.
  - Create endpoints for `/predict`, `/shap`, `/data`, and `/spatial`.
  - Integrate inference logic and spatial computation within the API.
- [ ] Set up the Streamlit frontend structure (`web/frontend/`).
  - Develop multi-page layout (Overview, Data Explorer, Spatial Analysis, Model Perf, Explainability, Predictions).
  - Implement interactive components (Choropleth maps, LISA cluster maps, SHAP beeswarm/dependence plots).
- [ ] Connect the Streamlit UI to the FastAPI backend.

## Phase 6: Deployment & Documentation
- [ ] Finalize Dockerfiles for both frontend and backend.
- [ ] Configure `docker-compose.yml` for easy deployment.
- [ ] Ensure mobile-responsive design optimizations in Streamlit.
- [ ] Complete project documentation (`README.md`, codebase comments).

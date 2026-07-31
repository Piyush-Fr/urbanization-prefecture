# Daily Progress & Updates Register (Memory)

> This file acts as a daily register to track what changes or features are added. Update it every time a new feature is added, or significant progress is made to help track what's happening in the project.

## Current Status Overview
- **Project Phase:** Phase 1 (Completed)
- **Latest Milestone:** Set up environment and downloaded all core Kaggle, e-Stat, and Geospatial datasets.

---

## Log

### [2026-07-24] 
- **Updates:** 
  - Analyzed `RequirementData.md` to extract the architecture, project scope, and procedures.
  - Created `Architecture.md`, `Phase.md`, `Memory.md`, and `Rules.md` to organize the workflow.
  - Set up Python environment using `uv` (pinned to Python 3.11) and resolved dependency conflicts.
  - Created Python download scripts in `src/`.
  - Executed download scripts. Kaggle population and GDP data successfully downloaded.
  - **Issue Encountered**: e-Stat metrics and the Japan Prefecture GeoJSON failed to download via scripts due to 404 (Not Found) errors (anticipated).
  - **Manual Download Progress**: All required e-Stat files have been successfully downloaded! This includes Population Estimates, Aging Rate, Net Migration Rate, and Vacant Housing Rate (Akiya) data for 2013-2023.
  - **Geospatial Data**: Successfully found and downloaded the `japan.geojson` from the `dataofjapan/land` GitHub repository and saved it to `data/raw/geospatial/prefectures.geojson`.

### Phase 1: Data Collection & Environment Setup (Completed)
- Successfully collected and verified all core datasets.
- Normalized dataset locations and established Python environment.

### Phase 2: Data Preprocessing & Merging (Completed)
- Standardized prefecture names across Kaggle GDP/Population and e-Stat datasets (Population, Aging, Migration, Vacant Housing).
- Handled data cleaning and mapping issues (`Hokkai Do` -> `Hokkaido`, `Gumma` -> `Gunma`).
- Computed Vacancy Rate from absolute vacant dwellings and households.
- Successfully merged into `master_panel.csv` with 47 rows (one per prefecture) and 0 missing values.
- Extracted Target Variable: `pop_change_pct_2020_2024`.

### Phase 3: Spatial Feature Engineering (Completed)
- Installed `libpysal` and `esda` for spatial modeling.
- Constructed a K-Nearest Neighbors (K=4) Spatial Weights Matrix from GeoJSON boundaries to ensure island prefectures (Okinawa, Hokkaido) are correctly connected to their nearest neighbors.
- Engineered Spatial Lag features for aging rate, vacancy rate, migration rate, and GDP.
- Added interaction terms like `aging_x_vacancy` and `pop_x_dist_tokyo`.
- Output verified and saved to `data/processed/spatial_panel.csv`.

### Phase 4: Model Development & Spatial Diagnostics (Next)
- Needs implementation.

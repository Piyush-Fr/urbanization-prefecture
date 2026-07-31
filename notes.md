# Research Notes: Urbanisation & Population Growth in Japan

This document serves as a comprehensive log of the methodologies, data sources, and modeling strategies employed in this project. It is structured to facilitate the writing of a formal research paper on the spatial determinants of population change in Japan.

## 1. Project Objective
The primary objective is to analyze and predict the drivers of population change across Japan's 47 prefectures between 2020 and 2024. The study emphasizes **spatial diagnostics**, exploring how geographic proximity, urbanization features, and socio-demographic factors (e.g., aging, vacant housing) influence regional population dynamics. 

The core target variable is the **Population Change Percentage (2020-2024)**.

## 2. Data Sources & Description
The study relies on a multi-source dataset, combining historical context with recent government statistics:

1. **Kaggle Datasets**:
   - **Historical Population (1870-2015)**: Provides long-term demographic context.
   - **Prefecture GDP (2014)**: Used as an economic baseline indicator (`gdp_usd_ppp`).
2. **e-Stat (Official Statistics of Japan)**:
   - **Population Estimates (2020 & 2024)**: Sourced to calculate the exact population change target variable.
   - **Aging Rate**: Percentage of the population aged 65 and over (2024).
   - **Net Migration Rate**: Extracted from the most recent available data (2019) to proxy migration trends prior to the study period.
   - **Vacant Housing Rate (Akiya)**: Derived from the 2018 Housing and Land Survey, calculated as the absolute number of vacant dwellings divided by the total number of households.
3. **Geospatial Data**:
   - **GeoJSON Boundaries**: High-resolution boundaries for Japan's 47 prefectures (from the `dataofjapan/land` GitHub repository), utilized to compute distance to Tokyo and construct spatial weights.

## 3. Methodology & Preprocessing (Phases 1 & 2)
### Data Normalization & Cleaning
- **Name Standardization**: Japanese prefecture names present a significant challenge due to variations in romanization (e.g., "Gumma" vs. "Gunma", "Hokkai Do" vs. "Hokkaido"). A central mapping file (`prefecture_mapping.csv`) was created to act as the single source of truth for English names across all datasets.
- **Encoding Issues**: Handled mixed encodings (UTF-8 vs Shift-JIS) prevalent in Japanese government data.
- **Data Transformation**: 
  - Extracted numerical data from highly unstructured e-Stat Excel tables and CSVs (e.g., removing commas, dropping 12-line metadata headers).
  - Derived the `vacancy_rate_pct` by combining absolute vacant dwelling counts with total household counts.
  - Calculated `dist_to_tokyo_km` using geospatial centroid distance from each prefecture to Tokyo (projected via EPSG:3857).

### Master Panel Construction
A unified, cross-sectional master panel (`master_panel.csv`) was generated, containing 47 rows (one for each prefecture) with 0 missing values. The feature matrix includes:
- `target_pop_change_pct`
- `population_2024` and `population_2020`
- `gdp_usd_ppp_2014`
- `aging_rate_pct`
- `net_migration_rate`
- `vacancy_rate_pct`
- `region`
- `dist_to_tokyo_km`

### Spatial Feature Engineering (Phase 3)
To capture how neighboring prefectures influence each other's population dynamics, we engineered spatial features using `libpysal`:
- **Spatial Weights Matrices (W)**: We constructed a **K-Nearest Neighbors (KNN)** matrix with $K=4$. We chose KNN over Queen contiguity because Japan's geography includes island prefectures (e.g., Okinawa, Hokkaido, Shikoku) that do not share land borders and would otherwise be isolated. All weights matrices were row-standardized.
- **Spatial Lags**: We calculated spatially lagged variables (the weighted average of neighboring prefectures' values) for `aging_rate_pct`, `vacancy_rate_pct`, `net_migration_rate`, and `gdp_usd_ppp_2014`.
- **Interaction Terms**: We generated interaction features to capture compounded effects, such as- `aging_x_vacancy`: Interaction term to capture compounding effects of old populations in empty housing areas.
- `pop_x_dist_tokyo`: Interaction term to capture gravitational pull of Tokyo scaled by current population.

## Phase 4: Model Development & Spatial Diagnostics
**Methodology:**
1. **Spatial Autocorrelation (Global Moran's I):** Calculated on `target_pop_change_pct` using K-Nearest Neighbors (K=4) to appropriately capture spatial relationships without isolating island prefectures (like Hokkaido/Okinawa).
2. **Modeling Strategy:** Due to extreme sample constraints ($N=47$), we utilized Leave-One-Region-Out Cross-Validation (LOOCV). We deployed `XGBRegressor` with heavily constrained tree parameters (`max_depth=3`) and strong L1/L2 regularization (`reg_alpha=0.5, reg_lambda=1.0`) to avoid overfitting.
3. **Model Interpretability:** We used SHAP values on the final spatial model to isolate the nonlinear, additive impacts of the spatial lag features.

**Outputs & Findings:**
- **Spatial Autocorrelation:** The Global Moran's I was highly significant at **0.4430** ($p < 0.05$). This strongly rejects the null hypothesis of spatial randomness, mathematically proving that population decline in Japan is clustered. Regions experiencing severe depopulation are adjacent to other regions experiencing depopulation.
- **Baseline Model (No Spatial Features):** 
  - RMSE: 0.5445
  - R² Score: 0.8909
  - The baseline variables (Aging, Vacancy, Distance to Tokyo) already explain ~89% of the variance in population change.
- **Spatial XGBoost Model:**
  - RMSE: 0.5551
  - R² Score: 0.8865
  - *Observation:* The spatial model performed marginally worse in LOOCV. In extremely small-$N$ scenarios, adding 6 new spatial/interaction features increases model variance, slightly offsetting the reduction in bias. However, maintaining the spatial features is crucial for the inferential/SHAP analysis required by the research paper to explain *how* spillovers operate.

## 5. Preliminary Output Statistics
Based on the generated `master_panel.csv`, we observed the following demographic realities across the 47 prefectures for the 2020-2024 period:

**Top 3 Prefectures by Population Growth:**
1. **Tokyo**: +0.93% (Population: 14.18M, Vacancy Rate: 10.08%)
2. **Okinawa**: -0.10% (Population: 1.47M, Vacancy Rate: 9.95%)
3. **Kanagawa**: -0.13% (Population: 9.23M, Vacancy Rate: 10.29%)
*Note: Tokyo was the only prefecture to experience positive population growth during this period. Okinawa and Kanagawa experienced the smallest declines.*

**Top 3 Prefectures by Population Decline:**
1. **Akita**: -6.51% (Population: 897K, Vacancy Rate: 13.63%)
2. **Aomori**: -5.90% (Population: 1.16M, Vacancy Rate: 14.78%)
3. **Iwate**: -5.41% (Population: 1.14M, Vacancy Rate: 15.96%)
*Note: The prefectures with the steepest decline are geographically distant from Tokyo and exhibit higher vacancy rates and aging rates.*

**Summary Statistics of the 47 Prefectures:**
- **Average Population Change**: -3.06%
- **Average Aging Rate**: 31.83% (Max: 39.5% in Akita, Min: 22.7% in Okinawa)
- **Average Vacant Housing Rate**: 14.71%
- **Average Distance to Tokyo**: 568 km (Max: 1,875 km for Okinawa)

## 6. Potential Research Questions to Explore in the Paper
- *How does the rate of vacant housing (Akiya) influence regional population decline when accounting for spatial spillover effects?*
- *To what extent does proximity to the Tokyo metropolitan area mitigate the effects of an aging population on regional growth?*
- *Can machine learning models (like XGBoost), when augmented with spatial lag features, outperform traditional spatial econometrics in predicting demographic shifts on small-N datasets?*

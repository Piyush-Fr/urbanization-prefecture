# Project Rules & Best Practices

To ensure data integrity, model robustness, and maintainable code in this Japan Urbanization Analysis project, we must strictly adhere to the following rules.

## ✅ What We MUST Do (Do's)

### 1. Data Processing
* **Always use the Master Prefecture Mapping**: `prefecture_mapping.csv` is the single source of truth. Datasets come in different languages and formats (e.g., "Tokyo", "東京都"). Always normalize names before joining data.
* **Convert CRS for Geospatial Data**: Always ensure GeoJSON GeodataFrames are converted to WGS84 (`gdf.to_crs("EPSG:4326")`) before generating maps or calculating spatial metrics.
* **Row-Standardize Spatial Weights**: When calculating spatial weights matrices (Queen, KNN, etc.), always row-standardize them (`w.transform = 'r'`) to prevent singular matrix errors.

### 2. Modeling
* **Apply Strong Regularization**: Our dataset has exactly 47 observations (one per prefecture). To prevent XGBoost from instantly overfitting, we must use strong regularization (L1/L2 penalties) and limit tree depth.
* **Use Spatial Cross-Validation**: Standard random K-Fold CV will leak data due to spatial autocorrelation. We must use spatial CV (like Leave-One-Region-Out) for evaluating the model.
* **Incorporate Spatial Lags**: Spatial autocorrelation is a known factor. Always calculate and include spatial lag features (e.g., lagged aging rate, lagged vacant housing rate) alongside core features.

### 3. Environment & Tools
* **Use `uv` for Environment Management**: Stick to `uv` as the package and environment manager as outlined in the setup procedure to ensure fast and reproducible environments.
* **Handle e-Stat Data Carefully**: The e-Stat portal URLs frequently change and the API can be unreliable. Be prepared to manually download data and drop it into the `data/raw/estat` folder if automated scripts fail.

---

## ❌ What We MUST AVOID (Don'ts)

### 1. Data Merging Mistakes
* **DO NOT merge on raw prefecture names**: Never execute a `merge` or `join` on the raw prefecture name strings without running them through the mapping dictionary first.
* **DO NOT ignore missing data**: With only 47 rows, every single missing value has a huge impact. Investigate any `NaN` values thoroughly.

### 2. Modeling Pitfalls
* **DO NOT assume binary classification**: The target variable is the *degree of population decline*. Remember that 45 out of 47 prefectures are actively declining (only Tokyo and Saitama grew recently). This is a regression or continuous prediction problem.
* **DO NOT ignore spatial metrics**: Never trust model accuracy metrics without checking the Moran's I and LISA diagnostics. Good accuracy with high residual spatial autocorrelation means the model is missing key spatial dynamics.

### 3. Development Habits
* **DO NOT overcomplicate the Streamlit App**: The web dashboard is meant for storytelling and presenting results to recruiters. Keep the UI clean, responsive, and avoid unnecessary complex states that hinder performance.
* **DO NOT commit raw large datasets to Git**: Ensure `.gitignore` is configured to exclude large raw files, or use Git LFS if committing large GeoJSONs is strictly necessary.

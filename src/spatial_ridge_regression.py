import pandas as pd
import numpy as np
import geopandas as gpd
from libpysal.weights import Queen, KNN
from sklearn.linear_model import Ridge
from sklearn.model_selection import LeaveOneOut
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import spreg

# 1. Load Data
df = pd.read_csv('data/processed/spatial_panel.csv')
gdf = gpd.read_file('data/raw/geospatial/prefectures.geojson')

# Clean GeoJSON names to match prefecture_en
def clean_geo_name(name):
    name = str(name).replace(" To", "").replace(" Fu", "").replace(" Ken", "")
    name = name.replace("Hokkai Do", "Hokkaido")
    return name.strip()

gdf["nam"] = gdf["nam"].apply(clean_geo_name)
gdf = gdf.rename(columns={"nam": "prefecture_en"})

merged = gdf[["prefecture_en", "geometry"]].merge(df, on="prefecture_en", how="inner")
merged = merged.to_crs("EPSG:3857")

# 2. Calculate Spatial Weights using Queen
print("Calculating Spatial Weights (Queen Contiguity)...")
w = Queen.from_dataframe(merged)

# Handle islands (e.g. Hokkaido, Okinawa) which break spatial lag models
if w.islands:
    print(f"Found {len(w.islands)} disconnected islands. Fixing by connecting them to their nearest neighbor...")
    w_knn1 = KNN.from_dataframe(merged, k=1)
    for island in w.islands:
        nn = w_knn1.neighbors[island][0]
        w.neighbors[island] = [nn]
        if island not in w.neighbors[nn]:
            w.neighbors[nn].append(island)
    w = w_knn1 # Reset weights with custom dict is tedious, easier to rebuild or just use a combined approach
    # Let's cleanly patch the Queen weights
    from libpysal.weights import W
    new_neighbors = w.neighbors.copy()
    patched_w = W(new_neighbors)
    w = patched_w

w.transform = 'r'

# 3. Base Features
# Fix target leakage by dropping population_2024 and log-transforming population_2020
merged['log_pop_2020'] = np.log(merged['population_2020'])

base_features = [
    'log_pop_2020', 'gdp_usd_ppp_2014', 
    'aging_rate_pct', 'net_migration_rate', 'vacancy_rate_pct', 
    'dist_to_tokyo_km'
]

# We will NOT use the highly collinear lags from Phase 3. 
# We'll rely on spreg to model the spatial error/lag properly,
# and we'll use a pure Ridge Regression for the non-spatial baseline.

y = merged['target_pop_change_pct'].values
X = merged[base_features].values

# Scale X for Ridge
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# --- A: Spreg Spatial Lag Model (ML_Lag) ---
print("\n--- Spatial Lag Model (spreg.ML_Lag) ---")
try:
    slm = spreg.ML_Lag(y.reshape(-1,1), X_scaled, w, name_y='target_pop_change_pct', name_x=base_features)
    # Print the relevant coefficients and p-values
    print(slm.summary)
except Exception as e:
    print("Spreg ML_Lag failed:", e)


# --- B: Regularized Ridge Regression with LOOCV ---
print("\n--- Regularized Ridge Regression with LOOCV ---")
loo = LeaveOneOut()
y_true, y_pred = [], []
ridge = Ridge(alpha=5.0) # Strong regularization to handle multicollinearity

for train_index, test_index in loo.split(X_scaled):
    X_train, X_test = X_scaled[train_index], X_scaled[test_index]
    y_train, y_test = y[train_index], y[test_index]
    
    ridge.fit(X_train, y_train)
    y_pred.append(ridge.predict(X_test)[0])
    y_true.append(y_test[0])

rmse = np.sqrt(mean_squared_error(y_true, y_pred))
r2 = r2_score(y_true, y_pred)

print(f"Ridge LOOCV RMSE: {rmse:.4f}")
print(f"Ridge LOOCV R^2:  {r2:.4f}")

# Ridge Coefficients on full dataset to interpret feature contributions
ridge.fit(X_scaled, y)
coef_df = pd.DataFrame({'Feature': base_features, 'Coefficient': ridge.coef_})
print("\nRidge Coefficients (Full Dataset - Sorted by Impact):")
print(coef_df.sort_values(by='Coefficient', key=abs, ascending=False).to_string(index=False))

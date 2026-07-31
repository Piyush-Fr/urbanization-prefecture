import pandas as pd
import numpy as np
import geopandas as gpd
from libpysal.weights import Queen, KNN
from esda.moran import Moran_Local
from sklearn.linear_model import Ridge
from sklearn.model_selection import LeaveOneOut
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

# 1. Load Data
df = pd.read_csv('data/processed/spatial_panel.csv')
gdf = gpd.read_file('data/raw/geospatial/prefectures.geojson')

def clean_geo_name(name):
    name = str(name).replace(" To", "").replace(" Fu", "").replace(" Ken", "")
    name = name.replace("Hokkai Do", "Hokkaido")
    return name.strip()

gdf["nam"] = gdf["nam"].apply(clean_geo_name)
gdf = gdf.rename(columns={"nam": "prefecture_en"})

merged = gdf[["prefecture_en", "geometry"]].merge(df, on="prefecture_en", how="inner")
merged = merged.to_crs("EPSG:3857")

# 2. Run Ridge LOOCV to get Residuals
merged['log_pop_2020'] = np.log(merged['population_2020'])
base_features = [
    'log_pop_2020', 'gdp_usd_ppp_2014', 
    'aging_rate_pct', 'net_migration_rate', 'vacancy_rate_pct', 
    'dist_to_tokyo_km'
]
y = merged['target_pop_change_pct'].values
X = merged[base_features].values
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

loo = LeaveOneOut()
residuals = np.zeros(len(y))
ridge = Ridge(alpha=5.0)

for train_index, test_index in loo.split(X_scaled):
    X_train, X_test = X_scaled[train_index], X_scaled[test_index]
    y_train, y_test = y[train_index], y[test_index]
    
    ridge.fit(X_train, y_train)
    y_pred = ridge.predict(X_test)[0]
    residuals[test_index[0]] = y_test[0] - y_pred

merged['residuals'] = residuals

# 3. Spatial Weights for LISA (Using KNN to avoid island issues)
# We use KNN=4 as it guarantees connections for all prefectures.
w = KNN.from_dataframe(merged, k=4)
w.transform = 'r'

# 4. Anselin Local Moran's I
lisa = Moran_Local(merged['residuals'], w)
merged['lisa_q'] = lisa.q
merged['lisa_p'] = lisa.p_sim

# Assign significance and quadrant labels
# 1: HH, 2: LH, 3: LL, 4: HL
labels = ["Not Significant", "High-High", "Low-High", "Low-Low", "High-Low"]
colors = ["lightgrey", "red", "lightblue", "blue", "pink"]

# Create a column for coloring based on significance (p < 0.05)
merged['lisa_cluster'] = 0 # Not Significant
for i in range(len(merged)):
    if merged.loc[i, 'lisa_p'] < 0.05:
        merged.loc[i, 'lisa_cluster'] = merged.loc[i, 'lisa_q']

# 5. Plot the Clusters
f, ax = plt.subplots(1, figsize=(10, 10))
merged.plot(column='lisa_cluster', categorical=True, 
            cmap=plt.matplotlib.colors.ListedColormap(colors),
            legend=True, ax=ax, edgecolor='white', linewidth=0.5)

# Customize Legend
leg = ax.get_legend()
if leg:
    for t in leg.get_texts():
        val = int(t.get_text())
        t.set_text(labels[val])

plt.title("LISA Clusters of Ridge Residuals (p < 0.05)\nChecking for unmodeled spatial patterns")
plt.axis('off')
plt.savefig(r'C:\Users\piyus\.gemini\antigravity-ide\brain\d1659fd8-8cad-4234-9b5a-066df21d9dbf\lisa_residuals.png', dpi=300, bbox_inches='tight')
plt.close()

print("Residual diagnostics complete. LISA map saved.")

import nbformat as nbf
from pathlib import Path

def create_notebook(filename, cells):
    nb = nbf.v4.new_notebook()
    nb['cells'] = cells
    with open(filename, 'w') as f:
        nbf.write(nb, f)

notebooks_dir = Path("notebooks")
notebooks_dir.mkdir(exist_ok=True)

# 01_eda.ipynb
cells_01 = [
    nbf.v4.new_markdown_cell("# Exploratory Data Analysis (EDA)"),
    nbf.v4.new_code_cell("""import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

df = pd.read_csv('../data/processed/spatial_panel.csv')
df.head()"""),
    nbf.v4.new_code_cell("""# Distribution of Population Change
plt.figure(figsize=(10, 6))
sns.histplot(df['target_pop_change_pct'], bins=15, kde=True)
plt.title('Distribution of Population Change (%) 2020-2024')
plt.xlabel('Population Change (%)')
plt.show()"""),
    nbf.v4.new_code_cell("""# Correlation Matrix
plt.figure(figsize=(12, 10))
corr = df.drop(columns=['prefecture_en', 'region']).corr()
sns.heatmap(corr, annot=True, cmap='coolwarm', fmt=".2f")
plt.title('Feature Correlation Matrix')
plt.show()""")
]
create_notebook(notebooks_dir / "01_eda.ipynb", cells_01)

# 02_spatial_autocorrelation.ipynb
cells_02 = [
    nbf.v4.new_markdown_cell("# Spatial Autocorrelation Diagnostics\nEvaluating Moran's I and LISA to prove spatial clustering."),
    nbf.v4.new_code_cell("""import pandas as pd
import geopandas as gpd
from libpysal.weights import KNN
from esda.moran import Moran, Moran_Local
import matplotlib.pyplot as plt

df = pd.read_csv('../data/processed/spatial_panel.csv')
gdf = gpd.read_file('../data/raw/geospatial/prefectures.geojson')

# Clean GeoJSON names to match prefecture_en
def clean_geo_name(name):
    name = str(name).replace(" To", "").replace(" Fu", "").replace(" Ken", "")
    name = name.replace("Hokkai Do", "Hokkaido")
    return name.strip()
    
gdf["nam"] = gdf["nam"].apply(clean_geo_name)
gdf = gdf.rename(columns={"nam": "prefecture_en"})

merged = gdf[["prefecture_en", "geometry"]].merge(df, on="prefecture_en", how="inner")
merged = merged.to_crs("EPSG:3857")

w = KNN.from_dataframe(merged, k=4)
w.transform = 'r'"""),
    nbf.v4.new_code_cell("""# Global Moran's I
y = merged['target_pop_change_pct'].values
moran = Moran(y, w)
print(f"Global Moran's I: {moran.I:.4f}")
print(f"p-value: {moran.p_sim:.4f}")

if moran.p_sim < 0.05:
    print("Significant spatial autocorrelation detected!")
else:
    print("No significant spatial autocorrelation.")""")
]
create_notebook(notebooks_dir / "02_spatial_autocorrelation.ipynb", cells_02)

# 03_xgboost_baseline.ipynb
cells_03 = [
    nbf.v4.new_markdown_cell("# Baseline XGBoost Model\nModel trained strictly on non-spatial features."),
    nbf.v4.new_code_cell("""import pandas as pd
import xgboost as xgb
from sklearn.model_selection import LeaveOneOut
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np

df = pd.read_csv('../data/processed/spatial_panel.csv')

# Base Features only
features = [
    'population_2024', 'population_2020', 'gdp_usd_ppp_2014', 
    'aging_rate_pct', 'net_migration_rate', 'vacancy_rate_pct', 
    'dist_to_tokyo_km'
]
X = df[features]
y = df['target_pop_change_pct']

# Leave-One-Region-Out (Leave-One-Out approximation for N=47)
loo = LeaveOneOut()
y_true, y_pred = [], []

for train_index, test_index in loo.split(X):
    X_train, X_test = X.iloc[train_index], X.iloc[test_index]
    y_train, y_test = y.iloc[train_index], y.iloc[test_index]
    
    # Strong Regularization (Rules.md)
    model = xgb.XGBRegressor(
        max_depth=3, 
        learning_rate=0.05, 
        n_estimators=100,
        reg_alpha=0.5,
        reg_lambda=1.0,
        random_state=42
    )
    model.fit(X_train, y_train)
    y_pred.append(model.predict(X_test)[0])
    y_true.append(y_test.values[0])

rmse = np.sqrt(mean_squared_error(y_true, y_pred))
r2 = r2_score(y_true, y_pred)
print(f"Baseline XGBoost - RMSE: {rmse:.4f}, R²: {r2:.4f}")""")
]
create_notebook(notebooks_dir / "03_xgboost_baseline.ipynb", cells_03)

# 04_spatial_xgboost.ipynb
cells_04 = [
    nbf.v4.new_markdown_cell("# Spatial-Aware XGBoost Model\nIncorporating engineered spatial lags and interaction terms."),
    nbf.v4.new_code_cell("""import pandas as pd
import xgboost as xgb
from sklearn.model_selection import LeaveOneOut
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np

df = pd.read_csv('../data/processed/spatial_panel.csv')

# Include ALL features (base + spatial lags + interaction terms)
features = [
    'population_2024', 'population_2020', 'gdp_usd_ppp_2014', 
    'aging_rate_pct', 'net_migration_rate', 'vacancy_rate_pct', 
    'dist_to_tokyo_km', 'aging_rate_pct_lag', 'vacancy_rate_pct_lag',
    'net_migration_rate_lag', 'gdp_usd_ppp_2014_lag', 'aging_x_vacancy',
    'pop_x_dist_tokyo'
]
X = df[features]
y = df['target_pop_change_pct']

loo = LeaveOneOut()
y_true, y_pred = [], []

# We'll save the final model trained on ALL data for SHAP evaluation later
final_model = xgb.XGBRegressor(
    max_depth=3, 
    learning_rate=0.05, 
    n_estimators=100,
    reg_alpha=0.5,
    reg_lambda=1.0,
    random_state=42
)

for train_index, test_index in loo.split(X):
    X_train, X_test = X.iloc[train_index], X.iloc[test_index]
    y_train, y_test = y.iloc[train_index], y.iloc[test_index]
    
    model = xgb.XGBRegressor(
        max_depth=3, 
        learning_rate=0.05, 
        n_estimators=100,
        reg_alpha=0.5,
        reg_lambda=1.0,
        random_state=42
    )
    model.fit(X_train, y_train)
    y_pred.append(model.predict(X_test)[0])
    y_true.append(y_test.values[0])

rmse = np.sqrt(mean_squared_error(y_true, y_pred))
r2 = r2_score(y_true, y_pred)
print(f"Spatial XGBoost - RMSE: {rmse:.4f}, R²: {r2:.4f}")

# Train final model for extraction
final_model.fit(X, y)
final_model.save_model('../data/processed/spatial_xgboost.json')""")
]
create_notebook(notebooks_dir / "04_spatial_xgboost.ipynb", cells_04)

# 05_model_evaluation.ipynb
cells_05 = [
    nbf.v4.new_markdown_cell("# Model Evaluation & SHAP Feature Importance"),
    nbf.v4.new_code_cell("""import pandas as pd
import xgboost as xgb
import shap
import matplotlib.pyplot as plt

df = pd.read_csv('../data/processed/spatial_panel.csv')

features = [
    'population_2024', 'population_2020', 'gdp_usd_ppp_2014', 
    'aging_rate_pct', 'net_migration_rate', 'vacancy_rate_pct', 
    'dist_to_tokyo_km', 'aging_rate_pct_lag', 'vacancy_rate_pct_lag',
    'net_migration_rate_lag', 'gdp_usd_ppp_2014_lag', 'aging_x_vacancy',
    'pop_x_dist_tokyo'
]
X = df[features]

model = xgb.XGBRegressor()
model.load_model('../data/processed/spatial_xgboost.json')

explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X)

shap.summary_plot(shap_values, X, plot_type="bar")"""),
    nbf.v4.new_code_cell("""shap.summary_plot(shap_values, X)""")
]
create_notebook(notebooks_dir / "05_model_evaluation.ipynb", cells_05)

print("Successfully generated all 5 Jupyter Notebooks in the notebooks/ directory.")

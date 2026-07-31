import pandas as pd
import geopandas as gpd
from libpysal.weights import KNN
import warnings
from pathlib import Path

# Suppress PySAL/GeoPandas warnings
warnings.filterwarnings('ignore')

def main():
    proc_dir = Path("data/processed")
    
    # 1. Load Data
    print("Loading datasets...")
    df = pd.read_csv(proc_dir / "master_panel.csv")
    gdf = gpd.read_file("data/raw/geospatial/prefectures.geojson")
    
    # Clean GeoJSON names to match prefecture_en
    def clean_geo_name(name):
        name = str(name).replace(" To", "").replace(" Fu", "").replace(" Ken", "")
        name = name.replace("Hokkai Do", "Hokkaido")
        return name.strip()
        
    gdf["nam"] = gdf["nam"].apply(clean_geo_name)
    gdf = gdf.rename(columns={"nam": "prefecture_en"})
    
    # Merge DataFrame and GeoDataFrame
    # Ensure correct ordering of spatial weights
    merged = gdf[["prefecture_en", "geometry"]].merge(df, on="prefecture_en", how="inner")
    
    # Re-project to a metric CRS for accurate distance and nearest neighbor calculations (EPSG:3857)
    merged = merged.to_crs("EPSG:3857")
    
    # 2. Construct Spatial Weights Matrix
    # We use KNN (k=4) because Japan has island prefectures (Okinawa, Hokkaido, Shikoku, etc.) 
    # which might not share land borders (Queen contiguity would leave them as islands with W=0).
    print("Constructing KNN Spatial Weights (k=4)...")
    w = KNN.from_dataframe(merged, k=4)
    
    # Row-standardize weights (w_ij = 1/k) as required by Rules.md
    w.transform = 'r'
    
    # 3. Engineer Spatial Lags
    print("Engineering Spatial Lag features...")
    lag_features = [
        "aging_rate_pct",
        "vacancy_rate_pct",
        "net_migration_rate",
        "gdp_usd_ppp_2014"
    ]
    
    from libpysal.weights import lag_spatial
    for feature in lag_features:
        lagged_col_name = f"{feature}_lag"
        merged[lagged_col_name] = lag_spatial(w, merged[feature])
    
    # 4. Create Interaction Terms
    print("Creating interaction terms...")
    # 4a. Aging x Vacancy: Does an aging population in areas with lots of empty homes compound the population decline?
    merged["aging_x_vacancy"] = merged["aging_rate_pct"] * merged["vacancy_rate_pct"]
    
    # 4b. Population x Distance to Tokyo: Scale effect vs remoteness.
    merged["pop_x_dist_tokyo"] = merged["population_2024"] * merged["dist_to_tokyo_km"]
    
    # 5. Extract Non-Spatial DataFrame and Save
    # We drop the geometry column so it's a standard DataFrame for XGBoost
    final_df = pd.DataFrame(merged.drop(columns="geometry"))
    
    # Verification
    assert final_df.shape[0] == 47, f"Expected 47 rows, got {final_df.shape[0]}"
    assert final_df.isna().sum().sum() == 0, f"Found NaNs in spatial panel:\n{final_df.isna().sum()}"
    
    output_path = proc_dir / "spatial_panel.csv"
    final_df.to_csv(output_path, index=False)
    print(f"Success! Spatial feature engineering complete. Saved to {output_path}")

if __name__ == "__main__":
    main()

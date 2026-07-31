import pandas as pd
import geopandas as gpd
from pathlib import Path
import numpy as np
import warnings
warnings.filterwarnings('ignore')

def main():
    proc_dir = Path("data/processed")
    proc_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Load Datasets
    df_2020 = pd.read_csv(proc_dir / "estat_2020.csv")
    df_2024 = pd.read_csv(proc_dir / "estat_2024.csv")
    df_gdp = pd.read_csv(proc_dir / "gdp_normalized.csv")
    df_vac = pd.read_csv(proc_dir / "vacant_housing_normalized.csv")
    df_mapping = pd.read_csv(proc_dir / "prefecture_mapping.csv")
    
    # Load GeoJSON for spatial features
    gdf = gpd.read_file("data/raw/geospatial/prefectures.geojson")
    # Project to a metric CRS (e.g. EPSG:3857 or Japan standard) for distance calculation
    # Using EPSG:3857 for pseudo-mercator to easily get meters
    gdf = gdf.to_crs("EPSG:3857")
    
    # Rename GeoJSON nam column to match prefecture_en
    gdf = gdf.rename(columns={"nam": "prefecture_en"})
    
    # Clean up names in GeoJSON just in case (e.g. "Tokyo To" -> "Tokyo")
    def clean_geo_name(name):
        name = str(name).replace(" To", "").replace(" Fu", "").replace(" Ken", "")
        name = name.replace("Hokkai Do", "Hokkaido")
        return name.strip()
    gdf["prefecture_en"] = gdf["prefecture_en"].apply(clean_geo_name)
    
    # 2. Compute Target Variable
    pop_2020 = pd.to_numeric(df_2020.set_index("prefecture_en")["population"].astype(str).str.replace(',', ''), errors='coerce')
    pop_2024 = pd.to_numeric(df_2024.set_index("prefecture_en")["population"].astype(str).str.replace(',', ''), errors='coerce')
    pop_change_pct = ((pop_2024 - pop_2020) / pop_2020) * 100
    
    # 3. Initialize Feature Matrix
    features = pd.DataFrame(index=pop_change_pct.index)
    features["target_pop_change_pct"] = pop_change_pct
    features["population_2024"] = pop_2024
    features["population_2020"] = pop_2020
    
    # 4. Add Features
    # GDP
    features["gdp_usd_ppp_2014"] = pd.to_numeric(df_gdp.set_index("prefecture_en")["gdp_usd_ppp"].astype(str).str.replace(',', ''), errors='coerce')
    
    # Aging Rate (2024)
    features["aging_rate_pct"] = pd.to_numeric(df_2024.set_index("prefecture_en")["aging_rate_pct"].astype(str).str.replace(',', ''), errors='coerce')
    
    # Net Migration Rate (Average of 2020 and 2024, or just 2024)
    features["net_migration_rate"] = pd.to_numeric(df_2024.set_index("prefecture_en")["net_migration_rate"].astype(str).str.replace(',', ''), errors='coerce')
    
    # Vacant Housing Rate
    features["vacancy_rate_pct"] = df_vac.set_index("prefecture_en")["vacancy_rate_pct"]
    
    # Region
    features["region"] = df_mapping.set_index("pref_en")["region"]
    
    # Spatial: Distance to Tokyo (in km)
    tokyo_centroid = gdf[gdf["prefecture_en"] == "Tokyo"].geometry.centroid.iloc[0]
    gdf_centroids = gdf.set_index("prefecture_en").geometry.centroid
    dist_to_tokyo = gdf_centroids.distance(tokyo_centroid) / 1000  # meters to km
    features["dist_to_tokyo_km"] = dist_to_tokyo
    
    # Reset index to have prefecture_en as a column
    features = features.reset_index()
    
    # Handle any potential NaNs (e.g. from missing joins)
    # The requirement strictly says 47 rows, so let's verify.
    print(f"Master panel shape: {features.shape}")
    print("Missing values per column:")
    print(features.isna().sum())
    
    # Save to disk
    features.to_csv(proc_dir / "master_panel.csv", index=False)
    print("Master panel saved to data/processed/master_panel.csv")

if __name__ == "__main__":
    main()

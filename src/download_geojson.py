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

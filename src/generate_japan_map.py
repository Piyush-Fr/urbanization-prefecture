import geopandas as gpd
import matplotlib.pyplot as plt
import os

input_geojson = "data/raw/geospatial/prefectures.geojson"
output_image = "web/frontend/public/img/japan_map.png"

print("Loading GeoJSON...")
gdf = gpd.read_file(input_geojson)

print("Generating silhouette...")
fig, ax = plt.subplots(figsize=(15, 15), dpi=300)

# Plot solid black shape
gdf.plot(ax=ax, color='black', edgecolor='black', linewidth=0.5)

ax.set_axis_off()
plt.subplots_adjust(top=1, bottom=0, right=1, left=0, hspace=0, wspace=0)
plt.margins(0, 0)

os.makedirs(os.path.dirname(output_image), exist_ok=True)
plt.savefig(output_image, format='png', transparent=True, bbox_inches='tight', pad_inches=0)

print(f"Successfully saved silhouette to {output_image}")

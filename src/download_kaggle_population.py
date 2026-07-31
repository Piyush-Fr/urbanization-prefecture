import kagglehub
import pandas as pd
from pathlib import Path

# Download dataset (auto-caches to ~/.cache/kagglehub)
path = kagglehub.dataset_download("jd1325/japan-population-data")
print(f"Downloaded to: {path}")

# Find CSV file
csv_files = list(Path(path).glob("*.csv"))
df_pop = pd.read_csv(csv_files[0])
print(df_pop.head())
print(df_pop.columns.tolist())
print(f"Shape: {df_pop.shape}")
print(f"Years: {df_pop['year'].min()}–{df_pop['year'].max()}")
print(f"Prefectures: {df_pop['prefecture'].nunique()}")

# Save to project data/raw
out_dir = Path("data/raw")
out_dir.mkdir(parents=True, exist_ok=True)
df_pop.to_csv(out_dir / "kaggle_japan_population_1870_2015.csv", index=False)
print(f"Saved to {out_dir / 'kaggle_japan_population_1870_2015.csv'}")

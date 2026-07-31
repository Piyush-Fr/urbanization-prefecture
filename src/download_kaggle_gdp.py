import kagglehub
import pandas as pd
from pathlib import Path

path = kagglehub.dataset_download("mathurinache/list-of-japanese-prefectures-by-gdp")
print(f"Downloaded to: {path}")

csv_files = list(Path(path).glob("*.csv"))
df_gdp = pd.read_csv(csv_files[0])
print(df_gdp.head())
print(df_gdp.columns.tolist())
print(f"Shape: {df_gdp.shape}")

out_dir = Path("data/raw")
out_dir.mkdir(parents=True, exist_ok=True)
df_gdp.to_csv(out_dir / "kaggle_japan_prefecture_gdp.csv", index=False)
print(f"Saved to {out_dir / 'kaggle_japan_prefecture_gdp.csv'}")

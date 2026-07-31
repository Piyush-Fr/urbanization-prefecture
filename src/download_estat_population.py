import requests
from pathlib import Path
import pandas as pd

# Known stable URLs (verify on e-Stat first)
urls = {
    2020: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000032000000&fileKind=0",
    2021: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000032000001&fileKind=0",
    2022: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000032000002&fileKind=0",
    2023: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000032000003&fileKind=0",
    2024: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000032000004&fileKind=0",
}

out_dir = Path("data/raw/estat")
out_dir.mkdir(parents=True, exist_ok=True)

for year, url in urls.items():
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        filepath = out_dir / f"population_estimates_{year}.xlsx"
        filepath.write_bytes(resp.content)
        print(f"Downloaded {year}: {filepath}")
    except Exception as e:
        print(f"Failed {year}: {e}")
        print(f"  → Manual download needed: {url}")

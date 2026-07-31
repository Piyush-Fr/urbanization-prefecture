import requests
from pathlib import Path

url = "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000032000010&fileKind=0"
out_dir = Path("data/raw/estat")
out_dir.mkdir(parents=True, exist_ok=True)

try:
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    filepath = out_dir / "aging_rate_by_prefecture.xlsx"
    filepath.write_bytes(resp.content)
    print(f"Saved: {filepath}")
except Exception as e:
    print(f"Failed to download aging rate: {e}")
    print(f"Please download manually from: {url}")

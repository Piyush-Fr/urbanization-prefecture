from fastapi import FastAPI, APIRouter
from fastapi.responses import JSONResponse
import pandas as pd
import json
import os
from pathlib import Path
from functools import lru_cache

router = APIRouter(prefix="/api")

# Paths
BASE_DIR = Path(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
GEOJSON_PATH = BASE_DIR / "data" / "raw" / "geospatial" / "prefectures_simplified.geojson"
PROJECTIONS_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'prophet_projections_2035.csv')
SPATIAL_PANEL_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'spatial_panel.csv')

CACHE_HEADERS = {"Cache-Control": "public, max-age=3600"}

@lru_cache(maxsize=1)
def load_geojson():
    with open(GEOJSON_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

@router.get("/geojson")
def get_geojson():
    return JSONResponse(content=load_geojson(), headers=CACHE_HEADERS)

@lru_cache(maxsize=1)
def load_predictions():
    df = pd.read_csv(PROJECTIONS_PATH)
    return df.to_dict(orient="records")

@router.get("/predictions")
def get_predictions():
    return JSONResponse(content=load_predictions(), headers=CACHE_HEADERS)

@router.get("/feature-impacts")
def get_feature_impacts():
    # Hardcoded Ridge coefficients from Phase 4 for fast serving
    impacts = [
        {"feature": "Aging Rate", "coefficient": -0.938916, "type": "negative"},
        {"feature": "Net Migration Rate", "coefficient": 0.674184, "type": "positive"},
        {"feature": "GDP (USD PPP)", "coefficient": -0.138222, "type": "negative"},
        {"feature": "Log Population 2020", "coefficient": 0.129218, "type": "positive"},
        {"feature": "Vacancy Rate", "coefficient": 0.094925, "type": "positive"},
        {"feature": "Distance to Tokyo", "coefficient": 0.061088, "type": "positive"}
    ]
    return JSONResponse(content=impacts, headers=CACHE_HEADERS)

@lru_cache(maxsize=1)
def load_spatial_data():
    df = pd.read_csv(SPATIAL_PANEL_PATH)
    
    # Calculate median for classification
    median_val = df['target_pop_change_pct'].median()
    df['is_above_median'] = df['target_pop_change_pct'] >= median_val
    df['national_median'] = median_val

    cols = [
        'prefecture_en', 
        'target_pop_change_pct', 
        'is_above_median',
        'national_median',
        'population_2020', 
        'population_2024',
        'aging_rate_pct',
        'net_migration_rate',
        'gdp_usd_ppp_2014',
        'vacancy_rate_pct',
        'dist_to_tokyo_km'
    ]
    return df[cols].to_dict(orient="records")

@router.get("/spatial-data")
def get_spatial_data():
    return JSONResponse(content=load_spatial_data(), headers=CACHE_HEADERS)

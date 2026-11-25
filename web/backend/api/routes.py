import json
from functools import lru_cache
from pathlib import Path

import pandas as pd
from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api")

DATA = Path(__file__).resolve().parents[3] / "data"
PROC = DATA / "processed"
CACHE_HEADERS = {"Cache-Control": "public, max-age=3600"}


def cached(payload):
    return JSONResponse(content=payload, headers=CACHE_HEADERS)


@lru_cache(maxsize=1)
def load_meta():
    return json.loads((PROC / "model_meta.json").read_text())


@lru_cache(maxsize=1)
def load_spatial_data():
    df = pd.read_csv(PROC / "spatial_panel.csv").merge(
        pd.read_csv(PROC / "model_outputs.csv"), on="prefecture_en"
    ).merge(
        pd.read_csv(PROC / "projections_2035.csv")[["prefecture_en", "pop_2035", "projected_change_pct"]],
        on="prefecture_en",
    )
    median = df["target_pop_change_pct"].median()
    df["is_above_median"] = df["target_pop_change_pct"] >= median
    df["national_median"] = median
    cols = [
        "prefecture_en", "target_pop_change_pct", "predicted_change_pct", "residual",
        "lisa_cluster", "lisa_p", "is_above_median", "national_median",
        "population_2020", "population_2024", "pop_2035", "projected_change_pct",
        "aging_rate_pct", "net_migration_rate", "gdp_usd_ppp_2014", "vacancy_rate_pct", "dist_to_tokyo_km",
    ]
    return df[cols].to_dict(orient="records")


@lru_cache(maxsize=1)
def load_geojson():
    return json.loads((DATA / "raw" / "geospatial" / "prefectures_simplified.geojson").read_text(encoding="utf-8"))


@router.get("/spatial-data")
def get_spatial_data():
    return cached(load_spatial_data())


@router.get("/geojson")
def get_geojson():
    return cached(load_geojson())


@router.get("/feature-impacts")
def get_feature_impacts():
    return cached(load_meta()["features"])


@router.get("/model-meta")
def get_model_meta():
    return cached(load_meta())


@router.get("/predictions")
def get_predictions():
    return cached([
        {k: d[k] for k in ("prefecture_en", "population_2024", "pop_2035", "projected_change_pct")}
        for d in load_spatial_data()
    ])

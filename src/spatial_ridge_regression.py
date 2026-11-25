"""Train the Ridge model, evaluate it with LOOCV, run LISA on its residuals,
and write everything the API serves:

  data/processed/model_outputs.csv  per-prefecture prediction, residual, LISA cluster
  data/processed/model_meta.json    coefficients, scaler stats, metrics
"""
import json
import warnings
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
import spreg
from esda.moran import Moran, Moran_Local
from libpysal.weights import KNN
from sklearn.linear_model import Ridge
from sklearn.metrics import (accuracy_score, f1_score, mean_absolute_error,
                             mean_squared_error, precision_score, r2_score, recall_score)
from sklearn.model_selection import LeaveOneOut, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")
ROOT = Path(__file__).resolve().parent.parent
PROC = ROOT / "data" / "processed"
ALPHA = 5.0
K = 4  # neighbours; KNN instead of Queen so island prefectures (Hokkaido, Okinawa) still have neighbours

FEATURES = {  # column -> label shown in the dashboard
    "log_pop_2020": "Log Population 2020",
    "gdp_usd_ppp_2014": "GDP (USD PPP)",
    "aging_rate_pct": "Aging Rate",
    "net_migration_rate": "Net Migration Rate",
    "vacancy_rate_pct": "Vacancy Rate",
    "dist_to_tokyo_km": "Distance to Tokyo",
}
LISA_LABELS = {1: "HH", 2: "LH", 3: "LL", 4: "HL"}


def main():
    df = pd.read_csv(PROC / "spatial_panel.csv")
    gdf = gpd.read_file(ROOT / "data" / "raw" / "geospatial" / "prefectures.geojson")
    gdf["prefecture_en"] = (gdf["nam"].str.replace(r" (To|Fu|Ken)$", "", regex=True)
                            .str.replace("Hokkai Do", "Hokkaido"))
    merged = gdf[["prefecture_en", "geometry"]].merge(df, on="prefecture_en").to_crs("EPSG:3857")
    assert len(merged) == 47, len(merged)

    # population_2024 is excluded: the target is derived from it.
    merged["log_pop_2020"] = np.log(merged["population_2020"])
    X = merged[list(FEATURES)].values
    y = merged["target_pop_change_pct"].values

    # LOOCV: the scaler is refit inside every fold, so the held-out prefecture never leaks into scaling.
    model = make_pipeline(StandardScaler(), Ridge(alpha=ALPHA))
    pred = cross_val_predict(model, X, y, cv=LeaveOneOut())
    resid = y - pred  # positive = population held up better than predicted

    median = float(np.median(y))
    y_cls, p_cls = y >= median, pred >= median
    metrics = {
        "loocv_rmse": float(np.sqrt(mean_squared_error(y, pred))),
        "loocv_mae": float(mean_absolute_error(y, pred)),
        "loocv_r2": float(r2_score(y, pred)),
        "median_threshold_pct": median,
        "accuracy": float(accuracy_score(y_cls, p_cls)),
        "precision": float(precision_score(y_cls, p_cls)),
        "recall": float(recall_score(y_cls, p_cls)),
        "f1": float(f1_score(y_cls, p_cls)),
    }

    # Spatial diagnostics on the residuals.
    w = KNN.from_dataframe(merged, k=K)
    w.transform = "r"
    moran = Moran(resid, w, permutations=999)
    lisa = Moran_Local(resid, w, permutations=999, seed=0)
    cluster = [LISA_LABELS[q] if p < 0.05 else "NS" for q, p in zip(lisa.q, lisa.p_sim)]
    metrics["residual_morans_i"] = float(moran.I)
    metrics["residual_morans_p"] = float(moran.p_sim)

    slm = spreg.ML_Lag(y.reshape(-1, 1), StandardScaler().fit_transform(X), w,
                       name_y="target_pop_change_pct", name_x=list(FEATURES))
    metrics["spatial_lag_rho"] = float(slm.rho)

    # Final model on all 47 rows: its coefficients drive the SHAP bars and the what-if sliders.
    model.fit(X, y)
    scaler, ridge = model[0], model[1]
    meta = {
        "alpha": ALPHA,
        "intercept": float(ridge.intercept_),
        "metrics": metrics,
        "features": [
            {"key": k, "feature": label, "coefficient": float(c), "mean": float(m), "scale": float(s),
             "type": "positive" if c > 0 else "negative"}
            for (k, label), c, m, s in zip(FEATURES.items(), ridge.coef_, scaler.mean_, scaler.scale_)
        ],
    }
    # Self-check: the dashboard rebuilds predictions as intercept + Σ coef·(x−mean)/scale.
    manual = meta["intercept"] + sum(f["coefficient"] * (merged[f["key"]] - f["mean"]) / f["scale"] for f in meta["features"])
    assert np.allclose(manual, model.predict(X)), "coefficient export does not reproduce the model"

    out = pd.DataFrame({
        "prefecture_en": merged["prefecture_en"],
        "predicted_change_pct": pred,
        "residual": resid,
        "lisa_cluster": cluster,
        "lisa_p": lisa.p_sim,
    })
    out.to_csv(PROC / "model_outputs.csv", index=False)
    (PROC / "model_meta.json").write_text(json.dumps(meta, indent=2))

    print(slm.summary)
    print(json.dumps(metrics, indent=2))
    print(pd.DataFrame(meta["features"])[["feature", "coefficient"]]
          .sort_values("coefficient", key=abs, ascending=False).to_string(index=False))
    print("LISA clusters:", pd.Series(cluster).value_counts().to_dict())


if __name__ == "__main__":
    main()

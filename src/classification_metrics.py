"""
Classification metrics for the Ridge Regression model.

Since the model predicts a continuous value (pop_change_pct),
we derive classification metrics by thresholding:
  - Actual  >= 0  → class 1 (Growing)
  - Actual  <  0  → class 0 (Declining)
  - Predicted >= 0 → class 1 (Growing)
  - Predicted <  0 → class 0 (Declining)

Then we compute:
  Accuracy, Precision, Recall, F1-score (binary + macro avg)
"""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import LeaveOneOut
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)
import geopandas as gpd

BASE_DIR = Path(__file__).parent.parent

# ── Load data ──────────────────────────────────────────────────────────
df = pd.read_csv(BASE_DIR / "data" / "processed" / "spatial_panel.csv")

features = [
    "log_pop_2020",
    "gdp_usd_ppp_2014",
    "aging_rate_pct",
    "net_migration_rate",
    "vacancy_rate_pct",
    "dist_to_tokyo_km",
]

df["log_pop_2020"] = np.log(df["population_2020"])

X = df[features].values
y = df["target_pop_change_pct"].values

# ── LOOCV predictions (same setup as training) ─────────────────────────
scaler = StandardScaler()
ridge  = Ridge(alpha=5.0)
loo    = LeaveOneOut()

y_true, y_pred_cont = [], []

for train_idx, test_idx in loo.split(X):
    X_train, X_test = X[train_idx], X[test_idx]
    y_train, y_test = y[train_idx], y[test_idx]

    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    ridge.fit(X_train_s, y_train)
    y_pred_cont.append(ridge.predict(X_test_s)[0])
    y_true.append(y_test[0])

y_true      = np.array(y_true)
y_pred_cont = np.array(y_pred_cont)

# ── Convert regression outputs → binary classes (Median Threshold) ──
median_val = np.median(y_true)
print(f"Using median threshold: {median_val:.4f}%")

# class 1 = Above Median, class 0 = Below Median
y_true_cls = (y_true      >= median_val).astype(int)
y_pred_cls = (y_pred_cont >= median_val).astype(int)

# ── Metrics ────────────────────────────────────────────────────────────
acc  = accuracy_score (y_true_cls, y_pred_cls)
prec = precision_score(y_true_cls, y_pred_cls, zero_division=0)
rec  = recall_score   (y_true_cls, y_pred_cls, zero_division=0)
f1   = f1_score       (y_true_cls, y_pred_cls, zero_division=0)

prec_macro = precision_score(y_true_cls, y_pred_cls, average="macro", zero_division=0)
rec_macro  = recall_score   (y_true_cls, y_pred_cls, average="macro", zero_division=0)
f1_macro   = f1_score       (y_true_cls, y_pred_cls, average="macro", zero_division=0)

cm = confusion_matrix(y_true_cls, y_pred_cls)

print("=" * 60)
print("  RIDGE REGRESSION — CLASSIFICATION METRICS (LOOCV)")
print("  Threshold: Predicted change >= 0 → Growing, else Declining")
print("=" * 60)

print(f"\n  Accuracy        : {acc:.4f}  ({acc*100:.1f}%)")
print(f"\n  --- Binary (class = Growing) ---")
print(f"  Precision       : {prec:.4f}")
print(f"  Recall          : {rec:.4f}")
print(f"  F1 Score        : {f1:.4f}")

print(f"\n  --- Macro Average (both classes equally weighted) ---")
print(f"  Macro Precision : {prec_macro:.4f}")
print(f"  Macro Recall    : {rec_macro:.4f}")
print(f"  Macro F1        : {f1_macro:.4f}")

print("\n  --- Confusion Matrix ---")
print(f"  (rows=Actual, cols=Predicted | 0=Declining, 1=Growing)")
print(f"  {cm}")

print("\n  --- Full Classification Report ---")
print(classification_report(
    y_true_cls, y_pred_cls,
    target_names=["Declining", "Growing"],
    zero_division=0,
))

print("=" * 60)
print("  Regression Metrics (for reference)")
from sklearn.metrics import mean_squared_error, r2_score
rmse = np.sqrt(mean_squared_error(y_true, y_pred_cont))
r2   = r2_score(y_true, y_pred_cont)
print(f"  LOOCV RMSE      : {rmse:.4f}")
print(f"  LOOCV R²        : {r2:.4f}")
print("=" * 60)

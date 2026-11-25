"""2035 population projection per prefecture.

Replaces the earlier Prophet fit: trained on 1950–2024 history, Prophet's linear
trend was dominated by post-war growth and projected 34 of 47 prefectures growing,
while 46 of 47 actually shrank in 2020–2024.

# ponytail: constant-rate extrapolation of the 2020–2024 trend; ignores the
# accelerating decline from aging. Swap in IPSS cohort-component projections
# (https://www.ipss.go.jp/) if the dashboard needs official numbers.
"""
from pathlib import Path

import pandas as pd

PROC = Path(__file__).resolve().parent.parent / "data" / "processed"


def project(pop_2020, pop_2024, year=2035):
    annual = (pop_2024 / pop_2020) ** (1 / 4)
    return pop_2024 * annual ** (year - 2024)


def main():
    df = pd.read_csv(PROC / "spatial_panel.csv")
    out = pd.DataFrame({"prefecture_en": df["prefecture_en"], "pop_2024": df["population_2024"]})
    out["pop_2035"] = project(df["population_2020"], df["population_2024"])
    out["projected_change_pct"] = (out["pop_2035"] / out["pop_2024"] - 1) * 100
    # Direction must match the observed trend for every prefecture.
    assert ((out["projected_change_pct"] > 0) == (df["target_pop_change_pct"] > 0)).all()
    out.to_csv(PROC / "projections_2035.csv", index=False)
    print(f"National 2024 → 2035: {out.pop_2024.sum():,.0f} → {out.pop_2035.sum():,.0f}")
    print(out.sort_values("projected_change_pct").iloc[[0, 1, 2, -3, -2, -1]].to_string(index=False))


if __name__ == "__main__":
    assert round(project(100.0, 100 * 1.1 ** 4, 2025), 6) == round(100 * 1.1 ** 5, 6)
    main()

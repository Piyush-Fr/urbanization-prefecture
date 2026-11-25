// Client-side use of the Ridge model exported by src/spatial_ridge_regression.py.
// prediction = intercept + Σ coefficient · (x − mean) / scale  (asserted in the training script)

export type Feature = { key: string; feature: string; coefficient: number; mean: number; scale: number };

// What-if shifts, in each feature's own units (‰ for migration, percentage points otherwise).
export type Shifts = { migration: number; aging: number; vacancy: number };
export const NO_SHIFT: Shifts = { migration: 0, aging: 0, vacancy: 0 };
const SHIFT_KEY: Record<keyof Shifts, string> = {
  migration: 'net_migration_rate',
  aging: 'aging_rate_pct',
  vacancy: 'vacancy_rate_pct',
};

const featureValue = (d: any, key: string) => (key === 'log_pop_2020' ? Math.log(d.population_2020) : d[key]);

/** Out-of-sample (LOOCV) prediction plus the model's response to the what-if shifts. */
export function simulatedChange(d: any, shifts: Shifts, features: Feature[]): number {
  let delta = 0;
  for (const k of Object.keys(shifts) as (keyof Shifts)[]) {
    const f = features.find(f => f.key === SHIFT_KEY[k]);
    if (f) delta += (f.coefficient / f.scale) * shifts[k];
  }
  return d.predicted_change_pct + delta;
}

/** Exact per-feature contributions of a linear model (= linear SHAP values), largest first. */
export function contributions(d: any, features: Feature[]) {
  return features
    .map(f => ({ name: f.feature, value: (f.coefficient * (featureValue(d, f.key) - f.mean)) / f.scale }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

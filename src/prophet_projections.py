import pandas as pd
import numpy as np
from prophet import Prophet
import os

# 1. Load Data
df_hist = pd.read_csv('data/raw/kaggle_japan_population_1870_2015.csv')
df_recent = pd.read_csv('data/processed/spatial_panel.csv')

# Clean prefecture names
def clean_geo_name(name):
    name = str(name).replace(" To", "").replace(" Fu", "").replace(" Ken", "").replace("-ken", "").replace("-fu", "").replace("-to", "")
    name = name.replace("Hokkai Do", "Hokkaido").replace("Hokkai-do", "Hokkaido")
    return name.strip()

df_hist['prefecture_en'] = df_hist['prefecture'].apply(clean_geo_name)

# 2. Prepare Data for Prophet
# Prophet needs 'ds' (datestamp) and 'y' (target)
# We will create a dictionary of dataframes, one per prefecture
all_projections = []

prefectures = df_recent['prefecture_en'].unique()

for pref in prefectures:
    # Get historical data for this prefecture
    pref_hist = df_hist[df_hist['prefecture_en'] == pref].copy()
    
    # Create ds and y
    # Convert 'year' (e.g. 1872.1667) to integer year
    pref_hist['year_int'] = pref_hist['year'].astype(int)
    # Take max population if there are duplicates for a year
    pref_hist = pref_hist.groupby('year_int')['population'].max().reset_index()
    
    # Create ds (YYYY-MM-DD)
    pref_hist['ds'] = pd.to_datetime(pref_hist['year_int'], format='%Y')
    pref_hist['y'] = pref_hist['population']
    
    df_ts = pref_hist[['ds', 'y']].copy()
    
    # Add 2020 and 2024 from spatial_panel
    recent_data = df_recent[df_recent['prefecture_en'] == pref].iloc[0]
    pop_2020 = recent_data['population_2020']
    pop_2024 = recent_data['population_2024']
    
    new_rows = pd.DataFrame({
        'ds': [pd.to_datetime('2020-01-01'), pd.to_datetime('2024-01-01')],
        'y': [pop_2020, pop_2024]
    })
    
    df_ts = pd.concat([df_ts, new_rows], ignore_index=True)
    df_ts = df_ts.sort_values('ds').reset_index(drop=True)
    
    # 3. Fit Meta Prophet
    # We use basic settings, limiting to post-1950 data for better modern trend fitting
    df_ts = df_ts[df_ts['ds'] >= '1950-01-01']
    
    m = Prophet(yearly_seasonality=False, weekly_seasonality=False, daily_seasonality=False)
    # Suppress cmdstanpy output to avoid massive log spam
    import logging
    logging.getLogger('cmdstanpy').setLevel(logging.ERROR)
    
    m.fit(df_ts)
    
    # 4. Forecast to 2035
    # From 2024 to 2035 is 11 years.
    future = m.make_future_dataframe(periods=11, freq='YS')
    forecast = m.predict(future)
    
    # Extract 2035 prediction
    pred_2035 = forecast[forecast['ds'].dt.year == 2035]['yhat'].values[0]
    
    all_projections.append({
        'prefecture_en': pref,
        'pop_2024': pop_2024,
        'prophet_pop_2035': pred_2035,
        'projected_change_pct': ((pred_2035 - pop_2024) / pop_2024) * 100
    })

# 5. Save Results
results_df = pd.DataFrame(all_projections)

# We can output this to be used in Phase 5 web app
results_df.to_csv('data/processed/prophet_projections_2035.csv', index=False)
print("Prophet projections for 2035 completed and saved to data/processed/prophet_projections_2035.csv")

# Print top growing and declining
print("\nTop 3 Highest Projected Growth (2024-2035):")
print(results_df.sort_values('projected_change_pct', ascending=False).head(3))
print("\nTop 3 Highest Projected Decline (2024-2035):")
print(results_df.sort_values('projected_change_pct', ascending=True).head(3))

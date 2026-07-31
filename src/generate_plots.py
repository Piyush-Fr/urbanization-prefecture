import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
import numpy as np
import shap

df = pd.read_csv('data/processed/spatial_panel.csv')

# 1. Distribution of Population Change
plt.figure(figsize=(10, 6))
sns.histplot(df['target_pop_change_pct'], bins=15, kde=True, color='#2ecc71')
plt.title('Distribution of Population Change (%) 2020-2024')
plt.xlabel('Population Change (%)')
plt.savefig(r'C:\Users\piyus\.gemini\antigravity-ide\brain\d1659fd8-8cad-4234-9b5a-066df21d9dbf\pop_dist.png')
plt.close()

# 2. Base Features Correlation Matrix
df['log_pop_2020'] = np.log(df['population_2020'])
base_features = [
    'log_pop_2020', 'gdp_usd_ppp_2014', 
    'aging_rate_pct', 'net_migration_rate', 'vacancy_rate_pct', 
    'dist_to_tokyo_km'
]
plt.figure(figsize=(10, 8))
corr = df[base_features].corr()
sns.heatmap(corr, annot=True, cmap='coolwarm', fmt=".2f", center=0)
plt.title('Base Feature Correlation Matrix (Collinear Lags Removed)')
plt.savefig(r'C:\Users\piyus\.gemini\antigravity-ide\brain\d1659fd8-8cad-4234-9b5a-066df21d9dbf\corr_matrix.png')
plt.close()

# 3. Ridge Coefficients Bar Chart
y = df['target_pop_change_pct'].values
X = df[base_features].values
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

ridge = Ridge(alpha=5.0)
ridge.fit(X_scaled, y)

coef_df = pd.DataFrame({'Feature': base_features, 'Coefficient': ridge.coef_})
coef_df = coef_df.sort_values(by='Coefficient', ascending=True) # Sort for horizontal bar chart

plt.figure(figsize=(10, 6))
sns.barplot(x='Coefficient', y='Feature', data=coef_df, palette='vlag')
plt.title('Ridge Regression Feature Coefficients (L2 Alpha=5.0)')
plt.xlabel('Standardized Coefficient Impact on Population Change')
plt.axvline(0, color='black', linewidth=1)
plt.tight_layout()
plt.savefig(r'C:\Users\piyus\.gemini\antigravity-ide\brain\d1659fd8-8cad-4234-9b5a-066df21d9dbf\ridge_coefficients.png')
plt.close()

# 4. SHAP Summary for Ridge Model
explainer = shap.LinearExplainer(ridge, X_scaled)
shap_values = explainer.shap_values(X_scaled)

plt.figure(figsize=(10, 6))
shap.summary_plot(shap_values, X_scaled, feature_names=base_features, show=False)
plt.title('SHAP Summary (Ridge Model)')
plt.savefig(r'C:\Users\piyus\.gemini\antigravity-ide\brain\d1659fd8-8cad-4234-9b5a-066df21d9dbf\shap_summary.png', bbox_inches='tight')
plt.close()

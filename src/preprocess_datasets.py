import pandas as pd
from pathlib import Path
import glob

def normalize_prefecture_names(df, source_col, jp_to_en, target_col="prefecture_en"):
    """Map Japanese prefecture names to standard English names."""
    df = df.copy()
    
    df[source_col] = df[source_col].astype(str).str.strip()
    
    def clean_en(name):
        name = str(name).replace("-to", "").replace("-fu", "").replace("-ken", "")
        name = name.replace(" Prefecture", "").replace(" prefecture", "")
        name = name.replace("Gumma", "Gunma")
        return name.strip()

    df[target_col] = df[source_col].map(jp_to_en)
    
    mask = df[target_col].isna()
    df.loc[mask, target_col] = df.loc[mask, source_col].apply(clean_en)
    
    known_en = set(jp_to_en.values())
    df = df[df[target_col].isin(known_en)]
    
    return df

def main():
    raw_dir = Path("data/raw")
    proc_dir = Path("data/processed")
    proc_dir.mkdir(parents=True, exist_ok=True)

    mapping = pd.read_csv(proc_dir / "prefecture_mapping.csv")
    jp_to_en = dict(zip(mapping["pref_jp"], mapping["pref_en"]))
    
    # -------------------------------------------------------------
    # 1. e-Stat Time Series
    # -------------------------------------------------------------
    estat_files = glob.glob(str(raw_dir / "estat" / "FEH_*.csv"))
    df_estat_list = []
    for f in estat_files:
        try:
            df = pd.read_csv(f, skiprows=12, encoding="utf-8")
        except UnicodeDecodeError:
            df = pd.read_csv(f, skiprows=12, encoding="shift-jis")
        df_estat_list.append(df)
        
    df_estat = pd.concat(df_estat_list, ignore_index=True)
    
    col_mapping = {
        "SURVEY YEAR": "year",
        "AREA": "area",
        "A1101_Total population (Both sexes)[person]": "population",
        "A1306_Ratio of population (65 years old and over)[%]": "aging_rate_pct",
        "A5301_Rates of net migration[permill]": "net_migration_rate",
        "A7101_Number of households (Total)[households]": "households"
    }
    
    keep_cols = [c for c in df_estat.columns if c in col_mapping.keys()]
    df_estat = df_estat[keep_cols].rename(columns=col_mapping)
    df_estat = normalize_prefecture_names(df_estat, "area", jp_to_en)
    
    # Filter 2020 and 2024
    df_estat_2020 = df_estat[df_estat["year"] == 2020].copy()
    df_estat_2024 = df_estat[df_estat["year"] == 2024].copy()
    
    # Net migration rate is often delayed. Get the most recent valid year per prefecture.
    df_mig = df_estat.copy()
    df_mig["net_migration_rate"] = pd.to_numeric(df_mig["net_migration_rate"], errors="coerce")
    df_mig = df_mig.dropna(subset=["net_migration_rate"])
    df_mig = df_mig.sort_values("year").groupby("prefecture_en").last().reset_index()
    
    # Add this to df_estat_2024 so downstream scripts have it
    df_estat_2024 = df_estat_2024.drop(columns=["net_migration_rate"], errors="ignore")
    df_estat_2024 = df_estat_2024.merge(df_mig[["prefecture_en", "net_migration_rate"]], on="prefecture_en", how="left")
    
    # Save base features
    df_estat_2024.to_csv(proc_dir / "estat_2024.csv", index=False)
    df_estat_2020.to_csv(proc_dir / "estat_2020.csv", index=False)
    
    # -------------------------------------------------------------
    # 2. Kaggle GDP
    # -------------------------------------------------------------
    df_gdp = pd.read_csv(raw_dir / "kaggle_japan_prefecture_gdp.csv")
    df_gdp = normalize_prefecture_names(df_gdp, "Prefecture", jp_to_en)
    df_gdp = df_gdp.rename(columns={"2014 GDP  (in millions of US$ PPP)": "gdp_usd_ppp"})
    df_gdp.to_csv(proc_dir / "gdp_normalized.csv", index=False)
    
    # -------------------------------------------------------------
    # 3. Vacant Housing
    # -------------------------------------------------------------
    # We will use estat_vac_2018.xlsx which has 2018 total vacant dwellings in column 17
    # Column 3 has the English names
    df_vac = pd.read_excel(raw_dir / "estat" / "estat_vac_2018.xlsx", header=None)
    
    # Normalize english names in column 3
    df_vac = normalize_prefecture_names(df_vac, 3, jp_to_en, "prefecture_en")
    df_vac = df_vac.rename(columns={17: "vacant_dwellings"})
    
    # Merge with 2020 households to compute rate (closest year)
    df_vac = df_vac.merge(df_estat_2020[["prefecture_en", "households"]], on="prefecture_en")
    
    # Vacancy rate = vacant / (households + vacant) * 100
    df_vac["vacant_dwellings"] = pd.to_numeric(df_vac["vacant_dwellings"].astype(str).str.replace(',', ''), errors="coerce")
    df_vac["households"] = pd.to_numeric(df_vac["households"].astype(str).str.replace(',', ''), errors="coerce")
    df_vac["vacancy_rate_pct"] = df_vac["vacant_dwellings"] / (df_vac["households"] + df_vac["vacant_dwellings"]) * 100
    
    df_vac[["prefecture_en", "vacancy_rate_pct"]].to_csv(proc_dir / "vacant_housing_normalized.csv", index=False)
    
    print("Preprocessing complete.")

if __name__ == "__main__":
    main()

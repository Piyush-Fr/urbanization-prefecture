import pandas as pd
from pathlib import Path

# Master mapping: all 47 prefectures
PREFECTURE_MAPPING = {
    # Hokkaido Region
    "北海道": {"en": "Hokkaido", "region": "Hokkaido", "pref_code": 1},
    # Tohoku Region
    "青森県": {"en": "Aomori", "region": "Tohoku", "pref_code": 2},
    "岩手県": {"en": "Iwate", "region": "Tohoku", "pref_code": 3},
    "宮城県": {"en": "Miyagi", "region": "Tohoku", "pref_code": 4},
    "秋田県": {"en": "Akita", "region": "Tohoku", "pref_code": 5},
    "山形県": {"en": "Yamagata", "region": "Tohoku", "pref_code": 6},
    "福島県": {"en": "Fukushima", "region": "Tohoku", "pref_code": 7},
    # Kanto Region
    "茨城県": {"en": "Ibaraki", "region": "Kanto", "pref_code": 8},
    "栃木県": {"en": "Tochigi", "region": "Kanto", "pref_code": 9},
    "群馬県": {"en": "Gunma", "region": "Kanto", "pref_code": 10},
    "埼玉県": {"en": "Saitama", "region": "Kanto", "pref_code": 11},
    "千葉県": {"en": "Chiba", "region": "Kanto", "pref_code": 12},
    "東京都": {"en": "Tokyo", "region": "Kanto", "pref_code": 13},
    "神奈川県": {"en": "Kanagawa", "region": "Kanto", "pref_code": 14},
    # Chubu Region
    "新潟県": {"en": "Niigata", "region": "Chubu", "pref_code": 15},
    "富山県": {"en": "Toyama", "region": "Chubu", "pref_code": 16},
    "石川県": {"en": "Ishikawa", "region": "Chubu", "pref_code": 17},
    "福井県": {"en": "Fukui", "region": "Chubu", "pref_code": 18},
    "山梨県": {"en": "Yamanashi", "region": "Chubu", "pref_code": 19},
    "長野県": {"en": "Nagano", "region": "Chubu", "pref_code": 20},
    "岐阜県": {"en": "Gifu", "region": "Chubu", "pref_code": 21},
    "静岡県": {"en": "Shizuoka", "region": "Chubu", "pref_code": 22},
    "愛知県": {"en": "Aichi", "region": "Chubu", "pref_code": 23},
    # Kansai Region
    "三重県": {"en": "Mie", "region": "Kansai", "pref_code": 24},
    "滋賀県": {"en": "Shiga", "region": "Kansai", "pref_code": 25},
    "京都府": {"en": "Kyoto", "region": "Kansai", "pref_code": 26},
    "大阪府": {"en": "Osaka", "region": "Kansai", "pref_code": 27},
    "兵庫県": {"en": "Hyogo", "region": "Kansai", "pref_code": 28},
    "奈良県": {"en": "Nara", "region": "Kansai", "pref_code": 29},
    "和歌山県": {"en": "Wakayama", "region": "Kansai", "pref_code": 30},
    # Chugoku Region
    "鳥取県": {"en": "Tottori", "region": "Chugoku", "pref_code": 31},
    "島根県": {"en": "Shimane", "region": "Chugoku", "pref_code": 32},
    "岡山県": {"en": "Okayama", "region": "Chugoku", "pref_code": 33},
    "広島県": {"en": "Hiroshima", "region": "Chugoku", "pref_code": 34},
    "山口県": {"en": "Yamaguchi", "region": "Chugoku", "pref_code": 35},
    # Shikoku Region
    "徳島県": {"en": "Tokushima", "region": "Shikoku", "pref_code": 36},
    "香川県": {"en": "Kagawa", "region": "Shikoku", "pref_code": 37},
    "愛媛県": {"en": "Ehime", "region": "Shikoku", "pref_code": 38},
    "高知県": {"en": "Kochi", "region": "Shikoku", "pref_code": 39},
    # Kyushu Region
    "福岡県": {"en": "Fukuoka", "region": "Kyushu", "pref_code": 40},
    "佐賀県": {"en": "Saga", "region": "Kyushu", "pref_code": 41},
    "長崎県": {"en": "Nagasaki", "region": "Kyushu", "pref_code": 42},
    "熊本県": {"en": "Kumamoto", "region": "Kyushu", "pref_code": 43},
    "大分県": {"en": "Oita", "region": "Kyushu", "pref_code": 44},
    "宮崎県": {"en": "Miyazaki", "region": "Kyushu", "pref_code": 45},
    "鹿児島県": {"en": "Kagoshima", "region": "Kyushu", "pref_code": 46},
    "沖縄県": {"en": "Okinawa", "region": "Kyushu", "pref_code": 47},
}

def main():
    # Create lookup DataFrames
    df_mapping = pd.DataFrame([
        {"pref_jp": jp, "pref_en": v["en"], "region": v["region"], "pref_code": v["pref_code"]}
        for jp, v in PREFECTURE_MAPPING.items()
    ])

    # Save mapping
    out_dir = Path("data/processed")
    out_dir.mkdir(parents=True, exist_ok=True)
    df_mapping.to_csv(out_dir / "prefecture_mapping.csv", index=False)
    print(f"Saved mapping: {out_dir / 'prefecture_mapping.csv'}")

if __name__ == "__main__":
    main()

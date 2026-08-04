// Static lookup table for all 47 Japanese prefectures
// Maps English name (lowercase) → Japanese Kanji name + region

export interface PrefectureInfo {
  en: string;
  jp: string;
  region: string;
  lat: number;
  lng: number;
}

export const PREFECTURE_DATA: PrefectureInfo[] = [
  { en: 'Hokkaido',   jp: '北海道', region: 'Hokkaido',  lat: 43.2203, lng: 142.8635 },
  { en: 'Aomori',     jp: '青森県', region: 'Tohoku',    lat: 40.8244, lng: 140.7400 },
  { en: 'Iwate',      jp: '岩手県', region: 'Tohoku',    lat: 39.7036, lng: 141.1527 },
  { en: 'Miyagi',     jp: '宮城県', region: 'Tohoku',    lat: 38.2688, lng: 140.8721 },
  { en: 'Akita',      jp: '秋田県', region: 'Tohoku',    lat: 39.7186, lng: 140.1024 },
  { en: 'Yamagata',   jp: '山形県', region: 'Tohoku',    lat: 38.2404, lng: 140.3634 },
  { en: 'Fukushima',  jp: '福島県', region: 'Tohoku',    lat: 37.7500, lng: 140.4676 },
  { en: 'Ibaraki',    jp: '茨城県', region: 'Kanto',     lat: 36.3418, lng: 140.4468 },
  { en: 'Tochigi',    jp: '栃木県', region: 'Kanto',     lat: 36.5657, lng: 139.8836 },
  { en: 'Gunma',      jp: '群馬県', region: 'Kanto',     lat: 36.3911, lng: 139.0607 },
  { en: 'Saitama',    jp: '埼玉県', region: 'Kanto',     lat: 35.8572, lng: 139.6489 },
  { en: 'Chiba',      jp: '千葉県', region: 'Kanto',     lat: 35.6047, lng: 140.1233 },
  { en: 'Tokyo',      jp: '東京都', region: 'Kanto',     lat: 35.6762, lng: 139.6503 },
  { en: 'Kanagawa',   jp: '神奈川県', region: 'Kanto',   lat: 35.4478, lng: 139.6425 },
  { en: 'Niigata',    jp: '新潟県', region: 'Chubu',     lat: 37.9026, lng: 139.0232 },
  { en: 'Toyama',     jp: '富山県', region: 'Chubu',     lat: 36.6953, lng: 137.2113 },
  { en: 'Ishikawa',   jp: '石川県', region: 'Chubu',     lat: 36.5947, lng: 136.6256 },
  { en: 'Fukui',      jp: '福井県', region: 'Chubu',     lat: 35.9436, lng: 136.1883 },
  { en: 'Yamanashi',  jp: '山梨県', region: 'Chubu',     lat: 35.6635, lng: 138.5685 },
  { en: 'Nagano',     jp: '長野県', region: 'Chubu',     lat: 36.6518, lng: 138.1810 },
  { en: 'Shizuoka',   jp: '静岡県', region: 'Chubu',     lat: 34.9769, lng: 138.3831 },
  { en: 'Aichi',      jp: '愛知県', region: 'Chubu',     lat: 35.1802, lng: 136.9066 },
  { en: 'Mie',        jp: '三重県', region: 'Kinki',     lat: 34.7303, lng: 136.5086 },
  { en: 'Shiga',      jp: '滋賀県', region: 'Kinki',     lat: 35.0045, lng: 135.8686 },
  { en: 'Kyoto',      jp: '京都府', region: 'Kinki',     lat: 35.0116, lng: 135.7681 },
  { en: 'Osaka',      jp: '大阪府', region: 'Kinki',     lat: 34.6937, lng: 135.5022 },
  { en: 'Hyogo',      jp: '兵庫県', region: 'Kinki',     lat: 34.6913, lng: 135.1830 },
  { en: 'Nara',       jp: '奈良県', region: 'Kinki',     lat: 34.6851, lng: 135.8325 },
  { en: 'Wakayama',   jp: '和歌山県', region: 'Kinki',   lat: 34.2260, lng: 135.1675 },
  { en: 'Tottori',    jp: '鳥取県', region: 'Chugoku',   lat: 35.5011, lng: 134.2351 },
  { en: 'Shimane',    jp: '島根県', region: 'Chugoku',   lat: 35.4723, lng: 133.0505 },
  { en: 'Okayama',    jp: '岡山県', region: 'Chugoku',   lat: 34.6618, lng: 133.9344 },
  { en: 'Hiroshima',  jp: '広島県', region: 'Chugoku',   lat: 34.3966, lng: 132.4596 },
  { en: 'Yamaguchi',  jp: '山口県', region: 'Chugoku',   lat: 34.1859, lng: 131.4706 },
  { en: 'Tokushima',  jp: '徳島県', region: 'Shikoku',   lat: 34.0657, lng: 134.5593 },
  { en: 'Kagawa',     jp: '香川県', region: 'Shikoku',   lat: 34.3401, lng: 134.0434 },
  { en: 'Ehime',      jp: '愛媛県', region: 'Shikoku',   lat: 33.8416, lng: 132.7657 },
  { en: 'Kochi',      jp: '高知県', region: 'Shikoku',   lat: 33.5597, lng: 133.5311 },
  { en: 'Fukuoka',    jp: '福岡県', region: 'Kyushu',    lat: 33.6064, lng: 130.4183 },
  { en: 'Saga',       jp: '佐賀県', region: 'Kyushu',    lat: 33.2494, lng: 130.2990 },
  { en: 'Nagasaki',   jp: '長崎県', region: 'Kyushu',    lat: 32.7503, lng: 129.8777 },
  { en: 'Kumamoto',   jp: '熊本県', region: 'Kyushu',    lat: 32.7898, lng: 130.7417 },
  { en: 'Oita',       jp: '大分県', region: 'Kyushu',    lat: 33.2382, lng: 131.6126 },
  { en: 'Miyazaki',   jp: '宮崎県', region: 'Kyushu',    lat: 31.9110, lng: 131.4235 },
  { en: 'Kagoshima',  jp: '鹿児島県', region: 'Kyushu',  lat: 31.5602, lng: 130.5581 },
  { en: 'Okinawa',    jp: '沖縄県', region: 'Okinawa',   lat: 26.2124, lng: 127.6809 },
];

// Lookup map by English name (case-insensitive)
export const KANJI_MAP = new Map<string, PrefectureInfo>(
  PREFECTURE_DATA.map(p => [p.en.toLowerCase(), p])
);

export function getPrefectureInfo(enName: string): PrefectureInfo | undefined {
  if (!enName) return undefined;
  // Try direct match
  const direct = KANJI_MAP.get(enName.toLowerCase());
  if (direct) return direct;
  // Try stripping suffixes
  const clean = enName.replace(/\s*(fu|to|ken|do|prefecture)$/i, '').trim().toLowerCase();
  return KANJI_MAP.get(clean);
}

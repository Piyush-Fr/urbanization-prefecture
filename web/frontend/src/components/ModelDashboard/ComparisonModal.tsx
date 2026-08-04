import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { X, ChevronDown } from 'lucide-react';
import { getPrefectureInfo } from '@/lib/kanjiLookup';
import { PREFECTURE_DATA } from '@/lib/kanjiLookup';

interface ComparisonModalProps {
  prefectureA: string;
  spatialData: any[];
  featureImpacts: any[];
  onClose: () => void;
}

const FEATURE_KEYS = [
  { key: 'aging_rate_pct',      id: 'Aging Rate',           log: false, unit: '%',    lowerIsBetter: true },
  { key: 'net_migration_rate',  id: 'Net Migration Rate',   log: false, unit: '/1k',  lowerIsBetter: false },
  { key: 'gdp_usd_ppp_2014',    id: 'GDP (USD PPP)',        log: false, unit: '$',    lowerIsBetter: false },
  { key: 'population_2020',     id: 'Log Population 2020',  log: true,  unit: '',     lowerIsBetter: false },
  { key: 'vacancy_rate_pct',    id: 'Vacancy Rate',         log: false, unit: '%',    lowerIsBetter: true },
  { key: 'dist_to_tokyo_km',    id: 'Dist to Tokyo',        log: false, unit: 'km',   lowerIsBetter: false },
];

function getShap(pref: any, spatialData: any[], featureImpacts: any[]) {
  const stats: Record<string, { mean: number; std: number }> = {};
  FEATURE_KEYS.forEach(f => {
    const vals = spatialData.map(d => (f.log ? Math.log(d[f.key] || 1) : d[f.key]));
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
    stats[f.id] = { mean, std: Math.sqrt(variance) || 1 };
  });

  return featureImpacts.map(impact => {
    const fk = FEATURE_KEYS.find(f => f.id === impact.feature);
    if (!fk || !stats[impact.feature]) return { name: impact.feature, value: 0 };
    const rawVal = fk.log ? Math.log(pref[fk.key] || 1) : pref[fk.key];
    const zScore = (rawVal - stats[impact.feature].mean) / stats[impact.feature].std;
    return { name: impact.feature, value: zScore * impact.coefficient };
  }).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

export default function ComparisonModal({ prefectureA, spatialData, featureImpacts, onClose }: ComparisonModalProps) {
  const [prefBName, setPrefBName] = useState<string>(() => {
    // Default to a different prefecture
    const other = PREFECTURE_DATA.find(p => p.en !== prefectureA);
    return other?.en || '';
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const prefA = useMemo(() => spatialData.find(d => d.prefecture_en?.toLowerCase() === prefectureA.toLowerCase()), [prefectureA, spatialData]);
  const prefB = useMemo(() => spatialData.find(d => d.prefecture_en?.toLowerCase() === prefBName.toLowerCase()), [prefBName, spatialData]);

  const shapA = useMemo(() => prefA ? getShap(prefA, spatialData, featureImpacts) : [], [prefA, spatialData, featureImpacts]);
  const shapB = useMemo(() => prefB ? getShap(prefB, spatialData, featureImpacts) : [], [prefB, spatialData, featureImpacts]);

  const infoA = getPrefectureInfo(prefectureA);
  const infoB = getPrefectureInfo(prefBName);

  if (!prefA || !prefB) return null;

  const metrics = [
    { label: 'Predicted Change', valA: `${prefA.target_pop_change_pct.toFixed(2)}%`, valB: `${prefB.target_pop_change_pct.toFixed(2)}%`, numA: prefA.target_pop_change_pct, numB: prefB.target_pop_change_pct, lowerIsBetter: false },
    { label: 'Aging Rate', valA: `${prefA.aging_rate_pct.toFixed(1)}%`, valB: `${prefB.aging_rate_pct.toFixed(1)}%`, numA: prefA.aging_rate_pct, numB: prefB.aging_rate_pct, lowerIsBetter: true },
    { label: 'Net Migration', valA: `${prefA.net_migration_rate > 0 ? '+' : ''}${prefA.net_migration_rate.toFixed(1)}/1k`, valB: `${prefB.net_migration_rate > 0 ? '+' : ''}${prefB.net_migration_rate.toFixed(1)}/1k`, numA: prefA.net_migration_rate, numB: prefB.net_migration_rate, lowerIsBetter: false },
    { label: 'GDP (PPP)', valA: `$${Math.round(prefA.gdp_usd_ppp_2014 / 1000)}k`, valB: `$${Math.round(prefB.gdp_usd_ppp_2014 / 1000)}k`, numA: prefA.gdp_usd_ppp_2014, numB: prefB.gdp_usd_ppp_2014, lowerIsBetter: false },
    { label: 'Vacancy Rate', valA: `${prefA.vacancy_rate_pct?.toFixed(1) ?? 'N/A'}%`, valB: `${prefB.vacancy_rate_pct?.toFixed(1) ?? 'N/A'}%`, numA: prefA.vacancy_rate_pct ?? 0, numB: prefB.vacancy_rate_pct ?? 0, lowerIsBetter: true },
    { label: 'Population 2024', valA: prefA.population_2024.toLocaleString(), valB: prefB.population_2024.toLocaleString(), numA: prefA.population_2024, numB: prefB.population_2024, lowerIsBetter: false },
    { label: 'Dist. to Tokyo', valA: `${Math.round(prefA.dist_to_tokyo_km ?? 0)} km`, valB: `${Math.round(prefB.dist_to_tokyo_km ?? 0)} km`, numA: prefA.dist_to_tokyo_km ?? 0, numB: prefB.dist_to_tokyo_km ?? 0, lowerIsBetter: false },
  ];

  function winner(numA: number, numB: number, lowerIsBetter: boolean): 'A' | 'B' | 'tie' {
    if (Math.abs(numA - numB) < 0.001) return 'tie';
    if (lowerIsBetter) return numA < numB ? 'A' : 'B';
    return numA > numB ? 'A' : 'B';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="sticky top-0 bg-[#0d0d0d]/95 backdrop-blur-md border-b border-white/10 px-8 py-5 flex items-center justify-between z-10">
          <h2 className="text-xl font-light tracking-widest uppercase text-white">Prefecture Comparison</h2>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/20 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-8 py-6">
          {/* Prefecture Headers */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="col-span-1" />

            {/* Prefecture A */}
            <div className="text-center bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-xl font-light text-white">{prefA.prefecture_en}</div>
              <div className="text-gray-400 tracking-widest mt-0.5">{infoA?.jp}</div>
              <div className={`text-2xl font-semibold mt-2 ${prefA.target_pop_change_pct >= 0 ? 'text-[#4caf50]' : 'text-[#e27676]'}`}>
                {prefA.target_pop_change_pct > 0 ? '+' : ''}{prefA.target_pop_change_pct.toFixed(2)}%
              </div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Pop Change</div>
            </div>

            {/* Prefecture B — Dropdown */}
            <div className="text-center bg-white/5 border border-[#e27676]/30 rounded-xl p-4 relative">
              <button
                onClick={() => setDropdownOpen(v => !v)}
                className="flex items-center justify-center gap-2 w-full"
              >
                <div>
                  <div className="text-xl font-light text-white">{prefB.prefecture_en}</div>
                  <div className="text-gray-400 tracking-widest mt-0.5">{infoB?.jp}</div>
                </div>
                <ChevronDown size={14} className="text-[#e27676] flex-shrink-0" />
              </button>
              <div className={`text-2xl font-semibold mt-2 ${prefB.target_pop_change_pct >= 0 ? 'text-[#4caf50]' : 'text-[#e27676]'}`}>
                {prefB.target_pop_change_pct > 0 ? '+' : ''}{prefB.target_pop_change_pct.toFixed(2)}%
              </div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Pop Change</div>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-white/20 rounded-xl z-20 max-h-60 overflow-y-auto shadow-2xl">
                  {PREFECTURE_DATA.filter(p => p.en !== prefectureA).map(p => (
                    <button
                      key={p.en}
                      onClick={() => { setPrefBName(p.en); setDropdownOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/10 text-left transition-colors"
                    >
                      <span className="text-sm text-white">{p.en}</span>
                      <span className="text-xs text-gray-500">{p.jp}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Metrics Comparison */}
          <div className="space-y-2 mb-10">
            <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Key Metrics</h3>
            {metrics.map(m => {
              const w = winner(m.numA, m.numB, m.lowerIsBetter);
              return (
                <div key={m.label} className="grid grid-cols-3 gap-4 items-center py-3 border-b border-white/5">
                  <div className="text-center text-xs text-gray-400 uppercase tracking-widest">{m.label}</div>
                  <div className={`text-center text-sm font-semibold ${w === 'A' ? 'text-[#4caf50]' : w === 'tie' ? 'text-gray-300' : 'text-white/50'}`}>
                    {m.valA}
                    {w === 'A' && <span className="ml-1.5 text-[9px] bg-[#4caf50]/20 text-[#4caf50] px-1.5 py-0.5 rounded uppercase tracking-widest">Better</span>}
                  </div>
                  <div className={`text-center text-sm font-semibold ${w === 'B' ? 'text-[#4caf50]' : w === 'tie' ? 'text-gray-300' : 'text-white/50'}`}>
                    {m.valB}
                    {w === 'B' && <span className="ml-1.5 text-[9px] bg-[#4caf50]/20 text-[#4caf50] px-1.5 py-0.5 rounded uppercase tracking-widest">Better</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dual SHAP Charts */}
          <div className="grid grid-cols-2 gap-6">
            {[{ label: prefA.prefecture_en, jp: infoA?.jp, data: shapA }, { label: prefB.prefecture_en, jp: infoB?.jp, data: shapB }].map((side, si) => (
              <div key={si}>
                <h3 className="text-xs font-medium text-gray-400 mb-1">
                  {side.label} <span className="text-gray-600">{side.jp}</span>
                </h3>
                <p className="text-[10px] text-gray-600 mb-3">SHAP Feature Impacts</p>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={side.data} layout="vertical" margin={{ top: 0, right: 16, left: 10, bottom: 0 }}>
                      <XAxis type="number" hide domain={['auto', 'auto']} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 9 }} width={120} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                        contentStyle={{ backgroundColor: '#111', borderColor: '#2a2a2a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                        formatter={(val: any) => [Number(val).toFixed(3), 'SHAP']}
                      />
                      <ReferenceLine x={0} stroke="#333" strokeDasharray="3 3" />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={14}>
                        {side.data.map((entry, i) => (
                          <Cell key={i} fill={entry.value > 0 ? '#4caf50' : '#e27676'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { X, TrendingDown, TrendingUp, Users, Activity, Home, MapPin, GitCompare } from 'lucide-react';
import { getPrefectureInfo } from '@/lib/kanjiLookup';

interface InspectorPanelProps {
  prefecture: string | null;
  spatialData: any[];
  featureImpacts: any[];
  onClose: () => void;
  onCompare: (prefecture: string) => void;
}

const FEATURE_KEYS = [
  { key: 'aging_rate_pct',      id: 'Aging Rate',           log: false },
  { key: 'net_migration_rate',  id: 'Net Migration Rate',   log: false },
  { key: 'gdp_usd_ppp_2014',    id: 'GDP (USD PPP)',        log: false },
  { key: 'population_2020',     id: 'Log Population 2020',  log: true  },
  { key: 'vacancy_rate_pct',    id: 'Vacancy Rate',         log: false },
  { key: 'dist_to_tokyo_km',    id: 'Distance to Tokyo',    log: false },
];

export default function InspectorPanel({
  prefecture,
  spatialData,
  featureImpacts,
  onClose,
  onCompare,
}: InspectorPanelProps) {
  const { prefData, shapData, maxAbs } = useMemo(() => {
    if (!prefecture || !spatialData.length || !featureImpacts.length) {
      return { prefData: null, shapData: [], maxAbs: 1 };
    }

    const pref = spatialData.find(
      d => d.prefecture_en?.toLowerCase() === prefecture.toLowerCase()
    );
    if (!pref) return { prefData: null, shapData: [], maxAbs: 1 };

    // Calculate means and stddevs across all prefectures
    const stats: Record<string, { mean: number; std: number }> = {};
    FEATURE_KEYS.forEach(f => {
      const vals = spatialData.map(d => (f.log ? Math.log(d[f.key] || 1) : d[f.key]));
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
      const std = Math.sqrt(variance) || 1;
      stats[f.id] = { mean, std };
    });

    const shap = featureImpacts.map(impact => {
      const featureKeyDef = FEATURE_KEYS.find(f => f.id === impact.feature);
      if (!featureKeyDef || !stats[impact.feature]) return { name: impact.feature, value: 0, raw: 0 };
      const rawVal = featureKeyDef.log
        ? Math.log(pref[featureKeyDef.key] || 1)
        : pref[featureKeyDef.key];
      const zScore = (rawVal - stats[impact.feature].mean) / stats[impact.feature].std;
      const localImpact = zScore * impact.coefficient;
      return { name: impact.feature, value: localImpact, raw: pref[featureKeyDef.key] };
    }).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    const maxAbs = shap.length > 0 ? Math.max(...shap.map(d => Math.abs(d.value))) : 1;

    return { prefData: pref, shapData: shap, maxAbs };
  }, [prefecture, spatialData, featureImpacts]);

  if (!prefecture || !prefData) return null;

  const isBetterThanMedian = prefData.is_above_median;
  const prefInfo = getPrefectureInfo(prefData.prefecture_en);
  const jpName = prefInfo?.jp || '';
  const region = prefInfo?.region || '';

  return (
    <div 
      className="h-full flex flex-col text-white overflow-y-auto overflow-x-hidden overscroll-contain pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full"
      onWheel={(e) => e.stopPropagation()}
    >
      
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md px-6 pt-6 pb-4 border-b border-white/10 z-10">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-light tracking-wide">{prefData.prefecture_en}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-lg text-gray-400 tracking-widest">{jpName}</span>
              {region && (
                <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full uppercase tracking-widest text-gray-400">
                  {region}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xl font-semibold ${isBetterThanMedian ? 'text-[#4caf50]' : 'text-[#e27676]'}`}>
                {prefData.target_pop_change_pct > 0 ? '+' : ''}{prefData.target_pop_change_pct.toFixed(2)}%
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded-md uppercase tracking-widest ${isBetterThanMedian ? 'bg-[#4caf50]/20 text-[#4caf50]' : 'bg-[#e27676]/20 text-[#e27676]'}`}>
                {isBetterThanMedian ? 'Above Median' : 'Below Median'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/20 rounded-full transition-colors flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Compare Button */}
        <button
          onClick={() => onCompare(prefData.prefecture_en)}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 border border-[#e27676]/50 text-[#e27676] text-xs uppercase tracking-widest rounded-lg hover:bg-[#e27676]/10 transition-colors"
        >
          <GitCompare size={14} />
          Compare Prefecture
        </button>
      </div>

      <div className="flex-1 px-6 py-6 space-y-8">
        {/* Key Metrics Grid */}
        <div>
          <h3 className="text-[10px] font-medium uppercase tracking-widest text-gray-500 mb-3">Socio-Economic Indicators</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <MetricCard icon={<Users size={13} />} label="Population 2024" value={prefData.population_2024.toLocaleString()} />
            <MetricCard icon={<TrendingDown size={13} />} label="Aging Rate" value={`${prefData.aging_rate_pct.toFixed(1)}%`} accent="red" />
            <MetricCard
              icon={<TrendingUp size={13} />}
              label="Net Migration"
              value={`${prefData.net_migration_rate > 0 ? '+' : ''}${prefData.net_migration_rate.toFixed(1)}/1k`}
              accent={prefData.net_migration_rate >= 0 ? 'green' : 'red'}
            />
            <MetricCard icon={<Activity size={13} />} label="GDP (PPP)" value={`$${Math.round(prefData.gdp_usd_ppp_2014 / 1000)}k`} />
            <MetricCard icon={<Home size={13} />} label="Vacancy Rate" value={`${prefData.vacancy_rate_pct?.toFixed(1) ?? 'N/A'}%`} accent="red" />
            <MetricCard icon={<MapPin size={13} />} label="Dist. to Tokyo" value={`${Math.round(prefData.dist_to_tokyo_km ?? 0)} km`} />
          </div>
        </div>

        {/* SHAP Chart */}
        <div>
          <h3 className="text-[10px] font-medium uppercase tracking-widest text-gray-500 mb-1">Local Feature Impacts (SHAP)</h3>
          <p className="text-[11px] text-gray-600 mb-4 leading-relaxed">
            Directional impact of each feature on <span className="text-gray-400">{prefData.prefecture_en}</span>'s prediction vs. national average.
          </p>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shapData} layout="vertical" margin={{ top: 0, right: 24, left: 10, bottom: 0 }}>
                <XAxis type="number" hide domain={[-maxAbs, maxAbs]} />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  width={130}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{ backgroundColor: '#111', borderColor: '#2a2a2a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [val > 0 ? `+${Number(val).toFixed(3)}` : Number(val).toFixed(3), 'SHAP Impact']}
                />
                <ReferenceLine x={0} stroke="#333" strokeDasharray="3 3" />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={16}>
                  {shapData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.value > 0 ? '#4caf50' : '#e27676'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <div className="w-3 h-3 rounded-sm bg-[#4caf50]" /> Positive driver
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <div className="w-3 h-3 rounded-sm bg-[#e27676]" /> Negative driver
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon, label, value, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: 'red' | 'green';
}) {
  const valueColor = accent === 'red' ? 'text-[#e27676]' : accent === 'green' ? 'text-[#4caf50]' : 'text-white';
  return (
    <div className="bg-white/5 border border-white/8 p-3.5 rounded-xl flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-gray-500 text-[10px] uppercase tracking-wider">
        {icon} {label}
      </div>
      <div className={`text-base font-semibold ${valueColor}`}>{value}</div>
    </div>
  );
}

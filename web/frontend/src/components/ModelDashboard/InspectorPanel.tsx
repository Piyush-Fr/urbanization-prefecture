import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { X, TrendingDown, TrendingUp, Users, Activity } from 'lucide-react';

interface InspectorPanelProps {
  prefecture: string | null;
  spatialData: any[];
  featureImpacts: any[];
  onClose: () => void;
}

export default function InspectorPanel({ prefecture, spatialData, featureImpacts, onClose }: InspectorPanelProps) {
  
  const { prefData, shapData } = useMemo(() => {
    if (!prefecture || !spatialData.length || !featureImpacts.length) {
      return { prefData: null, shapData: [] };
    }

    const pref = spatialData.find(d => d.prefecture_en === prefecture);
    if (!pref) return { prefData: null, shapData: [] };

    // Calculate means and stddevs across all prefectures for standardization
    const stats: Record<string, { mean: number, std: number }> = {};
    const featureKeys = [
      { key: 'aging_rate_pct', id: 'Aging Rate' },
      { key: 'net_migration_rate', id: 'Net Migration Rate' },
      { key: 'gdp_usd_ppp_2014', id: 'GDP (USD PPP)' },
      { key: 'population_2020', id: 'Log Population 2020', log: true },
      { key: 'vacancy_rate_pct', id: 'Vacancy Rate' },
      { key: 'dist_to_tokyo_km', id: 'Distance to Tokyo' },
    ];

    featureKeys.forEach(f => {
      const vals = spatialData.map(d => f.log ? Math.log(d[f.key] || 1) : d[f.key]);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
      const std = Math.sqrt(variance);
      stats[f.id] = { mean, std };
    });

    // Calculate local linear SHAP impacts
    const shap = featureImpacts.map(impact => {
      const featureKeyDef = featureKeys.find(f => f.id === impact.feature);
      if (!featureKeyDef) return { name: impact.feature, value: 0 };
      
      const rawVal = featureKeyDef.log ? Math.log(pref[featureKeyDef.key] || 1) : pref[featureKeyDef.key];
      const zScore = (rawVal - stats[impact.feature].mean) / stats[impact.feature].std;
      const localImpact = zScore * impact.coefficient;

      return {
        name: impact.feature,
        value: localImpact,
        raw: pref[featureKeyDef.key]
      };
    }).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)); // Sort by magnitude

    return { prefData: pref, shapData: shap };
  }, [prefecture, spatialData, featureImpacts]);

  if (!prefecture || !prefData) return null;

  const isGrowth = prefData.target_pop_change_pct >= 0;

  return (
    <div className="h-full flex flex-col p-6 text-white overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-light mb-1">{prefData.prefecture_en}</h2>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-medium ${isGrowth ? 'text-[#4caf50]' : 'text-[#e27676]'}`}>
              {prefData.target_pop_change_pct.toFixed(2)}%
            </span>
            <span className="text-xs text-gray-400 uppercase tracking-widest">Projected (2024-2035)</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/20 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Badges */}
      <div className="grid grid-cols-2 gap-3 mb-10">
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-1">
            <Users size={14} /> Population
          </div>
          <div className="text-xl font-medium">{prefData.population_2024.toLocaleString()}</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-1">
            <TrendingDown size={14} /> Aging Rate
          </div>
          <div className="text-xl font-medium">{prefData.aging_rate_pct.toFixed(1)}%</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-1">
            <TrendingUp size={14} /> Net Migration
          </div>
          <div className="text-xl font-medium">{prefData.net_migration_rate > 0 ? '+' : ''}{prefData.net_migration_rate} <span className="text-sm font-normal text-gray-500">per 1k</span></div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-1">
            <Activity size={14} /> GDP (PPP)
          </div>
          <div className="text-xl font-medium">${Math.round(prefData.gdp_usd_ppp_2014 / 1000)}k</div>
        </div>
      </div>

      {/* SHAP Chart */}
      <div className="flex-1 min-h-[300px] flex flex-col">
        <h3 className="text-sm font-medium uppercase tracking-widest text-gray-400 mb-6 border-b border-white/10 pb-3">Local Feature Impacts (SHAP)</h3>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          This chart isolates the exact directional impact each feature has on the prediction for <strong className="text-gray-300">{prefData.prefecture_en}</strong>, relative to the national average.
        </p>
        
        <div className="flex-1 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={shapData}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                width={120}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                formatter={(val: any) => [val > 0 ? `+${Number(val).toFixed(3)}` : Number(val).toFixed(3), 'Impact']}
              />
              <ReferenceLine x={0} stroke="#444" />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {shapData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#4caf50' : '#e27676'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

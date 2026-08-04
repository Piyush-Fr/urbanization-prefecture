/* eslint-disable */
import React, { useMemo } from 'react';
import { SlidersHorizontal, ArrowRight, Activity, Users, Home, RefreshCw } from 'lucide-react';

interface SimulationControlsProps {
  modifiers: { migration: number; aging: number; vacancy: number };
  setModifiers: (val: any) => void;
  spatialData?: any[];
}

export default function SimulationControls({ modifiers, setModifiers, spatialData = [] }: SimulationControlsProps) {
  const handleReset = () => setModifiers({ migration: 1.0, aging: 1.0, vacancy: 1.0 });

  const isBaseline = modifiers.migration === 1.0 && modifiers.aging === 1.0 && modifiers.vacancy === 1.0;

  const nationalImpact = useMemo(() => {
    if (!spatialData.length) return null;
    const baseline = spatialData.reduce((s, d) => s + d.target_pop_change_pct, 0) / spatialData.length;
    const adjusted = baseline
      + (modifiers.migration - 1.0) * 5
      - (modifiers.aging - 1.0) * 5
      - (modifiers.vacancy - 1.0) * 2;
    const delta = adjusted - baseline;
    return { baseline: baseline.toFixed(2), adjusted: adjusted.toFixed(2), delta: delta.toFixed(2) };
  }, [modifiers, spatialData]);

  return (
    <div className="flex flex-col h-full text-white">
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <SlidersHorizontal className="text-[#e27676]" size={20} />
        <h2 className="text-base font-light uppercase tracking-widest">What-If Simulation</h2>
      </div>

      <p className="text-[11px] text-gray-500 leading-relaxed mb-6">
        Adjust demographic and economic levers to simulate policy scenarios globally across all 47 prefectures.
      </p>

      {/* National Impact Summary */}
      {nationalImpact && !isBaseline && (
        <div className="mb-6 p-3.5 bg-white/5 border border-white/10 rounded-xl">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Simulated National Avg.</div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-gray-500">Baseline</div>
              <div className="text-sm text-gray-300">{nationalImpact.baseline}%</div>
            </div>
            <div className="text-gray-600">→</div>
            <div>
              <div className="text-xs text-gray-500">Adjusted</div>
              <div className={`text-sm font-semibold ${parseFloat(nationalImpact.delta) >= 0 ? 'text-[#4caf50]' : 'text-[#e27676]'}`}>
                {nationalImpact.adjusted}%
              </div>
            </div>
            <div className={`text-xs px-2 py-1 rounded font-medium ${parseFloat(nationalImpact.delta) >= 0 ? 'bg-[#4caf50]/10 text-[#4caf50]' : 'bg-[#e27676]/10 text-[#e27676]'}`}>
              {parseFloat(nationalImpact.delta) >= 0 ? '+' : ''}{nationalImpact.delta}%
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-7 flex-1">
        {/* Migration Slider */}
        <SliderRow
          icon={<Users size={14} />}
          label="Youth Migration Intake"
          value={modifiers.migration}
          min={0.5} max={2.0} step={0.05}
          displayVal={`${((modifiers.migration - 1) * 100).toFixed(0)}%`}
          accent="green"
          lowLabel="-50% Restrictive"
          highLabel="+100% Aggressive"
          onChange={v => setModifiers({ ...modifiers, migration: v })}
        />

        {/* Aging Slider */}
        <SliderRow
          icon={<Activity size={14} />}
          label="Aging Mitigation (Healthcare)"
          value={modifiers.aging}
          min={0.8} max={1.5} step={0.05}
          displayVal={`${((modifiers.aging - 1) * 100).toFixed(0)}%`}
          accent="red"
          lowLabel="Improved Health"
          highLabel="Accelerated Aging"
          onChange={v => setModifiers({ ...modifiers, aging: v })}
        />

        {/* Vacancy Slider */}
        <SliderRow
          icon={<Home size={14} />}
          label="Housing Revitalization"
          value={modifiers.vacancy}
          min={0.5} max={1.5} step={0.05}
          displayVal={`${((modifiers.vacancy - 1) * 100).toFixed(0)}%`}
          accent="red"
          lowLabel="Subsidized Renovation"
          highLabel="Abandonment"
          onChange={v => setModifiers({ ...modifiers, vacancy: v })}
        />
      </div>

      <button
        onClick={handleReset}
        disabled={isBaseline}
        className={`mt-6 w-full py-3 border text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all ${
          isBaseline
            ? 'border-white/10 text-gray-600 cursor-not-allowed'
            : 'border-white/20 hover:bg-white/10 text-white'
        }`}
      >
        <RefreshCw size={13} /> Reset to Baseline
      </button>
    </div>
  );
}

function SliderRow({
  icon, label, value, min, max, step, displayVal, accent, lowLabel, highLabel, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number; max: number; step: number;
  displayVal: string;
  accent: 'red' | 'green';
  lowLabel: string; highLabel: string;
  onChange: (v: number) => void;
}) {
  const color = accent === 'green' ? '#4caf50' : '#e27676';
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-gray-300 text-xs">
          <span className="text-gray-500">{icon}</span>
          {label}
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded`} style={{ color, backgroundColor: `${color}18` }}>
          {parseFloat(displayVal) > 0 ? '+' : ''}{displayVal}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
      <div className="flex justify-between text-[9px] text-gray-600 uppercase tracking-wider">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

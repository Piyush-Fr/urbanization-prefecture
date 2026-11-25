/* eslint-disable */
import React, { useMemo } from 'react';
import { SlidersHorizontal, Activity, Users, Home, RefreshCw } from 'lucide-react';
import { NO_SHIFT, simulatedChange, type Feature, type Shifts } from '@/lib/model';

interface SimulationControlsProps {
  shifts: Shifts;
  setShifts: (val: Shifts) => void;
  spatialData?: any[];
  features?: Feature[];
}

const signed = (v: number, unit: string) => `${v > 0 ? '+' : ''}${v.toFixed(1)}${unit}`;

export default function SimulationControls({ shifts, setShifts, spatialData = [], features = [] }: SimulationControlsProps) {
  const handleReset = () => setShifts(NO_SHIFT);

  const isBaseline = shifts.migration === 0 && shifts.aging === 0 && shifts.vacancy === 0;

  const nationalImpact = useMemo(() => {
    if (!spatialData.length || !features.length) return null;
    const mean = (f: (d: any) => number) => spatialData.reduce((s, d) => s + f(d), 0) / spatialData.length;
    const baseline = mean(d => d.predicted_change_pct);
    const adjusted = mean(d => simulatedChange(d, shifts, features));
    const delta = adjusted - baseline;
    return { baseline: baseline.toFixed(2), adjusted: adjusted.toFixed(2), delta: delta.toFixed(2) };
  }, [shifts, spatialData, features]);

  return (
    <div className="flex flex-col h-full text-white">
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <SlidersHorizontal className="text-[#e27676]" size={20} />
        <h2 className="text-base font-light uppercase tracking-widest">What-If Simulation</h2>
      </div>

      <p className="text-[11px] text-gray-500 leading-relaxed mb-6">
        Shift a driver by the same amount in all 47 prefectures and see how the Ridge model&apos;s predicted 2020–24 change responds.
        The model is linear, so every prefecture moves by the same number of points.
      </p>

      {/* National Impact Summary */}
      {nationalImpact && (
        <div className="mb-6 p-3.5 bg-white/5 border border-white/10 rounded-xl">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Predicted National Avg.</div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-gray-500">Baseline</div>
              <div className="text-sm text-gray-300">{nationalImpact.baseline}%</div>
            </div>
            <div className="text-gray-600">→</div>
            <div>
              <div className="text-xs text-gray-500">Adjusted</div>
              <div className={`text-sm font-semibold ${parseFloat(nationalImpact.delta) > 0 ? 'text-[#4caf50]' : parseFloat(nationalImpact.delta) < 0 ? 'text-[#e27676]' : 'text-gray-400'}`}>
                {nationalImpact.adjusted}%
              </div>
            </div>
            <div className={`text-xs px-2 py-1 rounded font-medium ${parseFloat(nationalImpact.delta) > 0 ? 'bg-[#4caf50]/10 text-[#4caf50]' : parseFloat(nationalImpact.delta) < 0 ? 'bg-[#e27676]/10 text-[#e27676]' : 'bg-white/5 text-gray-400'}`}>
              {parseFloat(nationalImpact.delta) > 0 ? '+' : ''}{nationalImpact.delta} pts
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-7 flex-1">
        {/* Migration Slider */}
        <SliderRow
          icon={<Users size={14} />}
          label="Net Migration"
          value={shifts.migration}
          min={-5} max={5} step={0.5}
          displayVal={signed(shifts.migration, '‰')}
          accent="green"
          lowLabel="−5 per 1,000 (outflow)"
          highLabel="+5 per 1,000 (inflow)"
          onChange={v => setShifts({ ...shifts, migration: v })}
        />

        {/* Aging Slider */}
        <SliderRow
          icon={<Activity size={14} />}
          label="Aging Rate (65+)"
          value={shifts.aging}
          min={-5} max={5} step={0.5}
          displayVal={signed(shifts.aging, ' pts')}
          accent="red"
          lowLabel="−5 pts (younger)"
          highLabel="+5 pts (older)"
          onChange={v => setShifts({ ...shifts, aging: v })}
        />

        {/* Vacancy Slider */}
        <SliderRow
          icon={<Home size={14} />}
          label="Housing Vacancy Rate"
          value={shifts.vacancy}
          min={-5} max={5} step={0.5}
          displayVal={signed(shifts.vacancy, ' pts')}
          accent="red"
          lowLabel="−5 pts"
          highLabel="+5 pts"
          onChange={v => setShifts({ ...shifts, vacancy: v })}
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

import { LiquidGlassSlider } from '../liquid-glass/LiquidGlassSlider';

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
          {displayVal}
        </span>
      </div>
      <div className="py-2">
        <LiquidGlassSlider
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          showValue={false}
          ariaLabel={label}
          valueFormatter={() => displayVal}
          accentColor={color}
        />
      </div>
      <div className="flex justify-between text-[9px] text-gray-600 uppercase tracking-wider">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

/* eslint-disable */
import React from 'react';
import { SlidersHorizontal, ArrowRight, Activity, Users, Home } from 'lucide-react';

interface SimulationControlsProps {
  modifiers: {
    migration: number;
    aging: number;
    vacancy: number;
  };
  setModifiers: (val: any) => void;
}

export default function SimulationControls({ modifiers, setModifiers }: SimulationControlsProps) {
  
  const handleReset = () => {
    setModifiers({ migration: 1.0, aging: 1.0, vacancy: 1.0 });
  };

  return (
    <div className="flex flex-col h-full text-white">
      <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
        <SlidersHorizontal className="text-[#e27676]" size={24} />
        <h2 className="text-xl font-light uppercase tracking-widest">Simulation</h2>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed mb-8">
        Adjust macroeconomic and demographic policies globally to observe real-time "What-If" impacts across all prefectures on the map.
      </p>

      <div className="flex flex-col gap-8 flex-1">
        
        {/* Migration Slider */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-400" />
              <label className="text-sm font-medium">Youth Migration Intake</label>
            </div>
            <span className="text-xs text-[#4caf50] bg-[#4caf50]/10 px-2 py-0.5 rounded">
              {((modifiers.migration - 1) * 100).toFixed(0)}%
            </span>
          </div>
          <input 
            type="range" 
            min="0.5" max="2.0" step="0.05"
            value={modifiers.migration}
            onChange={(e) => setModifiers({ ...modifiers, migration: parseFloat(e.target.value) })}
            className="w-full accent-[#4caf50]"
          />
          <div className="flex justify-between text-[10px] text-gray-500 uppercase">
            <span>-50% (Restrictive)</span>
            <span>+100% (Aggressive)</span>
          </div>
        </div>

        {/* Aging Rate Slider */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-gray-400" />
              <label className="text-sm font-medium">Aging Mitigation (Healthcare)</label>
            </div>
            <span className="text-xs text-[#e27676] bg-[#e27676]/10 px-2 py-0.5 rounded">
              {((modifiers.aging - 1) * 100).toFixed(0)}%
            </span>
          </div>
          <input 
            type="range" 
            min="0.8" max="1.5" step="0.05"
            value={modifiers.aging}
            onChange={(e) => setModifiers({ ...modifiers, aging: parseFloat(e.target.value) })}
            className="w-full accent-[#e27676]"
          />
          <div className="flex justify-between text-[10px] text-gray-500 uppercase">
            <span>Improved Health</span>
            <span>Accelerated Aging</span>
          </div>
        </div>

        {/* Vacancy Rate Slider */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <Home size={16} className="text-gray-400" />
              <label className="text-sm font-medium">Housing Revitalization</label>
            </div>
            <span className="text-xs text-[#e27676] bg-[#e27676]/10 px-2 py-0.5 rounded">
              {((modifiers.vacancy - 1) * 100).toFixed(0)}%
            </span>
          </div>
          <input 
            type="range" 
            min="0.5" max="1.5" step="0.05"
            value={modifiers.vacancy}
            onChange={(e) => setModifiers({ ...modifiers, vacancy: parseFloat(e.target.value) })}
            className="w-full accent-[#e27676]"
          />
          <div className="flex justify-between text-[10px] text-gray-500 uppercase">
            <span>Subsidized Renovation</span>
            <span>Abandonment</span>
          </div>
        </div>
      </div>

      <button 
        onClick={handleReset}
        className="mt-8 w-full py-3 border border-white/20 text-sm uppercase tracking-widest hover:bg-white/10 transition-colors rounded-lg flex items-center justify-center gap-2"
      >
        Reset Baseline <ArrowRight size={16} />
      </button>

    </div>
  );
}

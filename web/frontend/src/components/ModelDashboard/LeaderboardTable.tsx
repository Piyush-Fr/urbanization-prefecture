import React, { useMemo } from 'react';

interface LeaderboardTableProps {
  spatialData: any[];
  simulationModifiers: {
    migration: number;
    aging: number;
    vacancy: number;
  };
  selectedPrefecture: string | null;
  setSelectedPrefecture: (id: string | null) => void;
}

export default function LeaderboardTable({ spatialData, simulationModifiers, selectedPrefecture, setSelectedPrefecture }: LeaderboardTableProps) {
  
  const sortedData = useMemo(() => {
    return [...spatialData].map(d => {
      const adjustedChange = d.target_pop_change_pct 
        + ((simulationModifiers.migration - 1.0) * 5)
        - ((simulationModifiers.aging - 1.0) * 5)
        - ((simulationModifiers.vacancy - 1.0) * 2);
      
      return { ...d, adjustedChange };
    }).sort((a, b) => a.adjustedChange - b.adjustedChange); // Sort steepest decline to highest growth
  }, [spatialData, simulationModifiers]);

  if (!sortedData.length) return null;

  return (
    <div className="w-full text-sm">
      <div className="grid grid-cols-6 text-xs text-gray-400 uppercase tracking-widest border-b border-white/10 pb-2 mb-2 sticky top-0 bg-black/70 backdrop-blur-md z-10 px-4">
        <div className="col-span-1">Rank</div>
        <div className="col-span-1">Prefecture</div>
        <div className="col-span-1 text-right">Predicted Change</div>
        <div className="col-span-1 text-right">Aging Rate</div>
        <div className="col-span-1 text-right">Net Migration</div>
        <div className="col-span-1 text-right">Base Population</div>
      </div>

      <div className="flex flex-col">
        {sortedData.map((pref, idx) => (
          <div 
            key={pref.prefecture_en}
            onClick={() => setSelectedPrefecture(pref.prefecture_en)}
            className={`grid grid-cols-6 py-2.5 px-4 rounded-lg cursor-pointer transition-colors ${selectedPrefecture === pref.prefecture_en ? 'bg-white/10' : 'hover:bg-white/5'}`}
          >
            <div className="col-span-1 flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${pref.adjustedChange < 0 ? 'bg-[#d73027]/20 text-[#d73027]' : 'bg-[#4caf50]/20 text-[#4caf50]'}`}>
                {idx + 1}
              </span>
            </div>
            <div className="col-span-1 font-medium text-white flex items-center">
              {pref.prefecture_en}
            </div>
            <div className={`col-span-1 text-right flex items-center justify-end font-medium ${pref.adjustedChange < 0 ? 'text-[#e27676]' : 'text-[#4caf50]'}`}>
              {pref.adjustedChange > 0 ? '+' : ''}{pref.adjustedChange.toFixed(2)}%
            </div>
            <div className="col-span-1 text-right flex items-center justify-end text-gray-300">
              {pref.aging_rate_pct.toFixed(1)}%
            </div>
            <div className="col-span-1 text-right flex items-center justify-end text-gray-300">
              {pref.net_migration_rate > 0 ? '+' : ''}{pref.net_migration_rate}
            </div>
            <div className="col-span-1 text-right flex items-center justify-end text-gray-400">
              {pref.population_2024.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

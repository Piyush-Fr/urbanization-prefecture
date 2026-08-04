import React, { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { getPrefectureInfo } from '@/lib/kanjiLookup';

type SortKey = 'adjustedChange' | 'aging_rate_pct' | 'net_migration_rate' | 'population_2024';

interface LeaderboardTableProps {
  spatialData: any[];
  simulationModifiers: { migration: number; aging: number; vacancy: number };
  selectedPrefecture: string | null;
  setSelectedPrefecture: (id: string | null) => void;
}

export default function LeaderboardTable({
  spatialData,
  simulationModifiers,
  selectedPrefecture,
  setSelectedPrefecture,
}: LeaderboardTableProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('adjustedChange');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const processedData = useMemo(() => {
    return spatialData.map(d => {
      const adjustedChange =
        d.target_pop_change_pct +
        (simulationModifiers.migration - 1.0) * 5 -
        (simulationModifiers.aging - 1.0) * 5 -
        (simulationModifiers.vacancy - 1.0) * 2;
      const info = getPrefectureInfo(d.prefecture_en);
      return { ...d, adjustedChange, jp: info?.jp || '', region: info?.region || '' };
    });
  }, [spatialData, simulationModifiers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return processedData.filter(d =>
      !q ||
      d.prefecture_en?.toLowerCase().includes(q) ||
      d.jp?.includes(q) ||
      d.region?.toLowerCase().includes(q)
    );
  }, [processedData, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown size={10} className="text-gray-600" />;
    return sortDir === 'asc'
      ? <ChevronUp size={10} className="text-[#e27676]" />
      : <ChevronDown size={10} className="text-[#e27676]" />;
  };

  return (
    <div className="w-full text-sm flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-3 px-1">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search prefecture (English or 日本語)…"
          className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#e27676]/50"
        />
      </div>

      {/* Header */}
      <div className="grid grid-cols-12 text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/10 pb-2 mb-1 px-2">
        <div className="col-span-1">#</div>
        <div className="col-span-3">Prefecture</div>
        <div
          className="col-span-2 text-right flex items-center justify-end gap-0.5 cursor-pointer hover:text-white transition-colors"
          onClick={() => handleSort('adjustedChange')}
        >
          Change <SortIcon col="adjustedChange" />
        </div>
        <div
          className="col-span-2 text-right flex items-center justify-end gap-0.5 cursor-pointer hover:text-white transition-colors"
          onClick={() => handleSort('aging_rate_pct')}
        >
          Aging <SortIcon col="aging_rate_pct" />
        </div>
        <div
          className="col-span-2 text-right flex items-center justify-end gap-0.5 cursor-pointer hover:text-white transition-colors"
          onClick={() => handleSort('net_migration_rate')}
        >
          Migr <SortIcon col="net_migration_rate" />
        </div>
        <div
          className="col-span-2 text-right flex items-center justify-end gap-0.5 cursor-pointer hover:text-white transition-colors"
          onClick={() => handleSort('population_2024')}
        >
          Pop <SortIcon col="population_2024" />
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-col overflow-auto flex-1">
        {sorted.map((pref, idx) => {
          const isSelected = selectedPrefecture === pref.prefecture_en;
          const isNeg = pref.adjustedChange < 0;
          return (
            <div
              key={pref.prefecture_en}
              onClick={() => setSelectedPrefecture(pref.prefecture_en)}
              className={`grid grid-cols-12 py-2 px-2 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#e27676]/10 border border-[#e27676]/20'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              {/* Rank */}
              <div className="col-span-1 flex items-center">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    isNeg ? 'bg-[#d73027]/20 text-[#d73027]' : 'bg-[#4caf50]/20 text-[#4caf50]'
                  }`}
                >
                  {idx + 1}
                </span>
              </div>

              {/* Name */}
              <div className="col-span-3 flex flex-col justify-center">
                <div className="text-white text-xs font-medium leading-tight">{pref.prefecture_en}</div>
                <div className="text-gray-500 text-[10px] leading-tight">{pref.jp}</div>
              </div>

              {/* Change */}
              <div className={`col-span-2 text-right flex items-center justify-end text-xs font-semibold ${isNeg ? 'text-[#e27676]' : 'text-[#4caf50]'}`}>
                {pref.adjustedChange > 0 ? '+' : ''}{pref.adjustedChange.toFixed(2)}%
              </div>

              {/* Aging */}
              <div className="col-span-2 text-right flex items-center justify-end text-[11px] text-[#fc8d59]">
                {pref.aging_rate_pct?.toFixed(1)}%
              </div>

              {/* Migration */}
              <div className={`col-span-2 text-right flex items-center justify-end text-[11px] ${pref.net_migration_rate >= 0 ? 'text-[#91bfdb]' : 'text-gray-400'}`}>
                {pref.net_migration_rate >= 0 ? '+' : ''}{pref.net_migration_rate?.toFixed(1)}
              </div>

              {/* Population */}
              <div className="col-span-2 text-right flex items-center justify-end text-[10px] text-gray-500">
                {(pref.population_2024 / 1000).toFixed(0)}k
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

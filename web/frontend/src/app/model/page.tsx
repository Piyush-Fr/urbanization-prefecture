"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Layers, BarChart2, Table2, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InspectorPanel from '@/components/ModelDashboard/InspectorPanel';
import SimulationControls from '@/components/ModelDashboard/SimulationControls';
import LeaderboardTable from '@/components/ModelDashboard/LeaderboardTable';
import ComparisonModal from '@/components/ModelDashboard/ComparisonModal';

const MapVisualizer = dynamic(
  () => import('@/components/ModelDashboard/MapVisualizer'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 text-gray-600">
        <div className="w-8 h-8 border-2 border-[#e27676]/40 border-t-[#e27676] rounded-full animate-spin" />
        <span className="text-xs tracking-widest uppercase">Loading Map...</span>
      </div>
    ),
  }
);

type MapLayer = 'prediction' | 'residual' | 'hotspot';
type ActivePanel = 'controls' | 'leaderboard' | null;

export default function ModelDashboard() {
  const [spatialData, setSpatialData] = useState<any[]>([]);
  const [geoJson, setGeoJson] = useState<any>(null);
  const [featureImpacts, setFeatureImpacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard state
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<MapLayer>('prediction');
  const [compareTarget, setCompareTarget] = useState<string | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  // What-If modifiers
  const [simulationModifiers, setSimulationModifiers] = useState({
    migration: 1.0,
    aging: 1.0,
    vacancy: 1.0,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const [spatialRes, geoRes, impactRes] = await Promise.all([
          fetch(`${API_BASE}/api/spatial-data`),
          fetch(`${API_BASE}/api/geojson`),
          fetch(`${API_BASE}/api/feature-impacts`),
        ]);
        if (spatialRes.ok) setSpatialData(await spatialRes.json());
        if (geoRes.ok) setGeoJson(await geoRes.json());
        if (impactRes.ok) setFeatureImpacts(await impactRes.json());
      } catch (e) {
        setError('Could not reach the backend API. Ensure the FastAPI server is running on port 8000.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const layerLabels: Record<MapLayer, string> = {
    prediction: 'Predicted Pop. Change',
    residual: 'Model Residuals',
    hotspot: 'Moran\'s I Hotspots',
  };

  const layerColors: Record<MapLayer, string> = {
    prediction: '#e27676',
    residual: '#fc8d59',
    hotspot: '#4575b4',
  };

  const legendItems: Record<MapLayer, { color: string; label: string }[]> = {
    prediction: [
      { color: '#67001f', label: '≤ −8% severe' },
      { color: '#d73027', label: '−5% decline' },
      { color: '#fc8d59', label: '−2% moderate' },
      { color: '#fee090', label: '~0% stable' },
      { color: '#4575b4', label: '≥ +5% growth' },
    ],
    residual: [
      { color: '#4575b4', label: 'Under-predicted' },
      { color: '#ffffbf', label: 'On-target' },
      { color: '#d73027', label: 'Over-predicted' },
    ],
    hotspot: [
      { color: '#d73027', label: 'High-High cluster' },
      { color: '#4575b4', label: 'Low-Low cluster' },
      { color: '#fc8d59', label: 'High-Low outlier' },
      { color: '#91bfdb', label: 'Low-High outlier' },
      { color: '#2a2a2a', label: 'Not significant' },
    ],
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-[#0a0a0a] text-white flex flex-col font-sans relative">
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 1, backdropFilter: 'blur(40px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a]/80 text-white"
          >
            <div className="w-16 h-16 border-2 border-[#e27676]/20 border-t-[#e27676] rounded-full animate-spin mb-8" />
            <h2 className="text-[#e27676] text-sm md:text-base tracking-[0.4em] uppercase font-light">Initializing Simulation</h2>
            <p className="text-gray-500 text-[10px] md:text-xs tracking-widest mt-3 uppercase">Loading Spatial Matrix...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Nav */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-5 bg-black/60 backdrop-blur-xl z-40 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs uppercase tracking-widest">
            <ArrowLeft size={14} /> Home
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <h1 className="text-sm tracking-widest font-light uppercase">
            Japan <span className="text-[#e27676] font-medium">Demographic Model</span>
          </h1>
        </div>

        {/* Layer Switcher */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
          {(['prediction', 'residual', 'hotspot'] as MapLayer[]).map(layer => (
            <button
              key={layer}
              onClick={() => setMapLayer(layer)}
              className={`px-3 py-1.5 text-[11px] rounded-lg transition-all capitalize tracking-wide ${
                mapLayer === layer
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {layer === 'prediction' ? 'Prediction' : layer === 'residual' ? 'Residuals' : 'Hotspots'}
            </button>
          ))}
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 text-[10px]">
          {loading ? (
            <span className="text-gray-500 uppercase tracking-widest animate-pulse">Loading data…</span>
          ) : error ? (
            <span className="text-[#e27676] uppercase tracking-widest">⚠ API offline</span>
          ) : (
            <span className="flex items-center gap-1.5 text-[#4caf50]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4caf50] animate-pulse" />
              <span className="uppercase tracking-widest">{spatialData.length} prefectures loaded</span>
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 relative flex overflow-hidden">

        {/* Map Background */}
        <div className="absolute inset-0 z-0">
          <MapVisualizer
            geoJson={geoJson}
            spatialData={spatialData}
            selectedPrefecture={selectedPrefecture}
            setSelectedPrefecture={setSelectedPrefecture}
            mapLayer={mapLayer}
            simulationModifiers={simulationModifiers}
          />
        </div>

        {/* Left Sidebar */}
        <div 
          className="relative w-72 h-full bg-black/70 backdrop-blur-xl border-r border-white/10 z-10 flex flex-col flex-shrink-0"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
            <SimulationControls
              modifiers={simulationModifiers}
              setModifiers={setSimulationModifiers}
              spatialData={spatialData}
            />
          </div>
        </div>

        {/* Map Legend (bottom-left of map) */}
        <div className="absolute bottom-[calc(2.5rem+1px)] left-72 ml-4 z-10 bg-black/70 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 pointer-events-none">
          <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-2">{layerLabels[mapLayer]}</div>
          <div className="flex flex-col gap-1.5">
            {legendItems[mapLayer].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar: Inspector */}
        <div 
          className={`absolute top-0 right-0 h-full w-[380px] bg-black/80 backdrop-blur-2xl border-l border-white/10 z-20 transform transition-transform duration-500 ease-out flex flex-col ${selectedPrefecture ? 'translate-x-0' : 'translate-x-full'}`}
          onWheel={(e) => e.stopPropagation()}
        >
          <InspectorPanel
            prefecture={selectedPrefecture}
            spatialData={spatialData}
            featureImpacts={featureImpacts}
            onClose={() => setSelectedPrefecture(null)}
            onCompare={(pref) => setCompareTarget(pref)}
          />
        </div>

        <div
          className={`absolute bottom-0 left-72 right-0 bg-black/85 backdrop-blur-2xl border-t border-white/10 z-10 transition-all duration-300 flex flex-col ${
            selectedPrefecture ? 'right-[380px]' : 'right-0'
          }`}
          style={{ height: leaderboardOpen ? '320px' : '40px' }}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Pull handle */}
          <button
            onClick={() => setLeaderboardOpen(v => !v)}
            className="h-10 w-full flex items-center justify-center gap-2 cursor-pointer border-b border-white/5 hover:bg-white/5 transition-colors flex-shrink-0"
          >
            <div className="w-8 h-1 bg-white/20 rounded-full" />
            <span className="text-[10px] text-gray-500 uppercase tracking-widest ml-1">Prefecture Rankings</span>
            <ChevronUp
              size={12}
              className={`text-gray-500 transition-transform duration-300 ${leaderboardOpen ? '' : 'rotate-180'}`}
            />
          </button>
          {leaderboardOpen && (
            <div className="flex-1 overflow-hidden p-3">
              <LeaderboardTable
                spatialData={spatialData}
                simulationModifiers={simulationModifiers}
                selectedPrefecture={selectedPrefecture}
                setSelectedPrefecture={setSelectedPrefecture}
              />
            </div>
          )}
        </div>
      </main>

      {/* Comparison Modal */}
      {compareTarget && (
        <ComparisonModal
          prefectureA={compareTarget}
          spatialData={spatialData}
          featureImpacts={featureImpacts}
          onClose={() => setCompareTarget(null)}
        />
      )}
    </div>
  );
}

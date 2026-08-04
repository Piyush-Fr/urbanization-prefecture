"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import InspectorPanel from '@/components/ModelDashboard/InspectorPanel';
import SimulationControls from '@/components/ModelDashboard/SimulationControls';
import LeaderboardTable from '@/components/ModelDashboard/LeaderboardTable';

const MapVisualizer = dynamic(
  () => import('@/components/ModelDashboard/MapVisualizer'),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#111] flex items-center justify-center text-gray-500 text-sm tracking-wider uppercase">Loading Map...</div> }
);

export default function ModelDashboard() {
  const [spatialData, setSpatialData] = useState<any[]>([]);
  const [geoJson, setGeoJson] = useState<any>(null);
  const [featureImpacts, setFeatureImpacts] = useState<any[]>([]);
  
  // Dashboard state
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<'prediction' | 'residual' | 'hotspot'>('prediction');
  
  // What-If modifiers (1.0 = baseline)
  const [simulationModifiers, setSimulationModifiers] = useState({
    migration: 1.0,
    aging: 1.0,
    vacancy: 1.0,
  });

  // Fetch data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [spatialRes, geoRes, impactRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/spatial-data'),
          fetch('http://127.0.0.1:8000/api/geojson'),
          fetch('http://127.0.0.1:8000/api/feature-impacts')
        ]);
        
        if (spatialRes.ok) setSpatialData(await spatialRes.json());
        if (geoRes.ok) setGeoJson(await geoRes.json());
        if (impactRes.ok) setFeatureImpacts(await impactRes.json());
      } catch (e) {
        console.error("Failed to load model data:", e);
      }
    }
    loadData();
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden bg-[#111] text-white flex flex-col font-sans">
      
      {/* Top Nav */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md z-40">
        <div className="flex items-center gap-4">
          <h1 className="text-xl tracking-wider font-light uppercase">Japan Demographic <span className="text-[#e27676] font-medium">Model</span></h1>
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg">
          <button 
            onClick={() => setMapLayer('prediction')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${mapLayer === 'prediction' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Prediction
          </button>
          <button 
            onClick={() => setMapLayer('residual')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${mapLayer === 'residual' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Residuals
          </button>
          <button 
            onClick={() => setMapLayer('hotspot')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${mapLayer === 'hotspot' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Hotspots
          </button>
        </div>
      </header>

      <main className="flex-1 relative flex">
        
        {/* Main Map Background */}
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

        {/* Left Sidebar: Simulation Controls */}
        <div className="w-80 h-full bg-black/60 backdrop-blur-xl border-r border-white/10 z-10 p-6 flex flex-col overflow-y-auto">
          <SimulationControls 
            modifiers={simulationModifiers} 
            setModifiers={setSimulationModifiers} 
          />
        </div>

        {/* Right Sidebar: Inspector */}
        <div className={`absolute top-0 right-0 h-full w-96 bg-black/80 backdrop-blur-xl border-l border-white/10 z-20 transform transition-transform duration-500 ease-out flex flex-col ${selectedPrefecture ? 'translate-x-0' : 'translate-x-full'}`}>
          <InspectorPanel 
            prefecture={selectedPrefecture}
            spatialData={spatialData}
            featureImpacts={featureImpacts}
            onClose={() => setSelectedPrefecture(null)}
          />
        </div>

        {/* Bottom Sheet: Leaderboard */}
        <div className="absolute bottom-0 left-80 right-0 h-64 bg-black/70 backdrop-blur-xl border-t border-white/10 z-10 transform translate-y-[calc(100%-40px)] hover:translate-y-0 transition-transform duration-300 flex flex-col">
          <div className="h-10 w-full flex items-center justify-center cursor-pointer border-b border-white/5">
            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
          </div>
          <div className="flex-1 overflow-auto p-4">
            <LeaderboardTable 
              spatialData={spatialData}
              simulationModifiers={simulationModifiers}
              selectedPrefecture={selectedPrefecture}
              setSelectedPrefecture={setSelectedPrefecture}
            />
          </div>
        </div>

      </main>
    </div>
  );
}

'use client';
import React, { useMemo, useEffect, useRef } from 'react';
import { MapContainer, GeoJSON, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { KANJI_MAP } from '@/lib/kanjiLookup';
import { simulatedChange, type Feature, type Shifts } from '@/lib/model';

export type LabelLang = 'jp' | 'en';

// Optional basemap. Set NEXT_PUBLIC_MAP_TILE_URL (it can include your provider's API key) to show
// background tiles under the prefectures; without it the map is drawn from the prefecture shapes alone.
const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL;
const TILE_ATTRIBUTION = process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION || '';

interface MapVisualizerProps {
  geoJson: any;
  spatialData: any[];
  selectedPrefecture: string | null;
  setSelectedPrefecture: (p: string) => void;
  mapLayer: 'prediction' | 'residual' | 'hotspot';
  shifts: Shifts;
  features: Feature[];
  labelLang: LabelLang;
}

// Global styles for custom Leaflet behaviors
const leafletStyles = `
  .kanji-tooltip {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    opacity: 1 !important;
    visibility: visible;
    transition: opacity 0.4s ease, visibility 0.4s ease !important;
  }
  .kanji-tooltip::before {
    display: none !important;
  }
  @keyframes pulseGlow {
    0% { filter: drop-shadow(0 0 0px rgba(255,255,255,0)); stroke-width: 2px; }
    50% { filter: drop-shadow(0 0 15px rgba(255,255,255,1)); stroke-width: 4px; stroke: #fff; fill-opacity: 1; }
    100% { filter: drop-shadow(0 0 0px rgba(255,255,255,0)); stroke-width: 2px; }
  }
  .pulse-glow {
    animation: pulseGlow 1.5s ease-in-out 2; /* Pulse twice */
  }
  .hide-tooltips .kanji-tooltip {
    opacity: 0 !important;
    visibility: hidden;
  }
`;

// Helper component to manage Map interactions
const MapEffectController = ({ selectedPrefecture, geoJsonLayerRef }: { selectedPrefecture: string | null, geoJsonLayerRef: React.RefObject<any> }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!selectedPrefecture || !geoJsonLayerRef.current) return;
    
    const layers = geoJsonLayerRef.current.getLayers();
    const targetLayer = layers.find((l: any) => l.feature?.properties?.prefecture_en?.toLowerCase() === selectedPrefecture.toLowerCase());
    
    if (targetLayer) {
      // Zoom to the selected prefecture
      const bounds = targetLayer.getBounds();
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.2 });
      
      // Apply pulse effect
      const path = targetLayer.getElement();
      if (path) {
        path.classList.remove('pulse-glow');
        // trigger reflow
        void path.offsetWidth;
        path.classList.add('pulse-glow');
        
        // bring it to front visually
        targetLayer.bringToFront();
      }
    }
  }, [selectedPrefecture, map, geoJsonLayerRef]);

  return null;
};

const ZoomHandler = () => {
  const map = useMapEvents({
    zoomend: () => {
      const container = map.getContainer();
      if (map.getZoom() < 7) {
        container.classList.add('hide-tooltips');
      } else {
        container.classList.remove('hide-tooltips');
      }
    }
  });

  useEffect(() => {
    const container = map.getContainer();
    if (map.getZoom() < 7) {
      container.classList.add('hide-tooltips');
    }
  }, [map]);

  return null;
};

export default function MapVisualizer({
  geoJson,
  spatialData,
  selectedPrefecture,
  setSelectedPrefecture,
  mapLayer,
  shifts,
  features,
  labelLang
}: MapVisualizerProps) {
  const geoJsonLayerRef = useRef<any>(null);

  // Clean names to lowercased ascii
  // "Hokkai Do" must become "Hokkaido" (same rule as the Python pipeline), not "Hokkai".
  const cleanName = (name: string) => name ? name.replace(/^Hokkai Do$/i, 'Hokkaido').replace(/\s*(Fu|To|Ken|Prefecture)$/i, '').trim() : '';

  // 1. Prepare Data Map
  const dataMap = useMemo(() => {
    const map = new Map<string, any>();
    if (!spatialData) return map;
    
    spatialData.forEach((d) => {
      map.set(d.prefecture_en.toLowerCase(), { ...d, adjusted_change: simulatedChange(d, shifts, features) });
    });

    return map;
  }, [spatialData, shifts, features]);

  // 2. Enrich GeoJSON Features
  const enrichedGeoJson = useMemo(() => {
    if (!geoJson || !geoJson.features) return null;
    
    return {
      type: 'FeatureCollection',
      features: geoJson.features.map((f: any, idx: number) => {
        const rawName = f.properties.nam || f.properties.nam_ja || '';
        const clean = cleanName(rawName).toLowerCase();
        const data = dataMap.get(clean) || {};
        const hasData = Object.keys(data).length > 0;

        const newProps: any = {
          ...f.properties,
          ...data,
          id: idx,
          prefecture_en: hasData ? data.prefecture_en || cleanName(rawName) : '',
        };

        // Compute colors with strict coalescing fallbacks
        let predColor = '#2a2a2a';
        if (hasData && typeof data.adjusted_change === 'number') {
          const val = data.adjusted_change;
          const baselineMedian = data.national_median;
          if (val < baselineMedian - 2.5) predColor = '#d73027'; // Way worse than baseline median
          else if (val < baselineMedian - 0.5) predColor = '#fc8d59'; // Worse than baseline median
          else if (val <= baselineMedian + 0.5) predColor = '#fee090'; // Around baseline median
          else if (val <= baselineMedian + 2.5) predColor = '#e0f3f8'; // Better than baseline median
          else predColor = '#4575b4'; // Way better than baseline median
        }
        newProps.prediction_color = predColor;

        let resColor = '#2a2a2a';
        if (hasData && typeof data.residual === 'number') {
          // residual = actual − LOOCV prediction
          const val = data.residual;
          if (val < -0.5) resColor = '#d73027';
          else if (val <= 0.5) resColor = '#ffffbf';
          else resColor = '#4575b4';
        }

        let hotColor = '#2a2a2a';
        if (hasData && typeof data.lisa_cluster === 'string') {
          const ht = data.lisa_cluster; // 'NS' (not significant) keeps the default grey
          if (ht === 'HH') hotColor = '#d73027';
          else if (ht === 'LL') hotColor = '#4575b4';
          else if (ht === 'HL') hotColor = '#fc8d59';
          else if (ht === 'LH') hotColor = '#91bfdb';
        }
        newProps.residual_color = resColor;
        newProps.hotspot_color = hotColor;

        return {
          ...f,
          id: idx,
          properties: newProps,
        };
      }),
    };
  }, [geoJson, dataMap]);

  // Handle styles
  const styleFeature = (feature: any) => {
    const colorProp = mapLayer === 'prediction' ? 'prediction_color' : mapLayer === 'residual' ? 'residual_color' : 'hotspot_color';
    return {
      fillColor: feature.properties[colorProp] || '#2a2a2a',
      fillOpacity: 0.8,
      color: '#ffffff',
      weight: 1.5,
      opacity: 1.0
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const enName = feature.properties?.prefecture_en || '';
    const jpName = KANJI_MAP.get(enName.toLowerCase())?.jp || feature.properties?.nam_ja || enName;
    const label = labelLang === 'en' ? enName : jpName;

    // Permanent prefecture-name label (Japanese or English)
    if (label) {
      layer.bindTooltip(
        `<span style="color: white; font-size: 11px; font-weight: bold; text-shadow: 1px 1px 3px black, -1px -1px 3px black, 1px -1px 3px black, -1px 1px 3px black;">${label}</span>`,
        { permanent: true, direction: 'center', className: 'kanji-tooltip' }
      );
    }

    layer.on({
      mouseover: (e) => {
        const target = e.target;
        target.setStyle({
          weight: 2,
          color: '#ffffff',
          fillOpacity: 0.9,
        });
        target.bringToFront();
      },
      mouseout: (e) => {
        const target = e.target;
        target.setStyle(styleFeature(feature));
      },
      click: (e) => {
        if (enName) setSelectedPrefecture(enName);
      }
    });
  };

  const geoJsonKey = `${mapLayer}-${shifts.migration}-${shifts.aging}-${shifts.vacancy}-${features.length}-${labelLang}`;

  const japanBounds: L.LatLngBoundsExpression = [
    [24.0, 122.0], // Southwest coordinates
    [46.0, 154.0], // Northeast coordinates
  ];

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-white/5 bg-[#0a0a0a]">
      <style>{leafletStyles}</style>
      <MapContainer
        center={[36.2048, 138.2529]}
        zoom={5}
        minZoom={5}
        maxBounds={japanBounds}
        maxBoundsViscosity={1.0} // Prevents dragging outside bounds entirely
        scrollWheelZoom={true}
        preferCanvas={true}
        style={{ height: '100%', width: '100%', background: 'transparent' }}
      >
        {TILE_URL && <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />}
        {enrichedGeoJson && (
          <GeoJSON
            ref={geoJsonLayerRef}
            key={geoJsonKey}
            data={enrichedGeoJson as any}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
        <MapEffectController selectedPrefecture={selectedPrefecture} geoJsonLayerRef={geoJsonLayerRef} />
        <ZoomHandler />
      </MapContainer>
    </div>
  );
}

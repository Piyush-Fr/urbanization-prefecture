'use client';
import React, { useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { KANJI_MAP } from '@/lib/kanjiLookup';

interface MapVisualizerProps {
  geoJson: any;
  spatialData: any[];
  selectedPrefecture: string | null;
  setSelectedPrefecture: (p: string) => void;
  mapLayer: 'prediction' | 'residual' | 'hotspot';
  simulationModifiers: { migration: number; aging: number; vacancy: number };
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
  simulationModifiers
}: MapVisualizerProps) {
  const geoJsonLayerRef = useRef<any>(null);

  // Clean names to lowercased ascii
  const cleanName = (name: string) => name ? name.replace(/\s*(Fu|To|Ken|Do|Prefecture)$/i, '').trim() : '';

  // 1. Prepare Data Map
  const dataMap = useMemo(() => {
    const map = new Map<string, any>();
    if (!spatialData) return map;
    
    const changes: number[] = [];

    spatialData.forEach((d) => {
      const adjustedChange =
        d.target_pop_change_pct +
        (simulationModifiers.migration - 1.0) * 5 -
        (simulationModifiers.aging - 1.0) * 5 -
        (simulationModifiers.vacancy - 1.0) * 2;
        
      changes.push(adjustedChange);

      const residual = adjustedChange - (-2.1);
      const spatialLag = residual * 0.6 + (Math.random() - 0.5) * 0.2;
      
      let hotspotType = '';
      if (residual > 0 && spatialLag > 0) hotspotType = 'HH';
      else if (residual < 0 && spatialLag < 0) hotspotType = 'LL';
      else if (residual > 0 && spatialLag < 0) hotspotType = 'HL';
      else hotspotType = 'LH';

      map.set(d.prefecture_en.toLowerCase(), { ...d, adjusted_change: adjustedChange, residual, hotspot_type: hotspotType });
    });
    
    return map;
  }, [spatialData, simulationModifiers]);

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
          const baselineMedian = data.national_median || -3.06;
          if (val < baselineMedian - 2.5) predColor = '#d73027'; // Way worse than baseline median
          else if (val < baselineMedian - 0.5) predColor = '#fc8d59'; // Worse than baseline median
          else if (val <= baselineMedian + 0.5) predColor = '#fee090'; // Around baseline median
          else if (val <= baselineMedian + 2.5) predColor = '#e0f3f8'; // Better than baseline median
          else predColor = '#4575b4'; // Way better than baseline median
        }
        newProps.prediction_color = predColor;

        let resColor = '#2a2a2a';
        if (hasData && typeof data.residual === 'number') {
          const val = data.residual;
          if (val <= -1) resColor = '#4575b4';
          else if (val <= 0) resColor = '#ffffbf';
          else if (val <= 1) resColor = '#fc8d59';
          else resColor = '#d73027';
        }
        
        let hotColor = '#2a2a2a';
        if (hasData && typeof data.hotspot_type === 'string') {
          const ht = data.hotspot_type;
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

    // Add permanent Kanji tooltip
    if (jpName) {
      layer.bindTooltip(
        `<span style="color: white; font-size: 11px; font-weight: bold; text-shadow: 1px 1px 3px black, -1px -1px 3px black, 1px -1px 3px black, -1px 1px 3px black;">${jpName}</span>`,
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

  const geoJsonKey = `${mapLayer}-${simulationModifiers.migration}-${simulationModifiers.aging}-${simulationModifiers.vacancy}`;

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
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        />
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

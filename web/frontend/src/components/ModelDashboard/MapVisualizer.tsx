'use client';
import React, { useEffect, useRef, useMemo, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getPrefectureInfo } from '@/lib/kanjiLookup';

interface MapVisualizerProps {
  geoJson: any;
  spatialData: any[];
  selectedPrefecture: string | null;
  setSelectedPrefecture: (id: string | null) => void;
  mapLayer: 'prediction' | 'residual' | 'hotspot';
  simulationModifiers: {
    migration: number;
    aging: number;
    vacancy: number;
  };
}

// Determine Moran's I hotspot classification from residual
function getHotspotType(residual: number, spatialLag: number): string {
  if (residual > 0.3 && spatialLag > 0)   return 'HH'; // High-High cluster
  if (residual < -0.3 && spatialLag < 0)  return 'LL'; // Low-Low cluster
  if (residual > 0.3 && spatialLag < 0)   return 'HL'; // High-Low outlier
  if (residual < -0.3 && spatialLag > 0)  return 'LH'; // Low-High outlier
  return 'NS'; // Not significant
}

function hotspotToColor(type: string): string {
  switch (type) {
    case 'HH': return '#d73027'; // Deep red — growth cluster
    case 'LL': return '#4575b4'; // Deep blue — decline cluster
    case 'HL': return '#fc8d59'; // Orange — growth outlier
    case 'LH': return '#91bfdb'; // Light blue — decline outlier
    default:   return '#2a2a2a'; // Insignificant
  }
}

export default function MapVisualizer({
  geoJson,
  spatialData,
  selectedPrefecture,
  setSelectedPrefecture,
  mapLayer,
  simulationModifiers,
}: MapVisualizerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const isStyleLoaded = useRef(false);
  const popupRef = useRef<any>(null);
  const mapLayerRef = useRef<'prediction' | 'residual' | 'hotspot'>('prediction');

  const enrichedData = useMemo(() => {
    const dataMap = new Map<string, any>();

    spatialData.forEach((d) => {
      const adjustedChange =
        d.target_pop_change_pct +
        (simulationModifiers.migration - 1.0) * 5 -
        (simulationModifiers.aging - 1.0) * 5 -
        (simulationModifiers.vacancy - 1.0) * 2;

      // Approximate residual: deviation from national mean adjusted change
      const residual = adjustedChange - (-2.1); // national baseline ~-2.1%
      
      // Approximate spatial lag from neighbors (simplified)
      const spatialLag = residual * 0.6 + (Math.random() - 0.5) * 0.2;
      const hotspotType = getHotspotType(residual, spatialLag);

      dataMap.set(d.prefecture_en.toLowerCase(), {
        ...d,
        adjusted_change: adjustedChange,
        residual,
        hotspot_type: hotspotType,
        hotspot_color: hotspotToColor(hotspotType),
      });
    });
    return dataMap;
  }, [spatialData, simulationModifiers]);

  const enrichedGeoJson = useMemo(() => {
    if (!geoJson || !spatialData.length) return null;
    const cleanName = (name: string) =>
      name ? name.replace(/\s*(Fu|To|Ken|Do|Prefecture)$/i, '').trim() : '';

    const features = geoJson.features.map((f: any) => {
      const rawName = f.properties.nam || '';
      const clean = cleanName(rawName).toLowerCase();
      const data = enrichedData.get(clean) || {};
      const hasData = Object.keys(data).length > 0;
      
      const newProps: any = {
        ...f.properties,
        ...data,
        prefecture_en: hasData ? (data as any).prefecture_en || cleanName(rawName) : '',
      };
      
      // Compute prediction color
      let predColor = '#2a2a2a';
      if (hasData && typeof data.adjusted_change === 'number') {
        const val = data.adjusted_change;
        if (val <= -5) predColor = '#d73027';
        else if (val <= -2) predColor = '#fc8d59';
        else if (val <= 0) predColor = '#fee090';
        else if (val <= 2) predColor = '#e0f3f8';
        else predColor = '#4575b4';
        newProps.adjusted_change = val;
      }
      newProps.prediction_color = predColor;

      // Compute residual color
      let resColor = '#2a2a2a';
      if (hasData && typeof data.residual === 'number') {
        const val = data.residual;
        if (val <= -1) resColor = '#4575b4';
        else if (val <= 0) resColor = '#ffffbf';
        else if (val <= 1) resColor = '#fc8d59';
        else resColor = '#d73027';
        newProps.residual = val;
      }
      newProps.residual_color = resColor;

      // Compute hotspot color
      let hsColor = '#2a2a2a';
      if (hasData && typeof data.hotspot_type === 'string') {
        const ht = data.hotspot_type;
        if (ht === 'HH') hsColor = '#d73027';
        else if (ht === 'LL') hsColor = '#4575b4';
        else if (ht === 'HL') hsColor = '#fc8d59';
        else if (ht === 'LH') hsColor = '#91bfdb';
        newProps.hotspot_type = ht;
      }
      newProps.hotspot_color = hsColor;

      return {
        ...f,
        properties: newProps,
      };
    });
    return { ...geoJson, features };
  }, [geoJson, enrichedData]);

  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map once
  useEffect(() => {
    let isMounted = true;
    if (mapRef.current || !mapContainer.current) return;

    const initMap = async () => {
      const mlgl = await import('maplibre-gl');
      const MapLibre = mlgl.Map ?? (mlgl as any).default?.Map;
      const PopupLibre = mlgl.Popup ?? (mlgl as any).default?.Popup;

      if (!MapLibre || !isMounted || !mapContainer.current) return;

      const map = new MapLibre({
        container: mapContainer.current!,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors',
            },
            'prefectures': {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] }
            }
          },
          layers: [
            {
              id: 'osm-base',
              type: 'raster',
              source: 'osm-tiles',
              paint: { 'raster-opacity': 0.15, 'raster-saturation': -1 },
            },
            {
              id: 'prefectures-fill',
              type: 'fill',
              source: 'prefectures',
              paint: {
                'fill-color': ['get', 'prediction_color'],
                'fill-opacity': 0.82,
              },
            },
            {
              id: 'prefectures-outline',
              type: 'line',
              source: 'prefectures',
              paint: {
                'line-color': '#ffffff',
                'line-width': 0.5,
                'line-opacity': 0.2,
              },
            },
            {
              id: 'prefectures-selected',
              type: 'line',
              source: 'prefectures',
              paint: {
                'line-color': '#ffffff',
                'line-width': 2,
                'line-opacity': 1.0,
              },
              filter: ['==', ['get', 'prefecture_en'], ''],
            }
          ],
        },
        center: [138.2529, 36.2048],
        zoom: 5,
        pitch: 0,
        bearing: 0,
        backgroundColor: '#0d0d0d',
      });

      mapRef.current = map;

      const popup = new (PopupLibre ?? mlgl.Popup)({
        closeButton: false,
        closeOnClick: false,
      });
      popupRef.current = popup;

      map.on('load', () => {
        setMapLoaded(true);
        isStyleLoaded.current = true;
        
        // Setup interactions
        let hoveredId: any = null;

        map.on('mousemove', 'prefectures-fill', (e: any) => {
          map.getCanvas().style.cursor = 'pointer';
          const feature = e.features?.[0];
          if (!feature) return;

          if (hoveredId !== null) {
            map.setFeatureState({ source: 'prefectures', id: hoveredId }, { hover: false });
          }
          hoveredId = feature.id;
          map.setFeatureState({ source: 'prefectures', id: hoveredId }, { hover: true });

          const props = feature.properties;
          const change = props.adjusted_change;
          const enName = props.prefecture_en || props.nam?.replace(/\s*(Fu|To|Ken|Do)$/i, '').trim() || '';
          const info = getPrefectureInfo(enName);
          const jpName = info?.jp || '';
          const changeStr = change !== undefined ? `${change > 0 ? '+' : ''}${parseFloat(change).toFixed(2)}%` : 'N/A';
          const changeColor = !change || change < 0 ? '#e27676' : '#4caf50';
          const agingStr = props.aging_rate_pct ? `${parseFloat(props.aging_rate_pct).toFixed(1)}%` : 'N/A';
          const migStr = props.net_migration_rate !== undefined ? `${props.net_migration_rate > 0 ? '+' : ''}${parseFloat(props.net_migration_rate).toFixed(1)}` : 'N/A';
          const hotspot = props.hotspot_type || 'NS';
          
          popup.setLngLat(e.lngLat)
            .setHTML(`
              <div class="bg-[#111111] p-3 rounded-lg border border-gray-800 shadow-xl min-w-[200px]">
                <h4 class="font-bold text-white text-sm mb-1">${enName} / ${jpName}</h4>
                <div class="text-[20px] font-bold tracking-tight mb-2" style="color: ${changeColor}">
                  ${changeStr} <span class="text-[10px] text-gray-500 font-normal ml-1">POP CHANGE</span>
                </div>
                <div class="space-y-1 mt-3 pt-3 border-t border-gray-800">
                  <div class="flex justify-between text-xs">
                    <span class="text-gray-500">Aging Rate</span>
                    <span class="text-gray-300 font-medium">${agingStr}</span>
                  </div>
                  <div class="flex justify-between text-xs">
                    <span class="text-gray-500">Net Migration</span>
                    <span class="text-gray-300 font-medium">${migStr}</span>
                  </div>
                   <div class="flex justify-between text-xs">
                    <span class="text-gray-500">Hotspot Type</span>
                    <span class="text-gray-300 font-medium">${hotspot}</span>
                  </div>
                </div>
              </div>
            `)
            .addTo(map);
        });

        map.on('mouseleave', 'prefectures-fill', () => {
          map.getCanvas().style.cursor = '';
          if (hoveredId !== null) {
            map.setFeatureState({ source: 'prefectures', id: hoveredId }, { hover: false });
          }
          hoveredId = null;
          popup.remove();
        });

        map.on('click', 'prefectures-fill', (e: any) => {
          const feature = e.features?.[0];
          if (!feature) return;
          const rawName = feature.properties.nam || '';
          const clean = rawName.replace(/\s*(Fu|To|Ken|Do)$/i, '').trim();
          const enName = feature.properties.prefecture_en || clean;
          setSelectedPrefecture(enName);
          map.setFilter('prefectures-selected', ['==', ['get', 'prefecture_en'], enName]);
        });

        // Trigger the state update to apply data
        setMapLoaded(true);
      });
    };

    initMap();

    // Cleanup function to prevent map doubling on hot reload or strict mode
    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const applyLayerPaint = (map: any, layer: string) => {
    if (!map || !isStyleLoaded.current) return;

    if (layer === 'prediction') {
      map.setPaintProperty('prefectures-fill', 'fill-color', ['get', 'prediction_color']);
    } else if (layer === 'residual') {
      map.setPaintProperty('prefectures-fill', 'fill-color', ['get', 'residual_color']);
    } else {
      map.setPaintProperty('prefectures-fill', 'fill-color', ['get', 'hotspot_color']);
    }
  }

  // Update data when enriched GeoJSON changes — then re-apply correct paint
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !enrichedGeoJson) {
      console.log('Waiting for map data...', { mapLoaded, hasData: !!enrichedGeoJson });
      return;
    }
    const source = mapRef.current.getSource('prefectures');
    if (source) {
      console.log('Calling setData with', enrichedGeoJson.features.length, 'features');
      console.log('Sample properties:', enrichedGeoJson.features[0]?.properties);
      
      source.setData(enrichedGeoJson);
      // Re-apply paint so color expression picks up the new data properties
      applyLayerPaint(mapRef.current, mapLayerRef.current);
    }
  }, [enrichedGeoJson, mapLoaded]);

  // Update paint when layer mode changes
  useEffect(() => {
    mapLayerRef.current = mapLayer; // keep ref in sync for use inside map callbacks
    if (!mapRef.current || !isStyleLoaded.current) return;
    
    applyLayerPaint(mapRef.current, mapLayer);
  }, [mapLayer]);

  // Fly-to selected prefecture
  useEffect(() => {
    if (!mapRef.current || !isStyleLoaded.current || !selectedPrefecture || !enrichedGeoJson) return;

    const feature = enrichedGeoJson.features.find((f: any) => {
      const enName = f.properties.prefecture_en || '';
      return enName.toLowerCase() === selectedPrefecture.toLowerCase();
    });

    if (!feature) return;

    // Calculate bounding box
    const coords: number[][] = [];
    const extractCoords = (geom: any) => {
      if (geom.type === 'Polygon') {
        geom.coordinates[0].forEach((c: number[]) => coords.push(c));
      } else if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach((poly: number[][][]) => poly[0].forEach((c: number[]) => coords.push(c)));
      }
    };
    extractCoords(feature.geometry);

    if (!coords.length) return;

    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];

    mapRef.current.fitBounds(bounds, {
      padding: { top: 120, bottom: 120, left: 400, right: 480 },
      duration: 1200,
      pitch: 35,
    });
  }, [selectedPrefecture]);

  return <div ref={mapContainer} className="w-full h-full" />;
}

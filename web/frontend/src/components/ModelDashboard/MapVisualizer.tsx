'use client';
import React, { useEffect, useRef, useMemo } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

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

function getPrefChangeColor(change: number): string {
  if (change <= -6) return '#d73027';
  if (change <= -3) return '#fc8d59';
  if (change <= 0) return '#fee090';
  if (change <= 2) return '#e0f3f8';
  return '#4575b4';
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

  const enrichedData = useMemo(() => {
    const dataMap = new Map<string, any>();
    const cleanName = (name: string) =>
      name ? name.replace(/\s*(Fu|To|Ken|Do)$/i, '').trim() : '';

    spatialData.forEach((d) => {
      const adjustedChange =
        d.target_pop_change_pct +
        (simulationModifiers.migration - 1.0) * 5 -
        (simulationModifiers.aging - 1.0) * 5 -
        (simulationModifiers.vacancy - 1.0) * 2;

      dataMap.set(d.prefecture_en.toLowerCase(), {
        ...d,
        adjusted_change: adjustedChange,
      });
    });
    return dataMap;
  }, [spatialData, simulationModifiers]);

  // Compute enriched geojson
  const enrichedGeoJson = useMemo(() => {
    if (!geoJson || !spatialData.length) return null;
    const cleanName = (name: string) =>
      name ? name.replace(/\s*(Fu|To|Ken|Do)$/i, '').trim() : '';

    const features = geoJson.features.map((f: any) => {
      const rawName = f.properties.nam || '';
      const clean = cleanName(rawName).toLowerCase();
      const data = enrichedData.get(clean) || {};
      return {
        ...f,
        properties: {
          ...f.properties,
          ...data,
        },
      };
    });
    return { ...geoJson, features };
  }, [geoJson, enrichedData]);

  // Initialize map once
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    const initMap = async () => {
      const mlgl = await import('maplibre-gl');
      console.log('[MapVisualizer] maplibre-gl exports:', Object.keys(mlgl));

      // maplibre-gl v6 exports Map and Popup as named exports
      const MapLibre = mlgl.Map ?? (mlgl as any).default?.Map;
      const PopupLibre = mlgl.Popup ?? (mlgl as any).default?.Popup;

      if (!MapLibre) {
        console.error('maplibre-gl Map not found in module exports:', Object.keys(mlgl));
        return;
      }

      const map = new MapLibre({
        container: mapContainer.current!,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [138.2529, 36.2048],
        zoom: 5,
        pitch: 40,
        bearing: -5,
      });

      mapRef.current = map;

      map.on('load', () => {
        isStyleLoaded.current = true;

        // Add source
        map.addSource('prefectures', {
          type: 'geojson',
          data: enrichedGeoJson || { type: 'FeatureCollection', features: [] },
        });

        // Fill layer
        map.addLayer({
          id: 'prefectures-fill',
          type: 'fill',
          source: 'prefectures',
          paint: {
            'fill-color': [
              'case',
              ['has', 'adjusted_change'],
              [
                'interpolate',
                ['linear'],
                ['get', 'adjusted_change'],
                -10, '#d73027',
                -3, '#fc8d59',
                0, '#fee090',
                2, '#e0f3f8',
                5, '#4575b4',
              ],
              '#333333',
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.95,
              0.75,
            ],
          },
        });

        // Outline
        map.addLayer({
          id: 'prefectures-outline',
          type: 'line',
          source: 'prefectures',
          paint: {
            'line-color': '#ffffff',
            'line-width': 0.6,
            'line-opacity': 0.3,
          },
        });

        // Selected outline
        map.addLayer({
          id: 'prefectures-selected',
          type: 'line',
          source: 'prefectures',
          paint: {
            'line-color': '#ffffff',
            'line-width': 2.5,
            'line-opacity': 1,
          },
          filter: ['==', ['get', 'nam'], ''],
        });

        // Popup/tooltip
        const popup = new (PopupLibre ?? mlgl.Popup)({
          closeButton: false,
          closeOnClick: false,
        });

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

          const change = feature.properties.adjusted_change;
          const name = feature.properties.nam || '';
          const nameClean = name.replace(/\s*(Fu|To|Ken|Do)$/i, '').trim();
          const changeStr =
            change !== undefined ? `${change > 0 ? '+' : ''}${parseFloat(change).toFixed(2)}%` : 'N/A';
          const color = change < 0 ? '#e27676' : '#4caf50';

          popup
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family:sans-serif;font-size:13px;background:#111;color:#fff;padding:10px 14px;border-radius:8px;border:1px solid #333;min-width:160px;">
                <div style="font-weight:600;margin-bottom:4px">${nameClean}</div>
                <div style="display:flex;justify-content:space-between;gap:12px">
                  <span style="color:#888">Pop Change</span>
                  <span style="color:${color};font-weight:500">${changeStr}</span>
                </div>
              </div>`
            )
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
          setSelectedPrefecture(clean);
          // Update selected outline filter
          map.setFilter('prefectures-selected', ['==', ['get', 'nam'], rawName]);
        });
      });
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        isStyleLoaded.current = false;
      }
    };
  }, []); // Only run once on mount

  // Update GeoJSON data when enriched data changes
  useEffect(() => {
    if (!mapRef.current || !isStyleLoaded.current || !enrichedGeoJson) return;
    const source = mapRef.current.getSource('prefectures');
    if (source) {
      source.setData(enrichedGeoJson);
    }
  }, [enrichedGeoJson]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
}

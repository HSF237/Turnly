import { useEffect, useRef } from 'react';
import maplibregl, { type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Place } from '../lib/types';
import { CATEGORY_META } from '../lib/types';
import { formatMinutes, LEVEL_STYLE, placeWaitMinutes, waitLevel } from '../lib/predict';

// MapTiler browser key (public by design; restrict allowed origins in MapTiler Cloud).
const KEY = (import.meta.env.VITE_MAPTILER_KEY as string | undefined) || 'EbgjYuOOJU9r6fRKjGnu';

const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

// Hasan's custom MapTiler map (made in the MapTiler map editor). Override with VITE_MAPTILER_MAP_ID.
const MAP_ID = (import.meta.env.VITE_MAPTILER_MAP_ID as string | undefined) || '01a211b7-ed7f-7f0e-b79f-aa08cc5169ca';
const STYLE = KEY ? `https://api.maptiler.com/maps/${MAP_ID}/style.json?key=${KEY}` : OSM_STYLE;

// Kannur, Kerala as a friendly default centre.
export const DEFAULT_CENTER = { lat: 11.8745, lng: 75.3704 };

interface Props {
  places?: Place[];
  center?: { lat: number; lng: number };
  zoom?: number;
  selectedId?: string | null;
  onSelect?: (p: Place) => void;
  /** Pick mode: click the map to choose a location. */
  picked?: { lat: number; lng: number } | null;
  onPick?: (pos: { lat: number; lng: number }) => void;
  me?: { lat: number; lng: number } | null;
  /** Draw a route line through these points (in order). */
  route?: { lat: number; lng: number }[] | null;
  /** Stop numbers to show on markers, by place id. */
  order?: Record<string, number>;
  className?: string;
}

function markerEl(p: Place, selected: boolean, stop?: number) {
  const min = placeWaitMinutes(p);
  const lvl = waitLevel(min);
  const color = LEVEL_STYLE[lvl].hex;
  const el = document.createElement('div');
  el.className = 'turnly-marker';
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 6px 10px rgba(15,23,42,.18));transform:scale(${selected ? 1.12 : 1});transition:transform .2s">
      <div style="display:flex;align-items:center;gap:6px;background:white;border-radius:999px;padding:5px 10px 5px 6px;border:2px solid ${color};font:600 12px 'Plus Jakarta Sans',system-ui;color:#0f172a;white-space:nowrap">
        ${
          stop
            ? `<span style="display:grid;place-items:center;width:22px;height:22px;border-radius:999px;background:#0f172a;color:white;font-size:12px;font-weight:800">${stop}</span>`
            : `<span style="display:grid;place-items:center;width:22px;height:22px;border-radius:999px;background:${color}22;font-size:13px">${CATEGORY_META[p.category]?.emoji ?? '📍'}</span>`
        }
        ${formatMinutes(min)}
      </div>
      <div style="width:2px;height:8px;background:${color}"></div>
      <div style="width:8px;height:8px;border-radius:999px;background:${color};border:2px solid white"></div>
    </div>`;
  return el;
}

export default function MapView({ places = [], center, zoom = 13, selectedId, onSelect, picked, onPick, me, route, order, className = '' }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const pickMarker = useRef<maplibregl.Marker | null>(null);
  const meMarker = useRef<maplibregl.Marker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!box.current) return;
    const c = center ?? DEFAULT_CENTER;
    const m = new maplibregl.Map({
      container: box.current,
      style: STYLE,
      center: [c.lng, c.lat],
      zoom,
      attributionControl: { compact: true },
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    m.on('click', (e) => onPickRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
    map.current = m;
    return () => m.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (center && map.current) map.current.flyTo({ center: [center.lng, center.lat], zoom: Math.max(map.current.getZoom(), 14), speed: 1.4 });
  }, [center?.lat, center?.lng]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    markers.current.forEach((mk) => mk.remove());
    markers.current = places.map((p) => {
      const el = markerEl(p, p.id === selectedId, order?.[p.id]);
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        onSelect?.(p);
      });
      return new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([p.lng, p.lat]).addTo(m);
    });
  }, [places, selectedId, onSelect, order]);

  // Route line (animated dash) through the planned stops.
  const routeKey = route?.map((r) => `${r.lat.toFixed(5)},${r.lng.toFixed(5)}`).join('|') ?? '';
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    let raf = 0;
    const draw = () => {
      const data = {
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'LineString' as const, coordinates: (route ?? []).map((r) => [r.lng, r.lat]) },
      };
      const src = m.getSource('route') as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(data);
      else {
        m.addSource('route', { type: 'geojson', data });
        m.addLayer({ id: 'route-casing', type: 'line', source: 'route', paint: { 'line-color': '#ffffff', 'line-width': 9, 'line-opacity': 0.9 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
        m.addLayer({ id: 'route-line', type: 'line', source: 'route', paint: { 'line-color': '#0a8576', 'line-width': 5, 'line-dasharray': [0, 2, 3] }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
      }
      if (route && route.length > 1) {
        const b = new maplibregl.LngLatBounds();
        route.forEach((r) => b.extend([r.lng, r.lat]));
        m.fitBounds(b, { padding: 80, maxZoom: 15, duration: 900 });
      }
      // Marching-ants animation on the dashes.
      const steps = [
        [0, 2, 3],
        [0.5, 2, 2.5],
        [1, 2, 2],
        [1.5, 2, 1.5],
        [2, 2, 1],
        [2.5, 2, 0.5],
        [3, 2, 0],
      ];
      let i = 0;
      let last = 0;
      const tick = (ts: number) => {
        if (ts - last > 70 && m.getLayer('route-line')) {
          m.setPaintProperty('route-line', 'line-dasharray', steps[i]);
          i = (i + 1) % steps.length;
          last = ts;
        }
        raf = requestAnimationFrame(tick);
      };
      if (route && route.length > 1) raf = requestAnimationFrame(tick);
    };
    if (m.isStyleLoaded()) draw();
    else m.once('load', draw);
    return () => cancelAnimationFrame(raf);
  }, [routeKey]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    pickMarker.current?.remove();
    if (picked) {
      pickMarker.current = new maplibregl.Marker({ color: '#0a8576' }).setLngLat([picked.lng, picked.lat]).addTo(m);
    }
  }, [picked?.lat, picked?.lng]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    meMarker.current?.remove();
    if (me) {
      const el = document.createElement('div');
      el.innerHTML =
        '<div style="width:16px;height:16px;border-radius:999px;background:#2563eb;border:3px solid white;box-shadow:0 0 0 6px rgba(37,99,235,.2)"></div>';
      meMarker.current = new maplibregl.Marker({ element: el }).setLngLat([me.lng, me.lat]).addTo(m);
    }
  }, [me?.lat, me?.lng]);

  return <div ref={box} className={`h-full w-full ${className}`} />;
}

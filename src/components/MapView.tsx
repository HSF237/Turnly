import { useEffect, useRef } from 'react';
import maplibregl, { type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Place } from '../lib/types';
import { CATEGORY_META } from '../lib/types';
import { formatMinutes, LEVEL_STYLE, placeWaitMinutes, waitLevel } from '../lib/predict';

const KEY = import.meta.env.VITE_MAPTILER_KEY as string | undefined;

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

const STYLE = KEY ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${KEY}` : OSM_STYLE;

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
  className?: string;
}

function markerEl(p: Place, selected: boolean) {
  const min = placeWaitMinutes(p);
  const lvl = waitLevel(min);
  const color = LEVEL_STYLE[lvl].hex;
  const el = document.createElement('div');
  el.className = 'turnly-marker';
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 6px 10px rgba(15,23,42,.18));transform:scale(${selected ? 1.12 : 1});transition:transform .2s">
      <div style="display:flex;align-items:center;gap:6px;background:white;border-radius:999px;padding:5px 10px 5px 6px;border:2px solid ${color};font:600 12px 'Plus Jakarta Sans',system-ui;color:#0f172a;white-space:nowrap">
        <span style="display:grid;place-items:center;width:22px;height:22px;border-radius:999px;background:${color}22;font-size:13px">${CATEGORY_META[p.category]?.emoji ?? '📍'}</span>
        ${formatMinutes(min)}
      </div>
      <div style="width:2px;height:8px;background:${color}"></div>
      <div style="width:8px;height:8px;border-radius:999px;background:${color};border:2px solid white"></div>
    </div>`;
  return el;
}

export default function MapView({ places = [], center, zoom = 13, selectedId, onSelect, picked, onPick, me, className = '' }: Props) {
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
      const el = markerEl(p, p.id === selectedId);
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        onSelect?.(p);
      });
      return new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([p.lng, p.lat]).addTo(m);
    });
  }, [places, selectedId, onSelect]);

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

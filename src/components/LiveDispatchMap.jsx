import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Siren, MapPin, Clock, Navigation } from 'lucide-react';

// Haversine distance in meters
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

const policeIcon = L.divIcon({
  className: 'police-dispatch-icon',
  html: '<div style="font-size:24px; line-height:1; filter:drop-shadow(0 0 4px rgba(59,130,246,0.8));">🚓</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const destIcon = L.divIcon({
  className: 'police-dispatch-dest-icon',
  html: '<div style="font-size:22px; line-height:1; filter:drop-shadow(0 0 4px rgba(239,68,68,0.8));">📍</div>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function FitBounds({ origin, dest }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([origin, dest]).pad(0.2);
    map.fitBounds(bounds, { animate: true });
  }, [origin, dest, map]);
  return null;
}

export default function LiveDispatchMap({ dispatch }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!dispatch) return null;

  const origin = [dispatch.origin_lat, dispatch.origin_lng];
  const dest = [dispatch.dest_lat, dispatch.dest_lng];
  const now = Date.now();
  const elapsed = (now - new Date(dispatch.dispatched_at).getTime()) / 1000;
  const eta = dispatch.eta_seconds || 600;
  const progress = dispatch.status === 'arrived' ? 1 : Math.min(1, elapsed / eta);

  const curLat = lerp(origin[0], dest[0], progress);
  const curLng = lerp(origin[1], dest[1], progress);
  const current = [curLat, curLng];

  const remainingMeters =
    dispatch.status === 'arrived' ? 0 : haversine(curLat, curLng, dest[0], dest[1]);
  const remainingSeconds = Math.max(0, eta - elapsed);
  const isArrived = dispatch.status === 'arrived' || progress >= 1;

  const fmtDist = (m) => {
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(2)} km`;
  };
  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return `${m}m ${sec}s`;
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-blue-700/50 bg-zinc-900">
      <div className="px-4 py-3 flex items-center justify-between bg-blue-950/40 border-b border-blue-800/50">
        <div className="flex items-center gap-2">
          <Siren className="w-4 h-4 text-blue-400" />
          <span className="text-white font-bold text-sm">{dispatch.unit_id}</span>
          {dispatch.origin_label && (
            <span className="text-zinc-500 text-xs">from {dispatch.origin_label}</span>
          )}
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${isArrived ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300 animate-pulse'}`}>
          {isArrived ? 'ON SCENE' : 'EN ROUTE'}
        </span>
      </div>

      <div style={{ height: 220 }} className="w-full bg-zinc-950">
        <MapContainer
          center={dest}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <FitBounds origin={origin} dest={dest} />
          <Polyline positions={[origin, current]} pathOptions={{ color: '#3b82f6', weight: 3, dashArray: '6 8' }} />
          <Polyline positions={[current, dest]} pathOptions={{ color: '#ef4444', weight: 2, opacity: 0.5 }} />
          <Marker position={current} icon={policeIcon} />
          <Marker position={dest} icon={destIcon} />
        </MapContainer>
      </div>

      <div className="px-4 py-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-zinc-500 text-[10px] uppercase tracking-wider flex items-center justify-center gap-1">
            <Navigation className="w-3 h-3" /> Distance
          </p>
          <p className="text-white font-bold text-sm mt-0.5">{fmtDist(remainingMeters)}</p>
        </div>
        <div>
          <p className="text-zinc-500 text-[10px] uppercase tracking-wider flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" /> ETA
          </p>
          <p className="text-white font-bold text-sm mt-0.5">
            {isArrived ? '—' : fmtTime(remainingSeconds)}
          </p>
        </div>
        <div>
          <p className="text-zinc-500 text-[10px] uppercase tracking-wider flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" /> Progress
          </p>
          <p className="text-white font-bold text-sm mt-0.5">{Math.round(progress * 100)}%</p>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function lerp(a, b, t) {
  return a + (b - a) * t;
}

const policeIcon = L.divIcon({
  className: 'police-board-icon',
  html: '<div style="font-size:26px; line-height:1; filter:drop-shadow(0 0 6px rgba(59,130,246,0.9));">🚓</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const destIcon = L.divIcon({
  className: 'police-board-dest-icon',
  html: '<div style="font-size:24px; line-height:1; filter:drop-shadow(0 0 6px rgba(239,68,68,0.9));">📍</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function FitAll({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points).pad(0.15);
    map.fitBounds(bounds, { animate: true });
  }, [points, map]);
  return null;
}

export default function LiveDispatchBoardMap({ dispatches }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!dispatches.length) return null;

  const now = Date.now();
  const allPoints = [];

  const segments = dispatches.map((d) => {
    const origin = [d.origin_lat, d.origin_lng];
    const dest = [d.dest_lat, d.dest_lng];
    const elapsed = (now - new Date(d.dispatched_at).getTime()) / 1000;
    const eta = d.eta_seconds || 600;
    const progress = d.status === 'arrived' ? 1 : Math.min(1, elapsed / eta);
    const cur = [lerp(origin[0], dest[0], progress), lerp(origin[1], dest[1], progress)];
    allPoints.push(origin, cur, dest);
    return { d, origin, dest, cur, progress };
  });

  return (
    <div style={{ height: 360 }} className="w-full rounded-2xl overflow-hidden border border-blue-700/50 bg-zinc-950">
      <MapContainer
        center={segments[0].dest}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <FitAll points={allPoints} />
        {segments.map(({ d, origin, dest, cur }) => (
          <React.Fragment key={d.id}>
            <Polyline positions={[origin, cur]} pathOptions={{ color: '#3b82f6', weight: 3, dashArray: '6 8' }} />
            <Polyline positions={[cur, dest]} pathOptions={{ color: '#ef4444', weight: 2, opacity: 0.4 }} />
            <Marker position={cur} icon={policeIcon} />
            <Marker position={dest} icon={destIcon} />
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
}
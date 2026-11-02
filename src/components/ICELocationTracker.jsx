import React, { useState, useEffect, useRef } from 'react';
import { Navigation, MapPin, Crosshair, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ICELocationTracker({ user }) {
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState(null);
  const [pos, setPos] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [history, setHistory] = useState([]);
  const mountedRef = useRef(true);

  const ankleInstalled = user?.ankle_monitor_installed === true;
  const monitorId = user?.ankle_monitor_id;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device.');
      return;
    }
    setError(null);
    setTracking(true);
    setHistory([]);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        if (!mountedRef.current) return;
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        const reading = {
          latitude,
          longitude,
          accuracy,
          speed: speed ?? 0,
          heading: heading ?? null,
          timestamp: position.timestamp,
        };
        setPos(reading);
        setHistory(prev => [...prev.slice(-9), reading]);
      },
      (err) => {
        if (!mountedRef.current) return;
        setError(err.message || 'Location access denied.');
        setTracking(false);
        toast.error('GPS access denied by device.');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
    setWatchId(null);
    setTracking(false);
  };

  const mapsUrl = pos
    ? `https://www.google.com/maps?q=${pos.latitude},${pos.longitude}`
    : null;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${
            tracking ? 'bg-red-900/60 border-red-500/50' : 'bg-zinc-800 border-zinc-700'
          }`}>
            <Navigation className={`w-5 h-5 ${tracking ? 'text-red-300 animate-pulse' : 'text-zinc-500'}`} />
          </div>
          <div>
            <p className="text-white font-bold text-sm">I.C.E. GPS Tracking Mode</p>
            <p className="text-zinc-500 text-xs">
              {ankleInstalled ? `Ankle monitor ${monitorId || '—'}` : 'No monitor installed'}
              {tracking ? ' · LIVE' : ''}
            </p>
          </div>
        </div>
        {tracking && (
          <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            TRACKING
          </span>
        )}
      </div>

      {/* Live coordinates */}
      {pos && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-black/40 rounded-lg p-2.5 border border-zinc-800">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wide">Latitude</p>
            <p className="text-white font-mono text-sm">{pos.latitude.toFixed(6)}</p>
          </div>
          <div className="bg-black/40 rounded-lg p-2.5 border border-zinc-800">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wide">Longitude</p>
            <p className="text-white font-mono text-sm">{pos.longitude.toFixed(6)}</p>
          </div>
          <div className="bg-black/40 rounded-lg p-2.5 border border-zinc-800">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wide">Accuracy</p>
            <p className="text-white font-mono text-sm">±{Math.round(pos.accuracy)}m</p>
          </div>
          <div className="bg-black/40 rounded-lg p-2.5 border border-zinc-800">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wide">Speed</p>
            <p className="text-white font-mono text-sm">{(pos.speed * 3.6).toFixed(1)} km/h</p>
          </div>
        </div>
      )}

      {mapsUrl && (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sky-400 text-xs hover:text-sky-300 transition-colors">
          <MapPin className="w-3.5 h-3.5" />
          View on map
        </a>
      )}

      {/* Movement log */}
      {tracking && history.length > 1 && (
        <div className="bg-black/30 rounded-lg p-2.5 border border-zinc-800 max-h-28 overflow-y-auto">
          <p className="text-zinc-500 text-[10px] uppercase tracking-wide mb-1.5">Movement Log ({history.length})</p>
          <div className="space-y-1">
            {history.slice().reverse().map((h, i) => (
              <div key={h.timestamp} className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                <Crosshair className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />
                <span>{new Date(h.timestamp).toLocaleTimeString()}</span>
                <span className="text-zinc-600">·</span>
                <span>{h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}</span>
                {i === 0 && <span className="text-red-400 font-bold">LATEST</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}

      {!tracking && !pos && (
        <p className="text-zinc-500 text-xs">
          Enable GPS tracking to broadcast your real-time location to I.C.E. — just like your ankle monitor does. Your phone's GPS will be used to track your position continuously while this mode is active.
        </p>
      )}

      <button
        onClick={tracking ? stopTracking : startTracking}
        className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
          tracking
            ? 'bg-red-900/60 hover:bg-red-800/60 text-red-200 border border-red-700/50'
            : 'bg-gradient-to-r from-sky-800 to-zinc-900 hover:from-sky-700 text-sky-100 border border-sky-600/40'
        }`}
      >
        {tracking ? (
          <>STOP TRACKING</>
        ) : (
          <>
            {navigator.geolocation ? <Navigation className="w-4 h-4" /> : <Loader2 className="w-4 h-4" />}
            ENABLE GPS TRACKING
          </>
        )}
      </button>
    </div>
  );
}
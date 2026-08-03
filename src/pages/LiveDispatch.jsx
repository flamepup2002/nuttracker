import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import LiveDispatchBoardMap from '@/components/LiveDispatchBoardMap';
import LiveDispatchMap from '@/components/LiveDispatchMap';
import {
  ArrowLeft, Siren, Navigation, Clock, MapPin, CheckCircle2, Radio
} from 'lucide-react';

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LiveDispatch() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(Date.now());

  const { data: dispatches = [], isLoading } = useQuery({
    queryKey: ['policeDispatches'],
    queryFn: () => base44.entities.PoliceDispatch.list('-dispatched_at', 100),
  });

  // live ticking for ETA/distance readouts
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // auto-arrive
  useEffect(() => {
    dispatches.forEach((d) => {
      if (d.status === 'en_route') {
        const elapsed = (now - new Date(d.dispatched_at).getTime()) / 1000;
        if (elapsed >= d.eta_seconds) {
          base44.entities.PoliceDispatch.update(d.id, {
            status: 'arrived',
            arrived_at: new Date().toISOString(),
          }).then(() => queryClient.invalidateQueries({ queryKey: ['policeDispatches'] }))
            .catch(() => {});
        }
      }
    });
  }, [dispatches, now, queryClient]);

  const enRoute = dispatches.filter(d => d.status === 'en_route');
  const arrived = dispatches.filter(d => d.status === 'arrived');

  const fmtDist = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`);
  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return `${m}m ${sec}s`;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-red-900/20" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Siren className="w-5 h-5 text-blue-400" /> Live Dispatch
          </h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="px-6 pb-24 pt-6 space-y-6">
        {/* Status banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-4 border flex items-start gap-3 ${
            enRoute.length > 0
              ? 'bg-red-950/40 border-red-700/60'
              : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <Radio className={`w-6 h-6 flex-shrink-0 mt-0.5 ${enRoute.length > 0 ? 'text-red-400 animate-pulse' : 'text-zinc-600'}`} />
          <div>
            <p className={`font-bold text-sm ${enRoute.length > 0 ? 'text-red-300' : 'text-zinc-400'}`}>
              {enRoute.length > 0 ? `${enRoute.length} unit${enRoute.length > 1 ? 's' : ''} actively responding` : 'No active dispatches'}
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              Real-time tracking of police units en route to suspect locations for arrest.
            </p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-16 text-zinc-500">Loading dispatches...</div>
        ) : dispatches.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center"
          >
            <Navigation className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No Dispatches</p>
            <p className="text-zinc-600 text-sm">Police units will appear here in real time when dispatched.</p>
          </motion.div>
        ) : (
          <>
            {/* Combined live map of all en-route units */}
            {enRoute.length > 0 && (
              <div className="space-y-2">
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                  <Navigation className="w-3 h-3 animate-pulse" /> Real-Time Unit Tracking
                </p>
                <LiveDispatchBoardMap dispatches={enRoute} />
              </div>
            )}

            {/* Active dispatch list with individual live maps */}
            {enRoute.length > 0 && (
              <div className="space-y-3">
                <p className="text-red-400 text-xs font-semibold uppercase tracking-wider">En Route</p>
                {enRoute.map((d) => {
                  const elapsed = (now - new Date(d.dispatched_at).getTime()) / 1000;
                  const progress = Math.min(1, elapsed / d.eta_seconds);
                  const curLat = d.origin_lat + (d.dest_lat - d.origin_lat) * progress;
                  const curLng = d.origin_lng + (d.dest_lng - d.origin_lng) * progress;
                  const remaining = haversine(curLat, curLng, d.dest_lat, d.dest_lng);
                  const remainingEta = Math.max(0, d.eta_seconds - elapsed);
                  return (
                    <motion.div key={d.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                      <LiveDispatchMap dispatch={d} />
                      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-zinc-900 rounded-lg py-2">
                          <p className="text-zinc-600 text-[10px] uppercase">Unit</p>
                          <p className="text-white font-bold">{d.unit_id}</p>
                        </div>
                        <div className="bg-zinc-900 rounded-lg py-2">
                          <p className="text-zinc-600 text-[10px] uppercase">Remaining</p>
                          <p className="text-white font-bold">{fmtDist(remaining)}</p>
                        </div>
                        <div className="bg-zinc-900 rounded-lg py-2">
                          <p className="text-zinc-600 text-[10px] uppercase">ETA</p>
                          <p className="text-white font-bold">{fmtTime(remainingEta)}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Arrived */}
            {arrived.length > 0 && (
              <div className="space-y-3">
                <p className="text-green-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> Arrived On Scene
                </p>
                {arrived.map((d) => (
                  <div key={d.id} className="bg-zinc-900 border border-green-800/40 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-bold text-sm flex items-center gap-2">
                        <Siren className="w-4 h-4 text-green-400" /> {d.unit_id}
                      </span>
                      <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> On Scene
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs">{d.origin_label} → suspect location</p>
                    {d.arrived_at && (
                      <p className="text-zinc-600 text-xs mt-1">Arrived {new Date(d.arrived_at).toLocaleString()}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
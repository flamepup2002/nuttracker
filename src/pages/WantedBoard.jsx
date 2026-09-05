import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, AlertOctagon, Siren, ShieldAlert } from 'lucide-react';

const SEVERITY_LEVELS = {
  high: { label: 'HIGH PRIORITY', color: 'text-red-400', bg: 'bg-red-950/50', border: 'border-red-600/50' },
  medium: { label: 'MEDIUM', color: 'text-orange-400', bg: 'bg-orange-950/50', border: 'border-orange-600/50' },
  low: { label: 'LOW', color: 'text-yellow-400', bg: 'bg-yellow-950/50', border: 'border-yellow-600/50' },
};

export default function WantedBoard() {
  const { data: warrants = [], isLoading } = useQuery({
    queryKey: ['wantedWarrants'],
    queryFn: () => base44.entities.ArrestWarrant.filter({ status: 'active' }, '-issued_at', 100),
  });

  const { data: records = [] } = useQuery({ queryKey: ['wantedRecords'], queryFn: () => base44.entities.CriminalRecord.list('-added_at', 50) });

  const getSeverity = (w) => {
    const wRecords = records.filter(r => r.warrant_id === w.id);
    if (wRecords.some(r => r.severity === 'federal' || r.severity === 'felony')) return 'high';
    if (w.charges_added?.length > 2) return 'high';
    if (w.charges_added?.length > 0) return 'medium';
    return 'low';
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Siren className="w-5 h-5 text-red-400" />
          Global Wanted Board
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        <div className="bg-red-950/30 border border-red-700/30 rounded-2xl p-5 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-red-400 animate-pulse" />
          <div>
            <p className="text-red-400 font-bold">ENFORCEMENT ACTIVE</p>
            <p className="text-zinc-400 text-sm">{warrants.length} subject{warrants.length !== 1 ? 's' : ''} flagged for arrest</p>
          </div>
        </div>

        {isLoading && <div className="text-center py-8 text-zinc-500">Loading...</div>}

        {!isLoading && warrants.length === 0 && (
          <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <ShieldAlert className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-green-400 font-bold">No active warrants</p>
            <p className="text-zinc-500 text-sm mt-1">All subjects are in compliance.</p>
          </div>
        )}

        {warrants.map((w, i) => {
          const severity = SEVERITY_LEVELS[getSeverity(w)];
          return (
            <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-2xl border-2 ${severity.border} ${severity.bg} p-5`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center">
                    <AlertOctagon className={`w-6 h-6 ${severity.color}`} />
                  </div>
                  <div>
                    <p className="text-white font-bold">WANTED</p>
                    <p className="text-zinc-400 text-xs">{new Date(w.issued_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${severity.color} bg-black/40`}>{severity.label}</span>
              </div>
              <p className="text-zinc-300 text-sm mb-2">{w.reason}</p>
              {w.charges_added?.length > 0 && (
                <div className="mt-2">
                  <p className="text-zinc-500 text-xs mb-1">Additional Charges:</p>
                  <div className="flex flex-wrap gap-1">
                    {w.charges_added.map((c, j) => <span key={j} className="text-xs bg-black/30 rounded px-2 py-0.5 text-red-300">{c}</span>)}
                  </div>
                </div>
              )}
              <Link to="/ArrestWarrants" className="block mt-3 text-center text-pink-400 text-sm hover:text-pink-300">
                View Full Warrant →
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
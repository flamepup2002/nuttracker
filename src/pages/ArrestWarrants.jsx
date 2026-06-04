import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertOctagon, Shield, Clock, CheckCircle, FileText } from 'lucide-react';

export default function ArrestWarrants() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: warrants = [], isLoading } = useQuery({
    queryKey: ['arrestWarrants'],
    queryFn: () => base44.entities.ArrestWarrant.list('-issued_at', 100),
  });

  const active = warrants.filter(w => w.status === 'active');
  const resolved = warrants.filter(w => w.status === 'resolved');

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/30 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-500" />
            Arrest Warrants
          </h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="px-6 pb-24 pt-6 space-y-6">
        {isLoading ? (
          <div className="text-center py-16 text-zinc-500">Loading...</div>
        ) : warrants.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center"
          >
            <Shield className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No Active Warrants</p>
            <p className="text-zinc-600 text-sm">You have no arrest warrants on file.</p>
          </motion.div>
        ) : (
          <>
            {/* Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="bg-red-950/50 border-2 border-red-600/70 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-red-300">{active.length}</p>
                <p className="text-zinc-400 text-sm mt-1 font-semibold">🚨 Active Warrants</p>
              </div>
              <div className="bg-green-950/30 border border-green-700/40 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-green-300">{resolved.length}</p>
                <p className="text-zinc-500 text-sm mt-1">Resolved</p>
              </div>
            </motion.div>

            {/* Active Warrants */}
            {active.length > 0 && (
              <div className="space-y-3">
                <p className="text-red-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                  <AlertOctagon className="w-3 h-3" /> Active Warrants — You Are Wanted
                </p>
                {active.map((w, idx) => (
                  <motion.div key={w.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
                    className="bg-red-950/40 border-2 border-red-600/70 rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <AlertOctagon className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm">WARRANT FOR ARREST</p>
                        <p className="text-red-300/80 text-xs mt-0.5">Issued: {new Date(w.issued_at).toLocaleString()}</p>
                      </div>
                      <span className="text-xs font-bold bg-red-600 text-white px-2 py-1 rounded-full animate-pulse">ACTIVE</span>
                    </div>
                    <div className="bg-black/40 rounded-xl p-3">
                      <p className="text-zinc-300 text-sm leading-relaxed">{w.reason}</p>
                    </div>
                    {w.charges_added?.length > 0 && (
                      <div>
                        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Additional Charges Added</p>
                        <div className="space-y-1.5">
                          {w.charges_added.map((c, i) => (
                            <div key={i} className="flex items-start gap-2 bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">
                              <FileText className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                              <p className="text-zinc-300 text-xs">{c}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Resolved Warrants */}
            {resolved.length > 0 && (
              <div className="space-y-3">
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400" /> Resolved
                </p>
                {resolved.map((w, idx) => (
                  <motion.div key={w.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                    className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 opacity-60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-zinc-400 text-sm line-through">{w.reason}</p>
                      <span className="text-xs font-bold bg-green-900/60 text-green-400 border border-green-700/40 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">Resolved</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      <p className="text-zinc-600 text-xs">{new Date(w.issued_at).toLocaleString()}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
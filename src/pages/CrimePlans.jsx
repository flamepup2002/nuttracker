import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Skull, Loader2, ChevronRight, Flame } from 'lucide-react';
import { SEVERITY_COLOR, RISK_COLOR } from '@/lib/crimeData';

export default function CrimePlans() {
  const navigate = useNavigate();
  const [enriched, setEnriched] = useState([]);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['crimePlans'],
    queryFn: () => base44.entities.CrimePlan.list('-created_date', 50),
  });

  const items = Array.isArray(plans) ? plans : plans.items || [];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="relative border-b border-red-900/40 flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/30 via-zinc-900/10 to-transparent" />
        <div className="relative px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-700 to-zinc-900 flex items-center justify-center border border-red-500/40">
            <Skull className="w-5 h-5 text-red-300" />
          </div>
          <div>
            <p className="text-red-200 font-bold text-sm leading-tight">My Crime Plans</p>
            <p className="text-red-400/60 text-xs">Generated dossiers</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-28">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-red-400 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Flame className="w-9 h-9 text-red-500/50" />
            <p className="text-zinc-400 text-sm">No crime plans generated yet.</p>
            <button onClick={() => navigate('/Crime')} className="text-red-300 text-sm font-bold underline">
              Plan a crime
            </button>
          </div>
        ) : (
          items.map((p, idx) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => navigate(`/CrimePlan/${p.id}`)}
              className="w-full text-left p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:border-red-700/60 hover:bg-red-950/20 transition-all flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-800 to-zinc-900 flex items-center justify-center border border-red-500/30 flex-shrink-0">
                <Skull className="w-5 h-5 text-red-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-bold text-sm truncate">{p.crime_name}</p>
                  {p.severity && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${SEVERITY_COLOR[p.severity]}`}>
                      {p.severity}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {p.est_payout ? <span className="text-emerald-400 font-mono">${p.est_payout.toLocaleString()}</span> : null}
                  {p.risk && <span className={`font-bold ${RISK_COLOR[p.risk]}`}>{p.risk.toUpperCase()}</span>}
                  {p.variant && <span className="text-zinc-500 truncate">{p.variant}</span>}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 flex-shrink-0" />
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}
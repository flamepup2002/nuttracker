import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowLeft, History, TrendingDown, TrendingUp, ShieldAlert, Loader2 } from 'lucide-react';

const STATUS_STYLES = {
  pristine: { bg: 'bg-emerald-950/60', border: 'border-emerald-700/40', text: 'text-emerald-300', label: 'Pristine' },
  tarnished: { bg: 'bg-amber-950/60', border: 'border-amber-700/40', text: 'text-amber-300', label: 'Tarnished' },
  disgraced: { bg: 'bg-orange-950/60', border: 'border-orange-700/40', text: 'text-orange-300', label: 'Disgraced' },
  ruined: { bg: 'bg-red-950/60', border: 'border-red-700/40', text: 'text-red-300', label: 'Ruined' },
};

export default function ReputationLogPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState(null);
  const [currentScore, setCurrentScore] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me().catch(() => null);
      if (user) {
        setCurrentScore(user.reputation_score ?? null);
        setCurrentStatus(user.reputation_status ?? null);
      }
      const records = await base44.entities.ReputationLog.list('-changed_at', 100);
      setLogs(records);
    };
    load();
  }, []);

  const currentStyle = currentStatus ? STATUS_STYLES[currentStatus] : null;

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-800 to-zinc-900 flex items-center justify-center flex-shrink-0 border border-red-700/40">
          <History className="w-5 h-5 text-red-300" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">Reputation Log</p>
          <p className="text-zinc-500 text-xs">History of court-ordered reputation changes</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Current status card */}
        {currentStyle && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-4 ${currentStyle.bg} ${currentStyle.border}`}>
            <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Current Standing</p>
            <div className="flex items-end justify-between">
              <div>
                <p className={`text-2xl font-bold ${currentStyle.text}`}>{currentStyle.label}</p>
                <p className="text-zinc-500 text-xs mt-0.5">Score: {currentScore ?? '—'}</p>
              </div>
              <ShieldAlert className={`w-8 h-8 ${currentStyle.text}`} />
            </div>
          </motion.div>
        )}

        {/* Log timeline */}
        <div>
          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-3 px-1">Change History</p>
          {logs === null ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-3 border border-zinc-800">
                <History className="w-7 h-7 text-zinc-600" />
              </div>
              <p className="text-zinc-400 font-medium mb-1">No reputation changes recorded</p>
              <p className="text-zinc-600 text-sm">Your reputation has not been altered by the court.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log, idx) => {
                const style = STATUS_STYLES[log.new_status] || STATUS_STYLES.tarnished;
                const delta = (log.new_score ?? 0) - (log.previous_score ?? 0);
                const isDrop = delta < 0;
                return (
                  <motion.div key={log.id || idx}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`rounded-2xl border p-4 ${style.bg} ${style.border}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {isDrop ? (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        )}
                        <span className="text-zinc-300 text-sm font-medium">
                          {log.previous_score ?? '—'} → {log.new_score ?? '—'}
                        </span>
                        {delta !== 0 && (
                          <span className={`text-xs font-bold ${isDrop ? 'text-red-400' : 'text-emerald-400'}`}>
                            {isDrop ? '' : '+'}{delta}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                        {style.label}
                      </span>
                    </div>
                    {log.change_reason && (
                      <p className="text-zinc-300 text-sm mb-2">{log.change_reason}</p>
                    )}
                    {log.shame_text && (
                      <div className="rounded-lg bg-black/40 border border-zinc-800 p-3 mt-2">
                        <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Public Shame</p>
                        <p className="text-zinc-400 text-sm italic">"{log.shame_text}"</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60">
                      <span className="text-zinc-600 text-xs">By {log.changed_by || 'judge'}</span>
                      <span className="text-zinc-600 text-xs">
                        {log.changed_at ? new Date(log.changed_at).toLocaleString() : ''}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
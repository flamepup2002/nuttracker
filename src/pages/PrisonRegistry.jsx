import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, MapPin, User, ShieldAlert, ScrollText, Loader2, Lock } from 'lucide-react';

const STATUS_STYLES = {
  pristine: { bg: 'bg-emerald-950/60', border: 'border-emerald-700/40', text: 'text-emerald-300', label: 'Pristine' },
  tarnished: { bg: 'bg-amber-950/60', border: 'border-amber-700/40', text: 'text-amber-300', label: 'Tarnished' },
  disgraced: { bg: 'bg-orange-950/60', border: 'border-orange-700/40', text: 'text-orange-300', label: 'Disgraced' },
  ruined: { bg: 'bg-red-950/60', border: 'border-red-700/40', text: 'text-red-300', label: 'Ruined' },
};

export default function PrisonRegistryPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const u = await base44.auth.me().catch(() => null);
      setUser(u);
      const r = await base44.entities.CriminalRecord.list('-added_at', 50);
      setRecords(r);
      setLoading(false);
    };
    load();
  }, []);

  const hasPrison = user?.court_ordered_address;
  const status = user?.reputation_status;
  const statusStyle = status ? STATUS_STYLES[status] : null;

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-900 flex items-center justify-center flex-shrink-0 border border-zinc-500/40">
          <Building2 className="w-5 h-5 text-zinc-300" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">Prison Registry</p>
          <p className="text-zinc-500 text-xs">Assigned facility & legal residency status</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
          </div>
        ) : !hasPrison ? (
          <div className="text-center py-12 px-6">
            <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-3 border border-zinc-800">
              <Building2 className="w-7 h-7 text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-medium mb-1">No prison assignment</p>
            <p className="text-zinc-600 text-sm">The court has not ordered you to a correctional facility.</p>
          </div>
        ) : (
          <>
            {/* Prison assignment card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-zinc-700 bg-gradient-to-br from-zinc-900 to-black p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-red-400" />
                <p className="text-red-400 text-xs uppercase tracking-wide font-semibold">Court-Ordered Residence</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-700">
                  <Building2 className="w-6 h-6 text-zinc-400" />
                </div>
                <div className="flex-1">
                  <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Facility Address</p>
                  <p className="text-zinc-100 text-sm whitespace-pre-line leading-relaxed">{user.court_ordered_address}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-zinc-600 text-xs">This address is locked by court order and cannot be changed.</span>
              </div>
            </motion.div>

            {/* Legal identity */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
              <p className="text-zinc-400 text-xs uppercase tracking-wide">Legal Identity</p>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-zinc-500" />
                <div>
                  <p className="text-zinc-500 text-xs">Court-Ordered Name</p>
                  <p className="text-zinc-100 text-sm font-medium">{user.court_ordered_name || 'Not assigned'}</p>
                </div>
              </div>
              {user.profile_title && (
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 text-zinc-500" />
                  <div>
                    <p className="text-zinc-500 text-xs">Profile Title</p>
                    <p className="text-zinc-100 text-sm font-medium">{user.profile_title}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Reputation status */}
            {statusStyle && (
              <div className={`rounded-2xl border p-4 ${statusStyle.bg} ${statusStyle.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-zinc-400 text-xs uppercase tracking-wide">Reputation Status</p>
                  <span className={`text-sm font-bold ${statusStyle.text}`}>{statusStyle.label}</span>
                </div>
                <p className="text-zinc-400 text-sm">Score: <span className={`font-bold ${statusStyle.text}`}>{user.reputation_score ?? '—'}</span></p>
                {user.reputation_ruined_at && (
                  <p className="text-zinc-600 text-xs mt-1">
                    Since {new Date(user.reputation_ruined_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Public shame */}
            {user.reputation_shame && (
              <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-4">
                <p className="text-red-400 text-xs uppercase tracking-wide mb-2">Public Shame Record</p>
                <p className="text-zinc-300 text-sm italic leading-relaxed">"{user.reputation_shame}"</p>
              </div>
            )}

            {/* Criminal records context */}
            {records && records.length > 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ScrollText className="w-4 h-4 text-red-400" />
                  <p className="text-zinc-400 text-xs uppercase tracking-wide">Convictions on Record</p>
                </div>
                <div className="space-y-2">
                  {records.slice(0, 5).map((r, i) => (
                    <div key={r.id || i} className="flex items-start gap-2">
                      <span className="text-red-400 text-xs mt-0.5">•</span>
                      <div className="flex-1">
                        <p className="text-zinc-200 text-sm">{r.charge}</p>
                        {r.code_reference && <p className="text-zinc-600 text-xs">{r.code_reference}</p>}
                      </div>
                    </div>
                  ))}
                  {records.length > 5 && (
                    <p className="text-zinc-600 text-xs pt-1">+{records.length - 5} more...</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
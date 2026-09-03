import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowLeft, LayoutDashboard, FileText, Lock, ListChecks, AlertTriangle, ScrollText, Loader2 } from 'lucide-react';

export default function WardenDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [contracts, sessions, tasks, warrants, records] = await Promise.all([
        base44.entities.DebtContract.list('-created_date', 100),
        base44.entities.Session.list('-start_time', 50),
        base44.entities.BullyTask.list('-assigned_at', 50),
        base44.entities.ArrestWarrant.list('-issued_at', 50),
        base44.entities.CriminalRecord.list('-added_at', 50),
      ]);
      setData({ contracts, sessions, tasks, warrants, records });
    };
    load();
  }, []);

  const activeContracts = data?.contracts.filter(c => c.cancel_status !== 'cancelled' && !c.criminal_charges_dismissed) || [];
  const jailSessions = data?.sessions.filter(s => s.is_horny_jail && s.status === 'active') || [];
  const pendingTasks = data?.tasks.filter(t => t.status === 'pending' || t.status === 'submitted') || [];
  const activeWarrants = data?.warrants.filter(w => w.status === 'active') || [];
  const totalDebt = activeContracts.reduce((sum, c) => sum + ((c.total_obligation || 0) - (c.amount_paid || 0)), 0);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-800 to-slate-900 flex items-center justify-center flex-shrink-0 border border-purple-700/40">
          <LayoutDashboard className="w-5 h-5 text-purple-300" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">Warden Dashboard</p>
          <p className="text-zinc-500 text-xs">Active monitoring & enforcement overview</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">
        {data === null ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard icon={FileText} label="Active Contracts" value={activeContracts.length} color="amber" onClick={() => navigate('/MyContracts')} />
              <SummaryCard icon={Lock} label="Jail Sessions" value={jailSessions.length} color="purple" onClick={() => navigate('/HornyJail')} />
              <SummaryCard icon={ListChecks} label="Pending Tasks" value={pendingTasks.length} color="blue" onClick={() => navigate('/MyTasks')} />
              <SummaryCard icon={AlertTriangle} label="Active Warrants" value={activeWarrants.length} color="red" onClick={() => navigate('/ArrestWarrants')} />
            </div>

            {/* Total debt */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-amber-800/40 bg-gradient-to-br from-amber-950/40 to-zinc-900 p-4">
              <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Outstanding Debt</p>
              <p className="text-3xl font-bold text-amber-300">${totalDebt.toLocaleString()}</p>
              <p className="text-zinc-500 text-xs mt-1">Across {activeContracts.length} active contract{activeContracts.length !== 1 ? 's' : ''}</p>
            </motion.div>

            {/* Jail time remaining */}
            {jailSessions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <p className="text-zinc-400 text-xs uppercase tracking-wide">Active Jail Time</p>
                </div>
                <div className="space-y-2">
                  {jailSessions.map((s, i) => (
                    <div key={s.id || i} className="rounded-xl border border-purple-800/40 bg-purple-950/30 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {s.horny_jail_permanent_lock ? 'Permanent Lock' : `${s.horny_jail_minutes || 0} min sentence`}
                          </p>
                          <p className="text-zinc-500 text-xs mt-0.5">
                            Extensions: {s.horny_jail_extensions || 0}
                          </p>
                        </div>
                        {s.horny_jail_permanent_lock && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-950 border border-red-800/50 text-red-300">PERMANENT</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active contracts list */}
            {activeContracts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <p className="text-zinc-400 text-xs uppercase tracking-wide">Active Debt Contracts</p>
                </div>
                <div className="space-y-2">
                  {activeContracts.slice(0, 5).map((c, i) => (
                    <div key={c.id || i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{c.title}</p>
                        <span className="text-amber-300 text-sm font-semibold">${(c.monthly_payment || 0).toLocaleString()}/mo</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${c.intensity_level === 'extreme' ? 'bg-red-950 text-red-300' : 'bg-zinc-800 text-zinc-400'}`}>
                          {c.intensity_level}
                        </span>
                        <span className="text-zinc-600 text-xs">Paid: ${(c.amount_paid || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Criminal records */}
            {data.records.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <ScrollText className="w-4 h-4 text-red-400" />
                  <p className="text-zinc-400 text-xs uppercase tracking-wide">Criminal Records on File</p>
                </div>
                <p className="text-zinc-500 text-sm">{data.records.length} record{data.records.length !== 1 ? 's' : ''}</p>
              </div>
            )}

            {activeContracts.length === 0 && jailSessions.length === 0 && pendingTasks.length === 0 && activeWarrants.length === 0 && data.records.length === 0 && (
              <div className="text-center py-12 px-6">
                <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-3 border border-zinc-800">
                  <LayoutDashboard className="w-7 h-7 text-zinc-600" />
                </div>
                <p className="text-zinc-400 font-medium mb-1">All clear</p>
                <p className="text-zinc-600 text-sm">No active monitoring tasks or enforcement actions.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color, onClick }) {
  const colors = {
    amber: 'border-amber-800/40 bg-amber-950/30 text-amber-300',
    purple: 'border-purple-800/40 bg-purple-950/30 text-purple-300',
    blue: 'border-blue-800/40 bg-blue-950/30 text-blue-300',
    red: 'border-red-800/40 bg-red-950/30 text-red-300',
  };
  return (
    <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left ${colors[color]}`}>
      <Icon className="w-5 h-5 mb-2" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-zinc-500 text-xs">{label}</p>
    </motion.button>
  );
}
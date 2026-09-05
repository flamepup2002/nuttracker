import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Dog, Bot, Siren, Shield, ScrollText, Activity } from 'lucide-react';

const AGENT_CONFIG = {
  puppy_checker: { icon: Dog, color: 'text-amber-400', bg: 'bg-amber-950/40', label: 'Puppy Checker' },
  warden: { icon: Bot, color: 'text-purple-400', bg: 'bg-purple-950/40', label: 'Warden' },
  police_officer: { icon: Siren, color: 'text-blue-400', bg: 'bg-blue-950/40', label: 'Police Officer' },
  police: { icon: Siren, color: 'text-blue-400', bg: 'bg-blue-950/40', label: 'Police' },
  debt_enforcer: { icon: Shield, color: 'text-red-400', bg: 'bg-red-950/40', label: 'Debt Enforcer' },
  boner_checker: { icon: Activity, color: 'text-pink-400', bg: 'bg-pink-950/40', label: 'Boner Checker' },
  judge: { icon: ScrollText, color: 'text-amber-400', bg: 'bg-amber-950/40', label: 'Judge' },
  system: { icon: Activity, color: 'text-zinc-400', bg: 'bg-zinc-900', label: 'System' },
};

export default function EnforcementLogs() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['enforcementLogs'],
    queryFn: () => base44.entities.SystemLog.filter({ agent_name: { $in: ['puppy_checker', 'warden', 'police_officer', 'police', 'debt_enforcer', 'boner_checker'] } }, '-logged_at', 200),
  });

  const agentGroups = ['puppy_checker', 'warden', 'police_officer', 'debt_enforcer', 'boner_checker'].map(name => ({
    name,
    config: AGENT_CONFIG[name],
    count: logs.filter(l => l.agent_name === name).length,
  }));

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-red-400" />
          Enforcement Logs
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {agentGroups.map(g => (
            <div key={g.name} className={`${g.config.bg} rounded-xl border border-zinc-800 p-4 text-center`}>
              <g.config.icon className={`w-6 h-6 ${g.config.color} mx-auto mb-1`} />
              <p className="text-white text-sm font-bold">{g.config.label}</p>
              <p className="text-zinc-400 text-xs">{g.count} action{g.count !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <h3 className="text-white font-bold mb-3">Detailed Action Log</h3>
          <p className="text-zinc-400 text-sm mb-4">Every action by Puppy Checker, Warden, and Police agents for transparency.</p>

          {isLoading && <p className="text-zinc-500 text-center py-4">Loading...</p>}
          {!isLoading && logs.length === 0 && (
            <div className="text-center py-8">
              <ScrollText className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500">No enforcement actions logged yet</p>
            </div>
          )}

          <div className="space-y-2">
            {logs.map((log, i) => {
              const cfg = AGENT_CONFIG[log.agent_name] || AGENT_CONFIG.system;
              return (
                <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} className="flex items-start gap-3 bg-zinc-800/50 rounded-lg p-3">
                  <div className={`w-9 h-9 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-bold">{cfg.label}</span>
                      <span className="text-zinc-500 text-xs">· {log.action_type}</span>
                    </div>
                    <p className="text-zinc-300 text-sm mt-0.5">{log.description}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{new Date(log.logged_at).toLocaleString()}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ScrollText, Gavel, Siren, Shield, Dog, Scan, Bot } from 'lucide-react';

const AGENT_ICONS = { judge: Gavel, police: Siren, police_officer: Siren, debt_enforcer: Shield, puppy_checker: Dog, boner_checker: Scan, warden: Bot, system: ScrollText };
const SEVERITY_COLORS = { info: 'text-blue-400', warning: 'text-yellow-400', critical: 'text-red-400' };

export default function SystemLogs() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['systemLogs'],
    queryFn: () => base44.entities.SystemLog.list('-logged_at', 200),
  });

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-zinc-400" />
          System Logs
        </h1>
      </div>

      <div className="px-6 mt-6">
        <p className="text-zinc-400 text-sm mb-4">Chronological audit trail of all actions performed by enforcement agents and the Judge AI.</p>

        {isLoading && <div className="text-center py-8 text-zinc-500">Loading logs...</div>}

        {!isLoading && logs.length === 0 && (
          <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <ScrollText className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">No system actions logged yet</p>
          </div>
        )}

        <div className="space-y-2">
          {logs.map((log, i) => {
            const Icon = AGENT_ICONS[log.agent_name] || ScrollText;
            return (
              <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-sm uppercase">{log.agent_name}</span>
                    <span className={`text-xs font-bold uppercase ${SEVERITY_COLORS[log.severity] || 'text-zinc-400'}`}>{log.severity}</span>
                  </div>
                  <p className="text-zinc-300 text-sm">{log.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-zinc-500 text-xs">{log.action_type}</span>
                    {log.target_entity && <span className="text-zinc-600 text-xs">→ {log.target_entity}</span>}
                    <span className="text-zinc-600 text-xs">{new Date(log.logged_at).toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
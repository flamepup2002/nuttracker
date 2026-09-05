import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Siren, Shield, Gavel, Dog, Bot, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const OFFICERS = [
  { id: 'police_officer', name: 'Officer Slater', role: 'Police Interrogation', icon: Siren, color: 'from-blue-800 to-slate-900', border: 'border-blue-600/40', desc: 'Interrogation & dispatch filing' },
  { id: 'warden', name: 'The Warden', role: 'Corrections Officer', icon: Bot, color: 'from-purple-800 to-slate-900', border: 'border-purple-600/40', desc: 'Sentence & facility management' },
  { id: 'judge', name: 'The Judge', role: 'Magistrate', icon: Gavel, color: 'from-amber-800 to-yellow-900', border: 'border-amber-600/40', desc: 'Rulings & sentencing' },
  { id: 'debt_enforcer', name: 'Debt Enforcer', role: 'Contract Monitor', icon: Shield, color: 'from-red-800 to-red-950', border: 'border-red-600/40', desc: 'Contract enforcement & penalties' },
  { id: 'puppy_checker', name: 'Puppy Checker', role: 'Compliance Agent', icon: Dog, color: 'from-amber-700 to-orange-800', border: 'border-amber-500/40', desc: 'Pup hood verification' },
];

export default function OfficerDispatch() {
  const queryClient = useQueryClient();
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [query, setQuery] = useState('');

  const { data: logs = [] } = useQuery({ queryKey: ['dispatchLogs'], queryFn: () => base44.entities.SystemLog.filter({ action_type: 'dispatch_request' }, '-logged_at', 20) });

  const dispatchMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.SystemLog.create({
        agent_name: selectedOfficer.id,
        action_type: 'dispatch_request',
        description: `User requested ${selectedOfficer.name} for: ${query}`,
        severity: 'info',
        logged_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success(`${selectedOfficer.name} has been dispatched to your session`);
      queryClient.invalidateQueries({ queryKey: ['dispatchLogs'] });
      setQuery('');
    },
    onError: () => toast.error('Dispatch request failed'),
  });

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Siren className="w-5 h-5 text-red-400" />
          Officer Dispatch
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        <p className="text-zinc-400 text-sm">Request a specific enforcement officer agent to handle your current session or debt query.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {OFFICERS.map(o => (
            <motion.button
              key={o.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedOfficer(o)}
              className={`text-left rounded-2xl border-2 p-5 transition-all ${selectedOfficer?.id === o.id ? `${o.border} bg-gradient-to-br ${o.color}` : 'border-zinc-800 bg-zinc-900/50'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${o.color} flex items-center justify-center border ${o.border}`}>
                  <o.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold">{o.name}</p>
                  <p className="text-zinc-400 text-xs">{o.role}</p>
                </div>
              </div>
              <p className="text-zinc-300 text-sm mt-2">{o.desc}</p>
            </motion.button>
          ))}
        </div>

        {selectedOfficer && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-3">
            <h3 className="text-white font-bold">Dispatch {selectedOfficer.name}</h3>
            <Label className="text-zinc-400 text-sm">Describe your situation or query</Label>
            <Textarea value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What do you need help with?" className="bg-zinc-800 border-zinc-700 h-24" />
            <div className="flex gap-2">
              <Button onClick={() => dispatchMutation.mutate()} disabled={!query.trim() || dispatchMutation.isPending} className="bg-red-600 hover:bg-red-700">
                <Send className="w-4 h-4 mr-2" /> Dispatch {selectedOfficer.name}
              </Button>
              <Link to={selectedOfficer.id === 'judge' ? '/JudgeChat' : selectedOfficer.id === 'police_officer' ? '/PoliceOfficerChat' : selectedOfficer.id === 'warden' ? '/WardenMessaging' : selectedOfficer.id === 'puppy_checker' ? '/PuppyChecker' : selectedOfficer.id === 'debt_enforcer' ? '/DebtEnforcer' : '#'}>
                <Button variant="outline" className="border-zinc-700">Open Chat →</Button>
              </Link>
            </div>
          </motion.div>
        )}

        {logs.length > 0 && (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
            <h3 className="text-white font-bold mb-3">Recent Dispatch Requests</h3>
            <div className="space-y-2">
              {logs.map((l) => (
                <div key={l.id} className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-white text-sm">{l.description}</p>
                  <p className="text-zinc-500 text-xs">{new Date(l.logged_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
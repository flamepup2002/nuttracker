import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Shield, Lock, Unlock, Building2, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProfileSecurity() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['secUser'], queryFn: () => base44.auth.me() });
  const { data: warrants = [] } = useQuery({ queryKey: ['secWarrants'], queryFn: () => base44.entities.ArrestWarrant.filter({ status: 'active' }) });
  const { data: records = [] } = useQuery({ queryKey: ['secRecords'], queryFn: () => base44.entities.CriminalRecord.list() });

  const resetMutation = useMutation({
    mutationFn: async () => {
      return base44.auth.updateMe({
        court_ordered_name: null,
        court_ordered_address: null,
        reputation_score: 100,
        reputation_status: 'pristine',
        reputation_shame: null,
        reputation_ruined_at: null,
        profile_title: null,
      });
    },
    onSuccess: () => {
      toast.success('Security preferences reset');
      queryClient.invalidateQueries({ queryKey: ['secUser'] });
    },
    onError: () => toast.error('Reset failed'),
  });

  const locks = [
    { label: 'Court-Ordered Name Lock', active: !!user?.court_ordered_name, detail: user?.court_ordered_name || 'Not locked' },
    { label: 'Court-Ordered Address Lock', active: !!user?.court_ordered_address, detail: user?.court_ordered_address ? 'Remanded to facility' : 'Not locked' },
    { label: 'Reputation Penalty', active: user?.reputation_status && user.reputation_status !== 'pristine', detail: user?.reputation_status || 'Pristine' },
    { label: 'Active Arrest Warrants', active: warrants.length > 0, detail: `${warrants.length} warrant${warrants.length !== 1 ? 's' : ''}` },
    { label: 'Criminal Record', active: records.length > 0, detail: `${records.length} charge${records.length !== 1 ? 's' : ''}` },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          Profile Security
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        {user?.court_ordered_address && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-950/30 border border-red-700/40 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-red-400" />
              <p className="text-red-400 font-bold">Prison Status: INCARCERATED</p>
            </div>
            <p className="text-zinc-300 text-sm whitespace-pre-line">{user.court_ordered_address}</p>
          </motion.div>
        )}

        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Lock className="w-5 h-5" /> Active System Locks</h3>
          <div className="space-y-3">
            {locks.map((lock, i) => (
              <div key={i} className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  {lock.active ? <Lock className="w-4 h-4 text-red-400" /> : <Unlock className="w-4 h-4 text-green-400" />}
                  <div>
                    <p className="text-white text-sm">{lock.label}</p>
                    <p className="text-zinc-500 text-xs">{lock.detail}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold uppercase ${lock.active ? 'text-red-400' : 'text-green-400'}`}>
                  {lock.active ? 'Locked' : 'Clear'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-950/20 border border-amber-700/30 rounded-2xl p-5">
          <h3 className="text-amber-400 font-bold mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Reset Security Preferences</h3>
          <p className="text-zinc-400 text-sm mb-4">
            This will clear your court-ordered name, court-ordered address, reputation penalties, and profile title.
            Criminal records and arrest warrants are not affected — those require court action.
          </p>
          <Button variant="outline" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending} className="border-amber-700 text-amber-400 hover:bg-amber-900/30">
            <RotateCcw className="w-4 h-4 mr-2" /> {resetMutation.isPending ? 'Resetting...' : 'Reset Security Preferences'}
          </Button>
        </div>

        <div className="bg-green-950/20 border border-green-700/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-400 font-bold">Security Status</p>
          </div>
          <p className="text-zinc-400 text-sm">
            {locks.every(l => !l.active)
              ? 'Your profile is clear of all system locks. You are in full compliance.'
              : `${locks.filter(l => l.active).length} active lock(s) on your profile. Contact the court or file an appeal to resolve.`}
          </p>
        </div>
      </div>
    </div>
  );
}
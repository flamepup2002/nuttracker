import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Shield, DollarSign, Unlock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function BailBonds() {
  const queryClient = useQueryClient();
  const [bailAmount, setBailAmount] = useState('');

  const { data: warrants = [], isLoading } = useQuery({
    queryKey: ['bailWarrants'],
    queryFn: () => base44.entities.ArrestWarrant.filter({ status: 'active' }, '-issued_at', 50),
  });

  const { data: user } = useQuery({ queryKey: ['bailUser'], queryFn: () => base44.auth.me() });

  const postBailMutation = useMutation({
    mutationFn: async ({ warrant, amount }) => {
      await base44.entities.Payment.create({ amount: Number(amount), status: 'succeeded', description: `Bail payment for warrant ${warrant.id}` });
      return base44.entities.ArrestWarrant.update(warrant.id, { status: 'resolved', resolved_at: new Date().toISOString() });
    },
    onSuccess: () => {
      toast.success('Bail posted — warrant resolved!');
      setBailAmount('');
      queryClient.invalidateQueries({ queryKey: ['bailWarrants'] });
    },
    onError: () => toast.error('Failed to post bail'),
  });

  const totalBail = warrants.length * 5000;

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          Bail Bonds Office
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        <div className="bg-gradient-to-br from-blue-900/30 to-slate-900/30 border border-blue-700/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-400" />
            <p className="text-blue-400 font-bold">Total Bail Outstanding</p>
          </div>
          <p className="text-white font-bold text-3xl">${totalBail.toFixed(0)}</p>
          <p className="text-zinc-400 text-sm mt-1">{warrants.length} active warrant{warrants.length !== 1 ? 's' : ''}</p>
        </div>

        {warrants.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <Unlock className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-green-400 font-bold">You are free on your own recognizance</p>
            <p className="text-zinc-500 text-sm mt-1">No active warrants requiring bail.</p>
          </div>
        )}

        {warrants.map((w, i) => (
          <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
            <div className="flex items-start gap-3 mb-3">
              <Lock className="w-5 h-5 text-red-400 mt-1" />
              <div className="flex-1">
                <p className="text-white font-bold">Warrant Active</p>
                <p className="text-zinc-400 text-sm">{w.reason}</p>
                <p className="text-zinc-500 text-xs mt-1">Issued: {new Date(w.issued_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg p-3 mb-3">
              <p className="text-zinc-400 text-xs">Bail Terms</p>
              <p className="text-blue-300 text-sm mt-1">Post $5,000 bail to secure release. Failure to appear will result in immediate incarceration and forfeiture of bail.</p>
            </div>
            <div className="flex gap-2">
              <Input type="number" value={bailAmount} onChange={(e) => setBailAmount(e.target.value)} placeholder="Bail amount $" className="bg-zinc-800 border-zinc-700" />
              <Button onClick={() => postBailMutation.mutate({ warrant: w, amount: 5000 })} disabled={postBailMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                Post Bail
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
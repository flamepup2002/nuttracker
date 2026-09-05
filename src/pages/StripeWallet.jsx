import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Wallet, Coins, TrendingUp, TrendingDown, ArrowRightLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function StripeWallet() {
  const queryClient = useQueryClient();
  const [convertAmount, setConvertAmount] = useState('');
  const [user, setUser] = useState(null);

  useQuery({ queryKey: ['walletUser'], queryFn: async () => { const me = await base44.auth.me(); setUser(me); return me; } });

  const { data: payments = [] } = useQuery({ queryKey: ['walletPayments'], queryFn: () => base44.entities.Payment.list('-created_date', 100) });
  const { data: contracts = [] } = useQuery({ queryKey: ['walletContracts'], queryFn: () => base44.entities.DebtContract.filter({ is_accepted: true, cancel_status: 'active' }) });

  const totalEarned = payments.filter(p => p.status === 'succeeded').reduce((s, p) => s + (p.amount || 0), 0);
  const totalDebtPaid = contracts.reduce((s, c) => s + (c.amount_paid || 0), 0);
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const kinkcoins = user?.currency_balance || 0;
  const activeDebt = contracts.reduce((s, c) => {
    const total = c.total_obligation || (c.monthly_payment || 0) * (c.duration_months || 0);
    return s + (total - (c.amount_paid || 0));
  }, 0);

  const convertMutation = useMutation({
    mutationFn: async ({ coins, contractId }) => {
      const coinsNum = Number(coins);
      const usdValue = coinsNum / 100; // 100 kinkcoins = $1
      const me = await base44.auth.me();
      const newBalance = (me.currency_balance || 0) - coinsNum;
      await base44.auth.updateMe({ currency_balance: newBalance });
      if (contractId) {
        const contract = contracts.find(c => c.id === contractId);
        const newPaid = (contract.amount_paid || 0) + usdValue;
        await base44.entities.DebtContract.update(contractId, { amount_paid: newPaid });
      }
      return { usdValue, newBalance };
    },
    onSuccess: (data) => {
      toast.success(`Converted ${convertAmount} kinkcoins → $${data.usdValue.toFixed(2)} applied to debt!`);
      setConvertAmount('');
      setUser(prev => ({ ...prev, currency_balance: data.newBalance }));
      queryClient.invalidateQueries({ queryKey: ['walletUser'] });
      queryClient.invalidateQueries({ queryKey: ['walletContracts'] });
    },
    onError: () => toast.error('Conversion failed'),
  });

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="w-5 h-5 text-green-400" />
          Stripe Wallet
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-orange-900/30 to-amber-900/30 border border-orange-600/30 rounded-2xl p-5">
            <Coins className="w-6 h-6 text-orange-400 mb-2" />
            <p className="text-zinc-400 text-xs">Kinkcoin Balance</p>
            <p className="text-orange-400 font-bold text-2xl">{kinkcoins}</p>
          </div>
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-600/30 rounded-2xl p-5">
            <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-zinc-400 text-xs">Total Earned</p>
            <p className="text-green-400 font-bold text-2xl">${totalEarned.toFixed(0)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-600/30 rounded-2xl p-5">
            <TrendingDown className="w-6 h-6 text-blue-400 mb-2" />
            <p className="text-zinc-400 text-xs">Debt Paid</p>
            <p className="text-blue-400 font-bold text-2xl">${totalDebtPaid.toFixed(0)}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-600/30 rounded-2xl p-5">
            <Clock className="w-6 h-6 text-yellow-400 mb-2" />
            <p className="text-zinc-400 text-xs">Pending Transactions</p>
            <p className="text-yellow-400 font-bold text-2xl">{pendingPayments}</p>
          </div>
        </div>

        {/* Kinkcoin → Debt Conversion */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500/30 rounded-2xl p-6">
          <h3 className="text-white font-bold flex items-center gap-2 mb-2">
            <ArrowRightLeft className="w-5 h-5 text-purple-400" />
            Convert Kinkcoins to Debt Repayment
          </h3>
          <p className="text-zinc-400 text-sm mb-4">Convert your kinkcoins at 100:1 ratio to pay down active debts.</p>

          {activeDebt > 0 ? (
            <>
              <div className="bg-purple-950/30 rounded-lg p-3 mb-3">
                <p className="text-zinc-400 text-xs">Active Debt Remaining</p>
                <p className="text-red-400 font-bold text-xl">${activeDebt.toFixed(2)}</p>
              </div>
              <Label className="text-zinc-400 text-sm">Kinkcoins to Convert</Label>
              <div className="flex gap-2 mt-1">
                <Input type="number" value={convertAmount} onChange={(e) => setConvertAmount(e.target.value)} placeholder="e.g. 1000" className="bg-zinc-800 border-zinc-700" />
                <Button variant="outline" onClick={() => setConvertAmount(String(kinkcoins))} className="border-purple-600 text-purple-400">Max</Button>
              </div>
              {convertAmount && (
                <p className="text-zinc-400 text-sm mt-2">
                  = <span className="text-green-400 font-bold">${(Number(convertAmount) / 100).toFixed(2)}</span> applied to debt
                </p>
              )}
              <div className="mt-3 space-y-2">
                {contracts.filter(c => {
                  const total = c.total_obligation || (c.monthly_payment || 0) * (c.duration_months || 0);
                  return total - (c.amount_paid || 0) > 0;
                }).map(c => (
                  <Button key={c.id} variant="outline" disabled={!convertAmount || Number(convertAmount) > kinkcoins || convertMutation.isPending} onClick={() => convertMutation.mutate({ coins: convertAmount, contractId: c.id })} className="w-full justify-start border-zinc-700 text-left">
                    Apply to: {c.title}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-green-400 text-center py-4">No active debts to repay — you're all caught up!</p>
          )}
        </motion.div>

        {/* Recent Transactions */}
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <h3 className="text-white font-bold mb-3">Recent Transactions</h3>
          {payments.length === 0 && <p className="text-zinc-500 text-center py-4">No transactions yet</p>}
          <div className="space-y-2">
            {payments.slice(0, 10).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3">
                <div>
                  <p className="text-white text-sm">{p.description || 'Payment'}</p>
                  <p className="text-zinc-500 text-xs">{new Date(p.created_date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${p.status === 'succeeded' ? 'text-green-400' : 'text-yellow-400'}`}>${(p.amount || 0).toFixed(0)}</p>
                  <p className="text-zinc-500 text-xs uppercase">{p.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
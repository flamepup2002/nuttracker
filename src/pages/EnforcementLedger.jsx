import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';

export default function EnforcementLedger() {
  const { data: payments = [] } = useQuery({ queryKey: ['ledgerPayments'], queryFn: () => base44.entities.Payment.list('-created_date', 100) });
  const { data: failedPayments = [] } = useQuery({ queryKey: ['ledgerFailed'], queryFn: () => base44.entities.FailedPayment.list('-created_date', 50) });
  const { data: contracts = [] } = useQuery({ queryKey: ['ledgerContracts'], queryFn: () => base44.entities.DebtContract.filter({ is_accepted: true }, '-created_date', 50) });

  const entries = [
    ...payments.map(p => ({ id: p.id, type: 'payment', amount: p.amount, status: p.status, date: p.created_date, desc: p.description || 'Debt payment' })),
    ...failedPayments.map(f => ({ id: f.id, type: 'penalty', amount: f.penalty_amount || f.amount, status: 'failed', date: f.created_date, desc: f.reason || 'Failed payment penalty' })),
    ...contracts.filter(c => c.dispute_rejected_penalty > 0).map(c => ({ id: c.id, type: 'fine', amount: c.dispute_rejected_penalty, status: 'applied', date: c.disputed_at, desc: `Dispute rejected: ${c.title}` })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalFines = entries.filter(e => e.type !== 'payment').reduce((s, e) => s + (e.amount || 0), 0);
  const totalPaid = entries.filter(e => e.type === 'payment' && e.status === 'succeeded').reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          Enforcement Ledger
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-900/30 border border-red-700/30 rounded-2xl p-5">
            <AlertTriangle className="w-6 h-6 text-red-400 mb-2" />
            <p className="text-zinc-400 text-xs">Total Fines & Penalties</p>
            <p className="text-red-400 font-bold text-2xl">${totalFines.toFixed(0)}</p>
          </div>
          <div className="bg-green-900/30 border border-green-700/30 rounded-2xl p-5">
            <CheckCircle className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-zinc-400 text-xs">Total Settled</p>
            <p className="text-green-400 font-bold text-2xl">${totalPaid.toFixed(0)}</p>
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <h3 className="text-white font-bold mb-4">Transaction History</h3>
          {entries.length === 0 && <p className="text-zinc-500 text-center py-8">No enforcement transactions yet</p>}
          <div className="space-y-2">
            {entries.map((e, i) => (
              <motion.div key={`${e.type}-${e.id}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${e.type === 'payment' ? 'bg-green-900' : e.type === 'penalty' ? 'bg-red-900' : 'bg-orange-900'}`}>
                    <DollarSign className={`w-4 h-4 ${e.type === 'payment' ? 'text-green-400' : e.type === 'penalty' ? 'text-red-400' : 'text-orange-400'}`} />
                  </div>
                  <div>
                    <p className="text-white text-sm">{e.desc}</p>
                    <p className="text-zinc-500 text-xs">{new Date(e.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${e.type === 'payment' ? 'text-green-400' : 'text-red-400'}`}>${(e.amount || 0).toFixed(0)}</p>
                  <p className="text-zinc-500 text-xs uppercase">{e.status}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Ban, AlertTriangle, FileText, DollarSign } from 'lucide-react';

export default function Penalties() {
  const navigate = useNavigate();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['myContracts'],
    queryFn: () => base44.entities.DebtContract.filter({ is_accepted: true }, '-created_date'),
  });

  const contractsWithPenalties = contracts.filter(c => c.cancellation_penalty_triggered);
  const overdueContracts = contracts.filter(c => c.next_payment_due && new Date(c.next_payment_due) < new Date() && c.penalty_percentage);
  const totalCancellationPenalties = contracts.reduce((sum, c) => sum + (c.cancellation_penalty_amount || 0), 0);
  const totalOverduePenalties = overdueContracts.reduce((sum, c) => sum + ((c.monthly_payment || 0) * ((c.penalty_percentage || 0) / 100)), 0);
  const grandTotal = totalCancellationPenalties + totalOverduePenalties;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('MyContracts'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-500" />
            Penalties
          </h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="px-6 pb-24 pt-6 space-y-6">
        {isLoading ? (
          <div className="text-center py-16 text-zinc-500">Loading...</div>
        ) : grandTotal === 0 && overdueContracts.length === 0 && contractsWithPenalties.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center"
          >
            <Ban className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No Penalties</p>
            <p className="text-zinc-600 text-sm">You have no outstanding penalties. Keep it up!</p>
          </motion.div>
        ) : (
          <>
            {/* Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-red-950/40 border-2 border-red-500/60 rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h2 className="text-red-300 font-bold text-lg">Total Penalties Owed</h2>
              </div>
              <p className="text-5xl font-bold text-red-300 mb-1">${grandTotal.toFixed(2)}</p>
              <p className="text-red-500 text-sm">Across all outstanding obligations</p>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="bg-black/30 rounded-xl p-4">
                  <DollarSign className="w-5 h-5 text-red-400 mb-2" />
                  <p className="text-red-300 font-bold text-xl">${totalCancellationPenalties.toFixed(2)}</p>
                  <p className="text-zinc-500 text-xs">Cancellation Penalties</p>
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <AlertTriangle className="w-5 h-5 text-orange-400 mb-2" />
                  <p className="text-orange-300 font-bold text-xl">${totalOverduePenalties.toFixed(2)}</p>
                  <p className="text-zinc-500 text-xs">Overdue Late Fees</p>
                </div>
              </div>
            </motion.div>

            {/* Cancellation Penalties */}
            {contractsWithPenalties.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="space-y-3"
              >
                <h3 className="text-zinc-400 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                  <Ban className="w-4 h-4 text-red-400" /> Cancellation Attempt Penalties
                </h3>
                {contractsWithPenalties.map((c, idx) => (
                  <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                    className="bg-zinc-900 border border-red-800/40 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <div>
                        <p className="text-white font-semibold text-sm">{c.title}</p>
                        <p className="text-zinc-500 text-xs">You waived cancellation rights — 3-month penalty applied</p>
                      </div>
                    </div>
                    <span className="text-red-300 font-bold text-lg flex-shrink-0">+${(c.cancellation_penalty_amount || 0).toFixed(2)}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Overdue Late Fees */}
            {overdueContracts.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="space-y-3"
              >
                <h3 className="text-zinc-400 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" /> Overdue Late Fees
                </h3>
                {overdueContracts.map((c, idx) => {
                  const penaltyAmt = (c.monthly_payment || 0) * ((c.penalty_percentage || 0) / 100);
                  const daysOverdue = Math.floor((new Date() - new Date(c.next_payment_due)) / (1000 * 60 * 60 * 24));
                  return (
                    <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                      className="bg-zinc-900 border border-orange-800/40 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                        <div>
                          <p className="text-white font-semibold text-sm">{c.title}</p>
                          <p className="text-zinc-500 text-xs">{daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue · {c.penalty_percentage}% late fee</p>
                        </div>
                      </div>
                      <span className="text-orange-300 font-bold text-lg flex-shrink-0">+${penaltyAmt.toFixed(2)}</span>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
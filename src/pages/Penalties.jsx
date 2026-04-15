import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Ban, AlertTriangle, FileText, DollarSign, Shield, Gavel } from 'lucide-react';

function hasPrisonTerms(contract) {
  const prisonKeywords = ['prison', 'jail', 'arrest', 'warrant', 'felony', 'federal', 'incarcerat', 'sentence', 'fugitive', 'criminal', 'probation', 'bail', 'custody', 'prosecution', 'fbi', 'interpol'];
  const text = ((contract.title || '') + ' ' + (contract.description || '') + ' ' + (contract.terms || []).join(' ')).toLowerCase();
  return prisonKeywords.some(kw => text.includes(kw));
}

function extractPrisonCharges(contract) {
  const prisonKeywords = ['prison', 'jail', 'arrest', 'warrant', 'felony', 'federal', 'incarcerat', 'sentence', 'fugitive', 'criminal', 'probation', 'bail', 'custody', 'prosecution', 'fbi', 'interpol', 'court'];
  return (contract.terms || []).filter(t => prisonKeywords.some(kw => t.toLowerCase().includes(kw)));
}

export default function Penalties() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('money');

  const { data: allContracts = [], isLoading } = useQuery({
    queryKey: ['myContractsAll'],
    queryFn: () => base44.entities.DebtContract.list('-created_date', 200),
  });

  // Include active contracts + cancelled contracts that still have outstanding penalties (irrevocable)
  const contracts = allContracts.filter(c =>
    c.is_accepted ||
    c.cancelled_by_admin ||
    c.cancel_status === 'cancelled' && c.cancellation_penalty_triggered
  );

  // Money penalties — include irrevocable cancelled contracts too
  const contractsWithCancelPenalty = contracts.filter(c => c.cancellation_penalty_triggered);
  const overdueContracts = contracts.filter(c =>
    c.next_payment_due && new Date(c.next_payment_due) < new Date() && c.penalty_percentage &&
    !(c.cancelled_by_admin || c.cancel_status === 'cancelled')
  );
  const totalCancellationPenalties = contracts.reduce((sum, c) => sum + (c.cancellation_penalty_amount || 0), 0);
  const totalOverduePenalties = overdueContracts.reduce((sum, c) => sum + ((c.monthly_payment || 0) * ((c.penalty_percentage || 0) / 100)), 0);
  const grandTotal = totalCancellationPenalties + totalOverduePenalties;

  // Extreme/prison penalties — include cancelled irrevocable contracts too
  const prisonContracts = allContracts.filter(c =>
    hasPrisonTerms(c) && (
      c.is_accepted ||
      (c.cancellation_irrevocable && (c.cancelled_by_admin || c.cancel_status === 'cancelled'))
    )
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(createPageUrl('MyContracts'))} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
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

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setTab('money')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${tab === 'money' ? 'text-red-400 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <DollarSign className="w-4 h-4" />
          Financial Penalties
        </button>
        <button
          onClick={() => setTab('extreme')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${tab === 'extreme' ? 'text-orange-400 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Gavel className="w-4 h-4" />
          Extreme Penalties
          {prisonContracts.length > 0 && (
            <span className="bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{prisonContracts.length}</span>
          )}
        </button>
      </div>

      <div className="px-6 pb-24 pt-6 space-y-6">
        {isLoading ? (
          <div className="text-center py-16 text-zinc-500">Loading...</div>
        ) : tab === 'money' ? (
          <>
            {grandTotal === 0 && overdueContracts.length === 0 && contractsWithCancelPenalty.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center"
              >
                <Ban className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 text-lg mb-2">No Financial Penalties</p>
                <p className="text-zinc-600 text-sm">You have no outstanding financial penalties.</p>
              </motion.div>
            ) : (
              <>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-red-950/40 border-2 border-red-500/60 rounded-2xl p-5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    <h2 className="text-red-300 font-bold text-lg">Total Financial Penalties</h2>
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

                {contractsWithCancelPenalty.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
                    <h3 className="text-zinc-400 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                      <Ban className="w-4 h-4 text-red-400" /> Cancellation Attempt Penalties
                    </h3>
                    {contractsWithCancelPenalty.map((c, idx) => (
                      <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                        className="bg-zinc-900 border border-red-800/40 rounded-xl p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-red-400 flex-shrink-0" />
                          <div>
                            <p className="text-white font-semibold text-sm">{c.title}</p>
                            <p className="text-zinc-500 text-xs">Irrevocable — 3-month penalty applied</p>
                            {(c.cancelled_by_admin || c.cancel_status === 'cancelled') && (
                              <span className="text-xs text-red-400 font-bold">CONTRACT CANCELLED</span>
                            )}
                          </div>
                        </div>
                        <span className="text-red-300 font-bold text-lg flex-shrink-0">+${(c.cancellation_penalty_amount || 0).toFixed(2)}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {overdueContracts.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
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
          </>
        ) : (
          <>
            {prisonContracts.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center"
              >
                <Shield className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 text-lg mb-2">No Extreme Penalties</p>
                <p className="text-zinc-600 text-sm">You have no prison or criminal penalties.</p>
              </motion.div>
            ) : (
              <>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-orange-950/40 border-2 border-orange-600/60 rounded-2xl p-5"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Gavel className="w-6 h-6 text-orange-400" />
                    <h2 className="text-orange-300 font-bold text-lg">Extreme Contract Penalties</h2>
                  </div>
                  <p className="text-orange-400/80 text-sm">
                    {prisonContracts.length} contract{prisonContracts.length !== 1 ? 's' : ''} carry criminal / prison penalties.
                  </p>
                  <Link to="/CriminalCharges" className="mt-4 inline-block bg-orange-700 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                    View Full Criminal Charges →
                  </Link>
                </motion.div>

                {prisonContracts.map((c, idx) => {
                  const charges = extractPrisonCharges(c);
                  const isActive = c.is_accepted && !(c.cancelled_by_admin || c.cancel_status === 'cancelled');
                  const overdue = c.next_payment_due && new Date(c.next_payment_due) < new Date();
                  return (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      className={`bg-zinc-900 border rounded-2xl p-5 ${overdue && isActive ? 'border-red-600/70' : 'border-orange-800/40'}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-bold">{c.title}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {(c.cancelled_by_admin || c.cancel_status === 'cancelled') ? (
                              <span className="text-xs bg-red-900/40 text-red-400 border border-red-700/40 px-2 py-0.5 rounded-full font-bold">CANCELLED</span>
                            ) : isActive ? (
                              <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">Active</span>
                            ) : (
                              <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">Inactive</span>
                            )}
                            {overdue && isActive && (
                              <span className="text-xs bg-red-900/40 text-red-400 border border-red-700/40 px-2 py-0.5 rounded-full font-bold">⚠ OVERDUE</span>
                            )}
                          </div>
                        </div>
                        <Gavel className="w-5 h-5 text-orange-400 flex-shrink-0" />
                      </div>
                      {charges.length > 0 && (
                        <div className="bg-red-950/30 border border-red-800/30 rounded-lg p-3">
                          <p className="text-red-400 text-xs font-bold mb-2 uppercase tracking-wide">Potential Criminal Consequences</p>
                          <ul className="space-y-1">
                            {charges.slice(0, 3).map((charge, i) => (
                              <li key={i} className="text-orange-300 text-xs flex gap-2">
                                <span className="text-red-500 flex-shrink-0">•</span>
                                {charge}
                              </li>
                            ))}
                            {charges.length > 3 && (
                              <li className="text-zinc-500 text-xs italic">+{charges.length - 3} more charges — <Link to="/CriminalCharges" className="text-orange-400 underline">View all</Link></li>
                            )}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
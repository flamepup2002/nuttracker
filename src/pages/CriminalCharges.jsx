import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Gavel, AlertTriangle, FileText, Shield } from 'lucide-react';

function hasPrisonTerms(contract) {
  const prisonKeywords = ['prison', 'jail', 'arrest', 'warrant', 'felony', 'federal', 'incarcerat', 'sentence', 'fugitive', 'criminal', 'probation', 'bail', 'custody', 'prosecution', 'fbi', 'interpol'];
  const text = ((contract.title || '') + ' ' + (contract.description || '') + ' ' + (contract.terms || []).join(' ')).toLowerCase();
  return prisonKeywords.some(kw => text.includes(kw));
}

function categorizeCharge(term) {
  const t = term.toLowerCase();
  if (t.includes('fbi') || t.includes('federal') || t.includes('interpol')) return { label: 'Federal', color: 'text-red-400', bg: 'bg-red-950/40 border-red-700/40' };
  if (t.includes('warrant') || t.includes('arrest')) return { label: 'Arrest', color: 'text-orange-400', bg: 'bg-orange-950/40 border-orange-700/40' };
  if (t.includes('felony') || t.includes('criminal')) return { label: 'Criminal', color: 'text-yellow-400', bg: 'bg-yellow-950/40 border-yellow-700/40' };
  if (t.includes('prison') || t.includes('incarcerat') || t.includes('sentence') || t.includes('custody')) return { label: 'Incarceration', color: 'text-purple-400', bg: 'bg-purple-950/40 border-purple-700/40' };
  if (t.includes('bail') || t.includes('probation')) return { label: 'Bail / Probation', color: 'text-blue-400', bg: 'bg-blue-950/40 border-blue-700/40' };
  return { label: 'Other', color: 'text-zinc-400', bg: 'bg-zinc-800/50 border-zinc-700/40' };
}

export default function CriminalCharges() {
  const navigate = useNavigate();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['myContractsAll'],
    queryFn: () => base44.entities.DebtContract.filter({ is_accepted: true }, '-created_date'),
  });

  const prisonContracts = contracts.filter(c => hasPrisonTerms(c));

  // Collect all criminal terms across all prison contracts
  const allCharges = [];
  prisonContracts.forEach(contract => {
    const terms = contract.terms || [];
    const prisonKeywords = ['prison', 'jail', 'arrest', 'warrant', 'felony', 'federal', 'incarcerat', 'sentence', 'fugitive', 'criminal', 'probation', 'bail', 'custody', 'prosecution', 'fbi', 'interpol', 'court'];
    const contractCharges = terms.filter(t => prisonKeywords.some(kw => t.toLowerCase().includes(kw)));
    contractCharges.forEach(charge => {
      allCharges.push({ charge, contract, category: categorizeCharge(charge) });
    });
  });

  const isOverdue = (contract) => contract.next_payment_due && new Date(contract.next_payment_due) < new Date();
  const isCancelled = (contract) => contract.cancelled_by_admin || contract.cancel_status === 'cancelled';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Gavel className="w-5 h-5 text-red-500" />
            Criminal Charges
          </h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="px-6 pb-24 pt-6 space-y-6">
        {isLoading ? (
          <div className="text-center py-16 text-zinc-500">Loading...</div>
        ) : prisonContracts.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center"
          >
            <Shield className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No Criminal Charges</p>
            <p className="text-zinc-600 text-sm">You have no active prison or criminal penalty contracts.</p>
          </motion.div>
        ) : (
          <>
            {/* Warning Banner */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-red-950/50 border-2 border-red-600/70 rounded-2xl p-5"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-7 h-7 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 font-bold text-lg">CHARGES FILED AGAINST YOU</p>
                  <p className="text-red-400/80 text-sm mt-1">
                    The following criminal charges are associated with your contracts.
                    Defaulting on or failing to fulfill these contracts may trigger the consequences listed below.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="bg-black/30 rounded-lg p-3">
                      <p className="text-red-300 font-bold text-xl">{prisonContracts.length}</p>
                      <p className="text-zinc-500 text-xs">Contracts with charges</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3">
                      <p className="text-red-300 font-bold text-xl">{allCharges.length}</p>
                      <p className="text-zinc-500 text-xs">Total charges</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Per-contract charges */}
            {prisonContracts.map((contract, idx) => {
              const terms = contract.terms || [];
              const prisonKeywords = ['prison', 'jail', 'arrest', 'warrant', 'felony', 'federal', 'incarcerat', 'sentence', 'fugitive', 'criminal', 'probation', 'bail', 'custody', 'prosecution', 'fbi', 'interpol', 'court'];
              const contractCharges = terms.filter(t => prisonKeywords.some(kw => t.toLowerCase().includes(kw)));
              const overdue = isOverdue(contract);
              const cancelled = isCancelled(contract);

              return (
                <motion.div key={contract.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}
                  className={`bg-zinc-900 border rounded-2xl overflow-hidden ${overdue && !cancelled ? 'border-red-600/70' : 'border-zinc-800'}`}
                >
                  {/* Contract header */}
                  <div className={`px-5 py-4 flex items-start justify-between ${overdue && !cancelled ? 'bg-red-950/30' : 'bg-zinc-800/30'}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-zinc-400" />
                        <p className="text-white font-bold">{contract.title}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {cancelled ? (
                          <span className="text-xs bg-red-900/40 text-red-400 border border-red-700/40 px-2 py-0.5 rounded-full font-bold">CANCELLED</span>
                        ) : (
                          <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">Active</span>
                        )}
                        {overdue && !cancelled && (
                          <span className="text-xs bg-red-900/40 text-red-400 border border-red-600/50 px-2 py-0.5 rounded-full font-bold">⚠ OVERDUE — CHARGES ACTIVE</span>
                        )}
                        <span className="text-xs text-zinc-500">${contract.monthly_payment}/mo</span>
                      </div>
                    </div>
                    <Gavel className="w-5 h-5 text-red-400 flex-shrink-0" />
                  </div>

                  {/* Charges list */}
                  <div className="p-5 space-y-2">
                    <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-3">
                      {contractCharges.length} Charge{contractCharges.length !== 1 ? 's' : ''}
                    </p>
                    {contractCharges.map((charge, i) => {
                      const cat = categorizeCharge(charge);
                      return (
                        <div key={i} className={`border rounded-lg p-3 ${cat.bg}`}>
                          <div className="flex items-start gap-2">
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${cat.color} bg-black/30`}>{cat.label}</span>
                            <p className="text-zinc-300 text-sm leading-relaxed">{charge}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
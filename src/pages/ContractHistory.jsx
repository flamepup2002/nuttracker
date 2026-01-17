import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, FileText, DollarSign, Calendar, CheckCircle, 
  XCircle, AlertTriangle, TrendingUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";

const INTENSITY_CONFIG = {
  mild: { color: 'from-blue-500 to-blue-600', icon: '📋' },
  moderate: { color: 'from-yellow-500 to-orange-500', icon: '⚠️' },
  intense: { color: 'from-orange-600 to-red-600', icon: '🔥' },
  extreme: { color: 'from-red-700 to-red-900', icon: '💀' }
};

export default function ContractHistory() {
  const navigate = useNavigate();
  const [selectedContract, setSelectedContract] = useState(null);

  const { data: allContracts = [], isLoading } = useQuery({
    queryKey: ['contractHistory'],
    queryFn: () => base44.entities.DebtContract.list('-created_date', 100),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['allPayments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 100),
  });

  const completedContracts = allContracts.filter(c => !c.is_accepted && c.cancelled_at);
  const defaultedContracts = allContracts.filter(c => {
    const nextDate = c.next_payment_due ? new Date(c.next_payment_due) : null;
    return c.is_accepted && nextDate && nextDate < new Date();
  });

  const getContractPayments = (contractId) => {
    return payments.filter(p => p.metadata?.contract_id === contractId);
  };

  const getContractStatus = (contract) => {
    if (!contract.is_accepted && contract.cancelled_at) {
      return { status: 'completed', color: 'text-green-400', icon: CheckCircle, label: 'Completed' };
    }
    const nextDate = contract.next_payment_due ? new Date(contract.next_payment_due) : null;
    if (nextDate && nextDate < new Date()) {
      return { status: 'defaulted', color: 'text-red-400', icon: AlertTriangle, label: 'Defaulted' };
    }
    return { status: 'active', color: 'text-yellow-400', icon: AlertTriangle, label: 'Active' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading contract history...</div>
      </div>
    );
  }

  const historyContracts = [...completedContracts, ...defaultedContracts];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('MyContracts'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
            Contract History
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="px-6 pb-24 space-y-6 pt-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
          >
            <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-2xl font-bold text-white">{completedContracts.length}</p>
            <p className="text-zinc-500 text-xs">Completed</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
          >
            <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
            <p className="text-2xl font-bold text-white">{defaultedContracts.length}</p>
            <p className="text-zinc-500 text-xs">Defaulted</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
          >
            <DollarSign className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-2xl font-bold text-white">
              ${historyContracts.reduce((sum, c) => sum + (c.amount_paid || 0), 0).toFixed(0)}
            </p>
            <p className="text-zinc-500 text-xs">Total Paid</p>
          </motion.div>
        </div>

        {/* History List */}
        {historyContracts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center"
          >
            <FileText className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No Contract History</p>
            <p className="text-zinc-600 text-sm">Your completed and defaulted contracts will appear here</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {historyContracts.map((contract, idx) => {
              const config = INTENSITY_CONFIG[contract.intensity_level];
              const statusInfo = getContractStatus(contract);
              const StatusIcon = statusInfo.icon;
              const contractPayments = getContractPayments(contract.id);

              return (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedContract(selectedContract?.id === contract.id ? null : contract)}
                  className="cursor-pointer bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{config.icon}</span>
                        <div>
                          <h3 className="text-white font-bold text-lg">{contract.title}</h3>
                          <p className={`text-xs font-bold flex items-center gap-1 mt-1 ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </p>
                        </div>
                      </div>
                      <p className="text-zinc-400 text-sm">{contract.description}</p>
                    </div>
                  </div>

                  {/* Contract Details Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-zinc-500 text-xs mb-1">Monthly Payment</p>
                      <p className="text-white font-bold">
                        {contract.monthly_payment > 0 
                          ? `$${contract.monthly_payment}` 
                          : '85% of income'}
                      </p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-zinc-500 text-xs mb-1">Duration</p>
                      <p className="text-white font-bold">
                        {contract.duration_months ? `${contract.duration_months}m` : '∞ Forever'}
                      </p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-zinc-500 text-xs mb-1">Total Obligation</p>
                      <p className="text-white font-bold">
                        ${(contract.total_obligation || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-zinc-500 text-xs mb-1">Amount Paid</p>
                      <p className="text-green-400 font-bold">
                        ${(contract.amount_paid || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Acceptance/Cancellation Dates */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-zinc-500 text-xs mb-1">Accepted</p>
                      <p className="text-white font-bold text-sm">
                        {new Date(contract.accepted_at || contract.created_date).toLocaleDateString()}
                      </p>
                    </div>
                    {contract.cancelled_at && (
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <p className="text-zinc-500 text-xs mb-1">Completed</p>
                        <p className="text-green-400 font-bold text-sm">
                          {new Date(contract.cancelled_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Full Payment History */}
                  {selectedContract?.id === contract.id && contractPayments.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-4 pt-4 border-t border-zinc-800"
                    >
                      <p className="text-zinc-500 text-xs font-medium mb-3 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        Payment History ({contractPayments.length} total)
                      </p>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {contractPayments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between text-xs bg-zinc-800/30 rounded-lg p-2">
                            <div>
                              <p className="text-zinc-400">
                                {new Date(payment.created_date).toLocaleDateString()}
                              </p>
                              <p className={`text-xs font-semibold mt-0.5 ${
                                payment.status === 'succeeded' ? 'text-green-400' : 
                                payment.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                              }`}>
                                {payment.status}
                              </p>
                            </div>
                            <span className={`font-bold ${
                              payment.status === 'succeeded' ? 'text-green-400' : 
                              payment.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                              ${payment.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {selectedContract?.id !== contract.id && contractPayments.length > 0 && (
                    <p className="text-zinc-500 text-xs">
                      {contractPayments.length} payment(s) recorded • Click to view details
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
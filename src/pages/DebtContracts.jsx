import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  ArrowLeft, AlertTriangle, FileText, DollarSign, Calendar, 
  CheckCircle2, Lock, Zap, TrendingDown, ChevronDown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SAMPLE_CONTRACTS = [];

const INTENSITY_CONFIG = {
  mild: { color: 'from-blue-500 to-blue-600', icon: '📋', risk: 'Low Risk' },
  moderate: { color: 'from-yellow-500 to-orange-500', icon: '⚠️', risk: 'Medium Risk' },
  intense: { color: 'from-orange-600 to-red-600', icon: '🔥', risk: 'High Risk' },
  extreme: { color: 'from-red-700 to-red-900', icon: '💀', risk: 'Extreme Risk' }
};

export default function DebtContracts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedContract, setSelectedContract] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { data: acceptedContracts = [] } = useQuery({
    queryKey: ['debtContracts'],
    queryFn: () => base44.entities.DebtContract.list('-created_date', 100),
  });

  const acceptMutation = useMutation({
    mutationFn: async (contract) => {
      const total = contract.monthly * (contract.duration || 1);
      return base44.entities.DebtContract.create({
        title: contract.title,
        description: contract.description,
        intensity_level: contract.intensity,
        monthly_payment: contract.monthly,
        duration_months: contract.duration,
        total_obligation: total,
        terms: contract.terms,
        is_accepted: true,
        accepted_at: new Date().toISOString(),
        next_payment_due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debtContracts'] });
      toast.success('Contract accepted - you are now bound');
      setShowConfirmation(false);
      setSelectedContract(null);
    },
    onError: () => {
      toast.error('Failed to accept contract');
    },
  });

  const handleAcceptContract = (contract) => {
    setSelectedContract(contract);
    setShowConfirmation(true);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-500" />
            Debt Contracts
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="px-6 pb-24 space-y-4 pt-6">
        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/30 border-2 border-red-500/50 rounded-2xl p-4 flex items-start gap-4"
        >
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-bold">BINDING FINANCIAL CONTRACTS</p>
            <p className="text-red-400/80 text-sm mt-1">
              These are AI-generated debt contracts. Accepting means you pledge to make the specified payments. Think carefully before committing.
            </p>
          </div>
        </motion.div>

        {/* Active Contracts */}
        {acceptedContracts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Your Active Contracts</h2>
            {acceptedContracts.map((contract) => {
              const config = INTENSITY_CONFIG[contract.intensity_level];
              const remaining = contract.total_obligation - (contract.amount_paid || 0);
              const progress = ((contract.amount_paid || 0) / contract.total_obligation) * 100;
              
              return (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`bg-gradient-to-br ${config.color} rounded-2xl p-5 border border-opacity-30 border-white`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">{contract.title}</h3>
                      <p className="text-white/70 text-sm">{contract.description}</p>
                    </div>
                    <Lock className="w-5 h-5 text-white flex-shrink-0" />
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white/10 rounded-lg p-2">
                      <p className="text-white/70 text-xs">Monthly</p>
                      <p className="text-white font-bold">${contract.monthly_payment}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2">
                      <p className="text-white/70 text-xs">Remaining</p>
                      <p className="text-white font-bold">${remaining.toFixed(0)}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2">
                      <p className="text-white/70 text-xs">Due</p>
                      <p className="text-white font-bold">{new Date(contract.next_payment_due).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="w-full bg-black/30 rounded-full h-2">
                    <div 
                      className="bg-white h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-white/70 text-xs mt-2">{progress.toFixed(0)}% Complete</p>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Available Contracts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mt-8">Available Contracts</h2>
          
          {SAMPLE_CONTRACTS.map((contract, idx) => {
            const config = INTENSITY_CONFIG[contract.intensity];
            const isAlreadyAccepted = acceptedContracts.some(c => c.title === contract.title);
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <button
                  onClick={() => handleAcceptContract(contract)}
                  disabled={isAlreadyAccepted}
                  className="w-full group relative overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${config.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                  <div className={`relative bg-zinc-900 border-2 border-zinc-800 group-hover:border-zinc-700 rounded-2xl p-5 transition-all ${isAlreadyAccepted ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{config.icon}</span>
                          <div>
                            <h3 className="text-white font-bold text-lg">{contract.title}</h3>
                            <p className="text-zinc-400 text-xs mt-0.5">{config.risk}</p>
                          </div>
                        </div>
                        <p className="text-zinc-400 text-sm mt-2">{contract.description}</p>
                      </div>
                      {isAlreadyAccepted && <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />}
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="bg-zinc-800/50 rounded-lg p-2">
                        <p className="text-zinc-500 text-xs">Monthly</p>
                        <p className="text-white font-bold text-sm">${contract.monthly}</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-2">
                        <p className="text-zinc-500 text-xs">Duration</p>
                        <p className="text-white font-bold text-sm">{contract.duration ? `${contract.duration}m` : '∞'}</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-2">
                        <p className="text-zinc-500 text-xs">Total Owed</p>
                        <p className="text-white font-bold text-sm">${contract.monthly * (contract.duration || 1)}</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-2">
                        <p className="text-zinc-500 text-xs">Penalty</p>
                        <p className="text-white font-bold text-sm">5-30%</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-zinc-500 text-xs font-medium mb-2">Terms:</p>
                      <ul className="space-y-1">
                        {contract.terms.slice(0, 3).map((term, i) => (
                          <li key={i} className="text-zinc-400 text-xs flex items-start gap-2">
                            <span className="text-zinc-600">•</span>
                            <span>{term}</span>
                          </li>
                        ))}
                        {contract.terms.length > 3 && (
                          <li className="text-zinc-500 text-xs italic">+{contract.terms.length - 3} more terms</li>
                        )}
                      </ul>
                    </div>

                    {!isAlreadyAccepted && (
                      <Button
                        className={`w-full bg-gradient-to-r ${config.color} hover:opacity-90 text-white font-bold`}
                      >
                        Accept Contract
                      </Button>
                    )}
                  </div>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Confirm Contract Acceptance
          </AlertDialogTitle>
          {selectedContract && (
            <AlertDialogDescription className="space-y-4 text-zinc-300">
              <p className="font-bold text-white">{selectedContract.title}</p>
              <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2">
                <p className="text-sm">
                  <span className="text-zinc-500">Monthly Payment:</span>
                  <span className="text-white font-bold ml-2">${selectedContract.monthly}</span>
                </p>
                <p className="text-sm">
                  <span className="text-zinc-500">Total Obligation:</span>
                  <span className="text-white font-bold ml-2">${selectedContract.monthly * (selectedContract.duration || 1)}</span>
                </p>
                <p className="text-sm">
                  <span className="text-zinc-500">Duration:</span>
                  <span className="text-white font-bold ml-2">{selectedContract.duration ? `${selectedContract.duration} months` : 'Permanent'}</span>
                </p>
              </div>
              <p className="text-red-400 text-xs">
                By accepting this contract, you pledge to make these payments. This is a binding financial commitment.
              </p>
            </AlertDialogDescription>
          )}
          <div className="flex gap-3">
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedContract && acceptMutation.mutate(selectedContract)}
              disabled={acceptMutation.isPending}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            >
              {acceptMutation.isPending ? 'Binding...' : 'I Accept'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
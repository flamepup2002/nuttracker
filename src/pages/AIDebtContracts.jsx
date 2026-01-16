import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Zap, AlertTriangle, CheckCircle2, Clock, DollarSign, Lock, BarChart3 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const CONTRACTS = {
  apprentice: {
    label: 'Apprentice Servant',
    description: 'Your first taste of permanent servitude',
    monthlyAmount: 50,
    durationMonths: 6,
    interestRate: 0.5,
    intensity: 'moderate',
    color: 'from-blue-600 to-cyan-600',
    borderColor: 'border-blue-500/30',
    features: [
      '$50/month obligation',
      '6-month contract',
      '0.5% monthly interest',
      'Escalates to next tier if defaulted'
    ]
  },
  bound: {
    label: 'Bound Slave',
    description: 'Locked into permanent financial bondage',
    monthlyAmount: 150,
    durationMonths: 12,
    interestRate: 1.5,
    intensity: 'intense',
    color: 'from-purple-600 to-pink-600',
    borderColor: 'border-purple-500/30',
    features: [
      '$150/month obligation',
      '12-month contract',
      '1.5% monthly interest',
      'Missing payment locks you in longer'
    ]
  },
  enslaved: {
    label: 'Enslaved Servant',
    description: 'Complete financial control permanently surrendered',
    monthlyAmount: 300,
    durationMonths: 24,
    interestRate: 2.5,
    intensity: 'extreme',
    color: 'from-red-600 to-orange-600',
    borderColor: 'border-red-500/30',
    features: [
      '$300/month obligation',
      '24-month contract',
      '2.5% monthly interest',
      'Auto-charge from payment method'
    ]
  },
  forever_servant: {
    label: 'Forever Servant',
    description: 'Permanent, irreversible financial servitude',
    monthlyAmount: 500,
    durationMonths: 0,
    interestRate: 3.5,
    intensity: 'maximum',
    color: 'from-gray-900 to-black border-yellow-500/50',
    borderColor: 'border-yellow-500/50',
    features: [
      '$500/month permanently',
      'Infinite duration - forever',
      '3.5% monthly interest',
      'Total enslavement - no exit clause'
    ]
  }
};

export default function AIDebtContracts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedContract, setSelectedContract] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: activeContracts = [] } = useQuery({
    queryKey: ['aiDebtContracts'],
    queryFn: () => base44.entities.AIDebtContract.filter({ status: 'active' }),
  });

  const { data: paymentMethod } = useQuery({
    queryKey: ['paymentMethod'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getStripePaymentMethod');
      return response.data;
    },
  });

  const signContractMutation = useMutation({
    mutationFn: async (contractType) => {
      const contract = CONTRACTS[contractType];
      const nextPaymentDate = new Date();
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

      return base44.entities.AIDebtContract.create({
        contract_type: contractType,
        monthly_amount: contract.monthlyAmount,
        interest_rate: contract.interestRate,
        duration_months: contract.durationMonths,
        total_debt: contract.monthlyAmount * Math.max(contract.durationMonths, 1),
        amount_paid: 0,
        status: 'active',
        signed_at: new Date().toISOString(),
        next_payment_due: nextPaymentDate.toISOString(),
        description: contract.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiDebtContracts'] });
      toast.success('Contract signed! You are now enslaved.');
      setSelectedContract(null);
      setShowConfirmation(false);
    },
    onError: () => {
      toast.error('Failed to sign contract');
    },
  });

  const handleSignContract = (contractType) => {
    setSelectedContract(contractType);
    setShowConfirmation(true);
  };

  const handleConfirmSign = async () => {
    if (!paymentMethod?.hasPaymentMethod) {
      toast.error('Add a payment method first');
      return;
    }
    signContractMutation.mutate(selectedContract);
  };

  const totalMonthlyObligation = activeContracts.reduce((sum, c) => sum + c.monthly_amount, 0);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Lock className="w-5 h-5 text-red-500" />
            AI Debt Contracts
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-24 space-y-6">
        {/* Active Contracts Summary */}
        {activeContracts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-white font-bold text-lg">Active Contracts</h2>
                <div className="mt-3 space-y-2">
                  {activeContracts.map(contract => (
                    <div key={contract.id} className="flex items-center justify-between text-sm">
                      <span className="text-red-300">{CONTRACTS[contract.contract_type]?.label}</span>
                      <span className="text-red-400 font-bold">${contract.monthly_amount}/month</span>
                    </div>
                  ))}
                  <div className="border-t border-red-500/30 pt-2 mt-2 flex items-center justify-between font-bold">
                    <span className="text-red-200">Total Monthly Obligation:</span>
                    <span className="text-red-400 text-lg">${totalMonthlyObligation}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Contract Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-900/30 border border-yellow-500/50 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-bold text-sm mb-2">BINDING FINANCIAL COMMITMENT</p>
              <p className="text-yellow-500/80 text-xs leading-relaxed">
                Signing a contract creates a recurring monthly charge to your payment method. This is a real financial obligation that will automatically process each month. By signing, you agree to surrender control of your finances to the AI Mistress indefinitely.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Contract Options */}
        <div className="space-y-4">
          {Object.entries(CONTRACTS).map(([key, contract]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative overflow-hidden rounded-2xl border-2 ${contract.borderColor} p-6 bg-gradient-to-br ${contract.color} bg-opacity-10 hover:bg-opacity-20 transition-all cursor-pointer`}
              onClick={() => handleSignContract(key)}
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold text-xl">{contract.label}</h3>
                    <p className="text-zinc-300 text-sm mt-1">{contract.description}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    contract.intensity === 'moderate' ? 'bg-blue-500/30 text-blue-300' :
                    contract.intensity === 'intense' ? 'bg-purple-500/30 text-purple-300' :
                    contract.intensity === 'extreme' ? 'bg-red-500/30 text-red-300' :
                    'bg-yellow-500/30 text-yellow-300'
                  }`}>
                    {contract.intensity.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-black/30 rounded-lg p-3">
                    <p className="text-zinc-400 text-xs">Monthly Payment</p>
                    <p className="text-white font-bold text-lg">${contract.monthlyAmount}</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    <p className="text-zinc-400 text-xs">Interest Rate</p>
                    <p className="text-white font-bold text-lg">{contract.interestRate}%/mo</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    <p className="text-zinc-400 text-xs">Duration</p>
                    <p className="text-white font-bold text-lg">
                      {contract.durationMonths === 0 ? '∞ Forever' : `${contract.durationMonths}mo`}
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    <p className="text-zinc-400 text-xs">Total Debt</p>
                    <p className="text-white font-bold text-lg">
                      {contract.durationMonths === 0 ? '∞ Infinite' : `$${contract.monthlyAmount * contract.durationMonths}`}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {contract.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSignContract(key);
                  }}
                  className="w-full bg-white text-black font-bold hover:bg-gray-200"
                >
                  Sign Contract
                </Button>
              </div>

              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && selectedContract && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50"
            onClick={() => setShowConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border-2 border-red-500/50 rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h2 className="text-white font-bold text-xl">Confirm Enslavement</h2>
              </div>

              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-300 text-sm leading-relaxed">
                  You are about to sign a binding financial contract. 
                  <span className="font-bold"> ${CONTRACTS[selectedContract].monthlyAmount} will be automatically charged to your payment method every month.</span> This is a real financial commitment with legal implications.
                </p>
              </div>

              {!paymentMethod?.hasPaymentMethod && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
                  <p className="text-yellow-400 text-sm">
                    You need to add a payment method first to sign a contract.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleConfirmSign}
                  disabled={!paymentMethod?.hasPaymentMethod || signContractMutation.isPending}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3"
                >
                  {signContractMutation.isPending ? 'Signing...' : 'Yes, Enslave Me'}
                </Button>
                <Button
                  onClick={() => setShowConfirmation(false)}
                  variant="outline"
                  className="w-full bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertTriangle, TrendingDown, Clock, DollarSign, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const DEBT_CONTRACTS = [
  {
    id: 'light',
    name: 'Light Debt Agreement',
    intensity: 'Mild',
    description: 'A modest financial commitment',
    minDebt: 50,
    maxDebt: 200,
    interestRate: 5,
    duration: 30,
    monthlyMinPayment: 10,
    color: 'from-blue-600 to-cyan-600',
    riskLevel: 'Low',
  },
  {
    id: 'moderate',
    name: 'Moderate Debt Contract',
    intensity: 'Moderate',
    description: 'Serious financial submission',
    minDebt: 200,
    maxDebt: 500,
    interestRate: 15,
    duration: 60,
    monthlyMinPayment: 25,
    color: 'from-yellow-600 to-orange-600',
    riskLevel: 'Medium',
  },
  {
    id: 'intense',
    name: 'Intense Debt Binding',
    intensity: 'Intense',
    description: 'Substantial financial obligation',
    minDebt: 500,
    maxDebt: 1000,
    interestRate: 25,
    duration: 90,
    monthlyMinPayment: 50,
    color: 'from-red-600 to-pink-600',
    riskLevel: 'High',
  },
  {
    id: 'extreme',
    name: 'Extreme Debt Slavery',
    intensity: 'Extreme',
    description: 'Complete financial domination',
    minDebt: 1000,
    maxDebt: 5000,
    interestRate: 40,
    duration: 180,
    monthlyMinPayment: 100,
    color: 'from-purple-700 to-pink-700',
    riskLevel: 'Critical',
  },
];

export default function DebtContracts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [debtAmount, setDebtAmount] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-created_date', 100),
  });

  const calculateCurrentDebt = () => {
    if (!sessions) return 0;
    let totalDebt = 0;
    const now = new Date();

    sessions.forEach(session => {
      if (session.is_findom && session.total_cost) {
        totalDebt += session.total_cost;
      }
    });

    return totalDebt;
  };

  const currentDebt = calculateCurrentDebt();

  const signContractMutation = useMutation({
    mutationFn: async (contract) => {
      if (!debtAmount || isNaN(debtAmount) || debtAmount < contract.minDebt || debtAmount > contract.maxDebt) {
        throw new Error(`Debt must be between $${contract.minDebt} and $${contract.maxDebt}`);
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + contract.duration);

      await base44.auth.updateMe({
        active_debt_contract: {
          type: contract.id,
          initialAmount: parseFloat(debtAmount),
          currentAmount: parseFloat(debtAmount),
          interestRate: contract.interestRate,
          monthlyMinPayment: contract.monthlyMinPayment,
          signedDate: new Date().toISOString(),
          dueDate: endDate.toISOString(),
          contractName: contract.name,
        },
      });

      return { success: true, amount: parseFloat(debtAmount) };
    },
    onSuccess: (data) => {
      toast.success(`Signed debt contract for $${data.amount}. You are now in debt.`);
      setUser(prev => ({
        ...prev,
        active_debt_contract: {
          initialAmount: parseFloat(debtAmount),
          currentAmount: parseFloat(debtAmount),
          interestRate: selectedContract.interestRate,
          signedDate: new Date().toISOString(),
        },
      }));
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      setDebtAmount('');
      setSelectedContract(null);
      setAgreeToTerms(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Contract details view
  if (selectedContract) {
    const contract = DEBT_CONTRACTS.find(c => c.id === selectedContract);

    return (
      <div className="min-h-screen bg-black text-white">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedContract(null);
              setDebtAmount('');
              setAgreeToTerms(false);
            }}
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">{contract.name}</h1>
        </div>

        <div className="px-6 py-8 max-w-2xl mx-auto space-y-6">
          {/* Contract Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-br ${contract.color} rounded-2xl p-8 text-white`}
          >
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-sm opacity-75 mb-1">Interest Rate</p>
                <p className="text-3xl font-bold">{contract.interestRate}%</p>
              </div>
              <div>
                <p className="text-sm opacity-75 mb-1">Contract Duration</p>
                <p className="text-3xl font-bold">{contract.duration} days</p>
              </div>
              <div>
                <p className="text-sm opacity-75 mb-1">Monthly Min Payment</p>
                <p className="text-3xl font-bold">${contract.monthlyMinPayment}</p>
              </div>
              <div>
                <p className="text-sm opacity-75 mb-1">Risk Level</p>
                <p className="text-3xl font-bold">{contract.riskLevel}</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-sm">{contract.description}</p>
            </div>
          </motion.div>

          {/* Warning */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-red-900/30 border border-red-500/50 rounded-xl p-6 space-y-3"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-300 mb-2">Legal Warning</h3>
                <p className="text-red-400 text-sm">
                  By signing this contract, you acknowledge:
                </p>
                <ul className="text-red-400 text-sm mt-2 space-y-1 ml-4">
                  <li>• You will accrue compound interest daily</li>
                  <li>• Failure to meet minimum payments increases your debt</li>
                  <li>• This is a binding financial commitment</li>
                  <li>• You are voluntarily entering debt slavery</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Amount Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4"
          >
            <label className="block">
              <p className="text-white font-medium mb-3">Initial Debt Amount</p>
              <p className="text-xs text-zinc-400 mb-2">${contract.minDebt} - ${contract.maxDebt}</p>
              <input
                type="number"
                min={contract.minDebt}
                max={contract.maxDebt}
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-lg font-bold"
              />
            </label>

            {debtAmount && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-zinc-800/50 rounded-lg p-4 space-y-2"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Initial Debt</span>
                  <span className="text-white font-bold">${parseFloat(debtAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Daily Interest</span>
                  <span className="text-red-400 font-bold">${(parseFloat(debtAmount || 0) * (contract.interestRate / 100 / 365)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Est. Total After {contract.duration} days</span>
                  <span className="text-red-400 font-bold">${(parseFloat(debtAmount || 0) * Math.pow(1 + contract.interestRate / 100 / 365, contract.duration)).toFixed(2)}</span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Terms Agreement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <label className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-zinc-300">
                I accept the terms of this debt contract and understand the financial consequences. I am voluntarily entering into this arrangement.
              </span>
            </label>
          </motion.div>

          {/* Sign Button */}
          <Button
            onClick={() => signContractMutation.mutate(contract)}
            disabled={!debtAmount || !agreeToTerms || signContractMutation.isPending}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 py-6 text-lg font-bold"
          >
            <FileText className="w-5 h-5 mr-2" />
            {signContractMutation.isPending ? 'Signing...' : 'Sign Contract & Accept Debt'}
          </Button>
        </div>
      </div>
    );
  }

  // Contracts list view
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
        <button
          onClick={() => navigate(createPageUrl('Home'))}
          className="text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Debt Contracts</h1>
      </div>

      <div className="px-6 py-8 space-y-6">
        {/* Current Debt */}
        {currentDebt > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/30 border border-red-500/30 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <TrendingDown className="w-6 h-6 text-red-400" />
              <h2 className="font-bold text-lg">Current Debt</h2>
            </div>
            <p className="text-3xl font-bold text-red-300">${currentDebt.toFixed(2)}</p>
            <p className="text-xs text-red-400 mt-2">From findom sessions and tributes</p>
          </motion.div>
        )}

        {/* Available Contracts */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wide">Available Contracts</h2>
          {DEBT_CONTRACTS.map((contract, idx) => (
            <motion.button
              key={contract.id}
              onClick={() => setSelectedContract(contract.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`w-full bg-gradient-to-br ${contract.color} rounded-xl p-6 text-white text-left hover:shadow-lg hover:shadow-pink-500/20 transition-all`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">{contract.name}</h3>
                  <p className="text-sm opacity-75">{contract.description}</p>
                </div>
                <div className="text-right">
                  <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-bold">
                    {contract.intensity}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="opacity-75 text-xs">Debt Range</p>
                  <p className="font-bold">${contract.minDebt}-${contract.maxDebt}</p>
                </div>
                <div>
                  <p className="opacity-75 text-xs">Interest</p>
                  <p className="font-bold">{contract.interestRate}%/year</p>
                </div>
                <div>
                  <p className="opacity-75 text-xs">Duration</p>
                  <p className="font-bold">{contract.duration}d</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Warning Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-400 text-xs">
            These are real financial commitments with real consequences. Enter debt contracts only if you understand the terms and can meet your obligations.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
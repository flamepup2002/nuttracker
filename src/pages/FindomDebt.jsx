import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, TrendingUp, AlertTriangle, DollarSign, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

const COUNTRY_CURRENCY = {
  'US': { code: 'USD', symbol: '$', name: 'United States Dollar' },
  'GB': { code: 'GBP', symbol: '£', name: 'British Pound' },
  'EU': { code: 'EUR', symbol: '€', name: 'Euro' },
  'CA': { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  'AU': { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
  'JP': { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  'default': { code: 'USD', symbol: '$', name: 'United States Dollar' },
};

export default function FindomDebt() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [calculatedDebt, setCalculatedDebt] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: settings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || null;
    },
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-created_date', 100),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 100),
  });

  // Calculate debt with interest
  useEffect(() => {
    if (!sessions || !settings) return;

    let totalDebt = 0;
    const now = new Date();

    sessions.forEach(session => {
      if (session.is_findom && session.total_cost) {
        const createdDate = new Date(session.created_date);
        const daysElapsed = (now - createdDate) / (1000 * 60 * 60 * 24);

        // Use locked interest rate from session, fall back to current settings
        const lockedRate = session.locked_interest_rate !== undefined ? session.locked_interest_rate : settings.interest_rate;
        const dailyInterestRate = lockedRate / 100;

        // Compound interest formula: P(1 + r)^t
        const debtWithInterest = session.total_cost * Math.pow(1 + dailyInterestRate, daysElapsed);
        totalDebt += debtWithInterest;
      }
    });

    // Subtract paid amounts
    payments.forEach(payment => {
      if (payment.status === 'succeeded') {
        totalDebt -= (payment.amount || 0);
      }
    });

    setCalculatedDebt(Math.max(0, totalDebt));
  }, [sessions, settings, payments]);

  const getCurrency = () => {
    const countryCode = user?.country || 'US';
    return COUNTRY_CURRENCY[countryCode] || COUNTRY_CURRENCY.default;
  };

  const currency = getCurrency();
  const findomEnabled = settings?.findom_enabled;
  const interestRate = settings?.interest_rate || 0;

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
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-400" />
            Findom Debt
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-24 space-y-6">
        {!findomEnabled ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-8 text-center"
          >
            <DollarSign className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">Findom mode is not enabled</p>
            <p className="text-zinc-500 text-sm mt-2">Enable it in Settings to start accumulating debt</p>
            <Button
              onClick={() => navigate(createPageUrl('Settings'))}
              className="mt-4 bg-pink-600 hover:bg-pink-700"
            >
              Go to Settings
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Total Debt Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-8 text-center border ${
                calculatedDebt > 0
                  ? 'bg-gradient-to-br from-red-900/30 to-red-900/10 border-red-500/30'
                  : 'bg-gradient-to-br from-green-900/30 to-green-900/10 border-green-500/30'
              }`}
            >
              <p className="text-zinc-400 text-sm mb-2">Current Debt Balance</p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-5xl font-bold text-white">{currency.symbol}</span>
                <span className={`text-5xl font-bold ${calculatedDebt > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {calculatedDebt.toFixed(2)}
                </span>
              </div>
              <p className="text-zinc-500 text-xs">{currency.code} - {currency.name}</p>
            </motion.div>

            {/* Interest Info */}
            {interestRate > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-orange-900/20 border border-orange-500/30 rounded-2xl p-5 flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-orange-400 font-medium text-sm">Compound Interest Active</p>
                  <p className="text-orange-500/70 text-xs mt-1">
                    Interest rates are locked when debt is incurred. Each session uses the rate from that time.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Sessions Summary */}
            {sessions.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6"
              >
                <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-zinc-400" />
                  Findom Sessions
                </h2>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sessions
                    .filter(s => s.is_findom && s.total_cost)
                    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                    .map(session => {
                       const createdDate = new Date(session.created_date);
                       const daysElapsed = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
                       const lockedRate = session.locked_interest_rate !== undefined ? session.locked_interest_rate : interestRate;
                       const dailyInterestRate = lockedRate / 100;
                       const debtWithInterest = session.total_cost * Math.pow(1 + dailyInterestRate, daysElapsed);
                       const accrued = debtWithInterest - session.total_cost;

                      return (
                        <div key={session.id} className="bg-zinc-800/50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-white font-medium text-sm">
                                {Math.round(daysElapsed)} days ago
                              </p>
                              <p className="text-zinc-500 text-xs mt-1">
                                {createdDate.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-red-400 font-bold">
                                {currency.symbol}{debtWithInterest.toFixed(2)}
                              </p>
                              {accrued > 0 && (
                                <p className="text-orange-400 text-xs mt-1">
                                  +{currency.symbol}{accrued.toFixed(2)} interest
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="text-zinc-500 text-xs">
                            Original: {currency.symbol}{session.total_cost.toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-8 text-center"
              >
                <DollarSign className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-400">No findom sessions yet</p>
                <p className="text-zinc-500 text-sm">Start a session to accumulate debt</p>
              </motion.div>
            )}

            {/* Info Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-5"
            >
              <p className="text-blue-400 font-medium text-sm mb-2">How Findom Debt Works</p>
              <ul className="text-blue-400/70 text-xs space-y-1">
                <li>• Debt accumulates during findom sessions</li>
                <li>• Interest compounds daily at the rate set in your settings</li>
                <li>• Debt increases over time if not paid</li>
                <li>• Pay sessions to reduce your balance</li>
              </ul>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
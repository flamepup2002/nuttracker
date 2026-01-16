import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, TrendingUp, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function FindomDebt() {
  const navigate = useNavigate();

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-created_date', 100),
  });

  const { data: settings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || null;
    },
  });

  const calculateDebt = () => {
    const findomSessions = sessions.filter(s => s.is_findom);
    let totalOriginalDebt = 0;
    let totalDebtWithInterest = 0;

    const now = new Date();

    findomSessions.forEach(session => {
      const sessionCost = session.total_cost || 0;
      totalOriginalDebt += sessionCost;

      const createdDate = new Date(session.created_date);
      const daysPassed = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      const dailyInterestRate = (settings?.interest_rate || 0) / 100;

      // Compound interest: Final = Principal * (1 + rate)^days
      const debtWithInterest = sessionCost * Math.pow(1 + dailyInterestRate, daysPassed);
      totalDebtWithInterest += debtWithInterest;
    });

    return {
      originalDebt: totalOriginalDebt,
      currentDebt: totalDebtWithInterest,
      interest: totalDebtWithInterest - totalOriginalDebt,
      sessionCount: findomSessions.length,
      dailyInterestRate: settings?.interest_rate || 0,
    };
  };

  const debt = calculateDebt();
  const interestPerDay = (debt.currentDebt * ((settings?.interest_rate || 0) / 100)).toFixed(2);

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
            <DollarSign className="w-5 h-5 text-red-400" />
            Findom Debt
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-24 space-y-6">
        {/* Current Debt Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-red-900/20 to-pink-900/20 border border-red-500/30 rounded-2xl p-6"
        >
          <p className="text-zinc-400 text-sm mb-4">Current Debt Balance</p>
          <div className="mb-4">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-red-400">
                ${debt.currentDebt.toFixed(2)}
              </span>
              <span className="text-zinc-500 text-sm">USD</span>
            </div>
            <p className="text-zinc-500 text-xs">
              Original: ${debt.originalDebt.toFixed(2)} + ${debt.interest.toFixed(2)} interest
            </p>
          </div>

          {debt.dailyInterestRate > 0 && (
            <div className="bg-red-900/30 rounded-lg p-3 border border-red-500/20">
              <p className="text-zinc-300 text-xs mb-1">Compounding daily at {debt.dailyInterestRate}%</p>
              <p className="text-red-400 font-bold text-sm">
                +${interestPerDay}/day added
              </p>
            </div>
          )}
        </motion.div>

        {/* Overview Stats */}
        {debt.sessionCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
              <p className="text-zinc-400 text-xs mb-2">Findom Sessions</p>
              <p className="text-white font-bold text-2xl">{debt.sessionCount}</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
              <p className="text-zinc-400 text-xs mb-2">Interest Rate</p>
              <p className="text-white font-bold text-2xl">{debt.dailyInterestRate}%</p>
              <p className="text-zinc-500 text-xs">/day</p>
            </div>
          </motion.div>
        )}

        {/* Warning Banner */}
        {debt.currentDebt > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-orange-900/30 border border-orange-500/50 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-orange-400 font-bold text-sm">Interest Accruing Daily</p>
              <p className="text-orange-400/80 text-xs mt-1">
                Your debt grows each day. Lower your interest rate in Settings or pay down your balance to reduce compounding interest.
              </p>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {debt.sessionCount === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center"
          >
            <DollarSign className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 mb-2">No findom debt</p>
            <p className="text-zinc-600 text-sm">You have no outstanding findom charges</p>
          </motion.div>
        )}

        {/* Info Section */}
        {debt.currentDebt > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4"
          >
            <h3 className="text-white font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              How Interest Works
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-zinc-300 font-medium">Compound Interest</p>
                <p className="text-zinc-500 text-xs mt-1">
                  Interest compounds daily. Your debt grows exponentially over time.
                </p>
              </div>
              <div>
                <p className="text-zinc-300 font-medium">Reduce Interest Rate</p>
                <p className="text-zinc-500 text-xs mt-1">
                  Go to Settings → Findom Mode to lower your daily interest rate and slow compounding.
                </p>
              </div>
              <div>
                <p className="text-zinc-300 font-medium">Payment Method Required</p>
                <p className="text-zinc-500 text-xs mt-1">
                  Your linked payment method from Settings is charged automatically during findom sessions.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
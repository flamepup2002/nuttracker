import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const GRADE_CONFIG = {
  'A+': { color: 'from-green-500 to-emerald-600', textColor: 'text-green-400', icon: '🏆' },
  'A': { color: 'from-green-600 to-green-700', textColor: 'text-green-400', icon: '⭐' },
  'B': { color: 'from-blue-500 to-blue-600', textColor: 'text-blue-400', icon: '👍' },
  'C': { color: 'from-yellow-500 to-yellow-600', textColor: 'text-yellow-400', icon: '⚠️' },
  'D': { color: 'from-orange-500 to-orange-600', textColor: 'text-orange-400', icon: '📉' },
  'F': { color: 'from-red-500 to-red-600', textColor: 'text-red-400', icon: '❌' }
};

export default function FinancialHealthScore({ compact = false }) {
  const { data: scoreData, isLoading } = useQuery({
    queryKey: ['financialHealthScore'],
    queryFn: async () => {
      const response = await base44.functions.invoke('calculateFinancialHealthScore');
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
            <div className="h-8 bg-zinc-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!scoreData?.success) return null;

  const { score, grade, metrics, insights, recommendations } = scoreData;
  const gradeConfig = GRADE_CONFIG[grade] || GRADE_CONFIG['C'];

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gradient-to-r ${gradeConfig.color} rounded-2xl p-5`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">Financial Health</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-white text-4xl font-bold">{score}</span>
              <span className="text-white text-2xl font-bold">{grade}</span>
            </div>
          </div>
          <span className="text-5xl">{gradeConfig.icon}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br ${gradeConfig.color} rounded-2xl p-6 relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm">Financial Health Score</p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-white text-5xl font-bold">{score}</span>
                <span className="text-white text-3xl font-bold">{grade}</span>
              </div>
            </div>
            <span className="text-6xl">{gradeConfig.icon}</span>
          </div>
          <div className="text-white/80 text-xs">
            Scale: 300-1000 • Updated just now
          </div>
        </div>
      </motion.div>

      {/* Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
      >
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Key Metrics
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-500 text-xs">Payment Timeliness</p>
            <p className="text-white font-bold">{metrics.paymentTimeliness}%</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-500 text-xs">Debt-to-Asset</p>
            <p className="text-white font-bold">{metrics.debtToAssetRatio}%</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-500 text-xs">Total Assets</p>
            <p className="text-white font-bold">${metrics.totalAssetValue.toLocaleString()}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-500 text-xs">Total Debt</p>
            <p className="text-white font-bold">${metrics.totalDebt.toLocaleString()}</p>
          </div>
        </div>
      </motion.div>

      {/* Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
        >
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Insights
          </h3>
          <ul className="space-y-2">
            {insights.map((insight, idx) => (
              <li key={idx} className="text-zinc-300 text-sm flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-900/30 border border-blue-700/30 rounded-2xl p-5"
        >
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Recommendations
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="text-blue-200 text-sm flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
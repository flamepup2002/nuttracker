import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, DollarSign, TrendingUp, Calendar, 
  Flame, Trophy, BarChart3, Activity, Lock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';

export default function FindomAnalytics() {
  const navigate = useNavigate();
  const [timePeriod, setTimePeriod] = useState('month');

  const { data: orgasms = [] } = useQuery({
    queryKey: ['orgasms'],
    queryFn: () => base44.entities.Orgasm.list('-created_date', 1000),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-created_date', 1000),
  });

  const findomOrgasms = orgasms.filter(o => o.is_findom && o.cost > 0);
  const findomSessions = sessions.filter(s => s.is_findom && s.total_cost > 0);

  // Calculate date ranges
  const now = new Date();
  const getDateRange = (period) => {
    const start = new Date();
    switch (period) {
      case 'day':
        start.setDate(now.getDate() - 1);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    return start;
  };

  const filterByPeriod = (items, period) => {
    const startDate = getDateRange(period);
    return items.filter(item => new Date(item.created_date) >= startDate);
  };

  // Stats calculations
  const periodOrgasms = filterByPeriod(findomOrgasms, timePeriod);
  const periodSessions = filterByPeriod(findomSessions, timePeriod);

  const stats = {
    totalSpent: findomOrgasms.reduce((sum, o) => sum + o.cost, 0),
    periodSpent: periodOrgasms.reduce((sum, o) => sum + o.cost, 0),
    totalSessions: findomSessions.length,
    periodSessions: periodSessions.length,
    avgPerSession: findomSessions.length > 0 
      ? findomSessions.reduce((sum, s) => sum + s.total_cost, 0) / findomSessions.length 
      : 0,
    avgPerOrgasm: findomOrgasms.length > 0
      ? findomOrgasms.reduce((sum, o) => sum + o.cost, 0) / findomOrgasms.length
      : 0,
  };

  // Top sessions
  const topSessions = [...findomSessions]
    .sort((a, b) => b.total_cost - a.total_cost)
    .slice(0, 5);

  // Chart data - spending over time (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const dailySpending = last30Days.map(date => {
    const dayOrgasms = findomOrgasms.filter(o => 
      o.created_date.startsWith(date)
    );
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: dayOrgasms.reduce((sum, o) => sum + o.cost, 0)
    };
  });

  const periods = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-24">
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
            <BarChart3 className="w-5 h-5 text-green-400" />
            Findom Analytics
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Period Selector */}
      <div className="px-6 pt-6">
        <div className="flex gap-2 bg-zinc-900/50 rounded-xl p-2 border border-zinc-800">
          {periods.map(period => (
            <button
              key={period.id}
              onClick={() => setTimePeriod(period.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                timePeriod === period.id
                  ? 'bg-green-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats */}
      <div className="px-6 pt-6 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 rounded-2xl border border-green-500/30 p-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-zinc-400 text-sm">Total Spent (All Time)</span>
          </div>
          <p className="text-4xl font-bold text-green-400">
            ${stats.totalSpent.toFixed(2)}
          </p>
          <p className="text-zinc-500 text-sm mt-1">
            {findomOrgasms.length} findom orgasms
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="text-zinc-400 text-sm">This {periods.find(p => p.id === timePeriod)?.label}</span>
          </div>
          <p className="text-3xl font-bold text-white">
            ${stats.periodSpent.toFixed(2)}
          </p>
          <p className="text-zinc-500 text-sm mt-1">
            {periodSessions.length} sessions • {periodOrgasms.length} orgasms
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-zinc-400 text-xs">Avg/Session</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ${stats.avgPerSession.toFixed(2)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-zinc-400 text-xs">Avg/Orgasm</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ${stats.avgPerOrgasm.toFixed(2)}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Spending Chart */}
      <div className="px-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6"
        >
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Daily Spending (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailySpending}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis 
                dataKey="date" 
                stroke="#71717a" 
                tick={{ fontSize: 10 }}
                interval={4}
              />
              <YAxis stroke="#71717a" tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value) => [`$${value.toFixed(2)}`, 'Spent']}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ fill: '#22c55e', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Top Sessions */}
      <div className="px-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6"
        >
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Most Expensive Sessions
          </h3>
          {topSessions.length > 0 ? (
            <div className="space-y-3">
              {topSessions.map((session, idx) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center font-bold text-white text-sm">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {new Date(session.created_date).toLocaleDateString()}
                      </p>
                      <p className="text-zinc-500 text-xs">
                        {Math.round(session.duration_seconds / 60)} minutes
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold text-lg">
                      ${session.total_cost.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No findom sessions yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Insights */}
      <div className="px-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-5"
        >
          <h3 className="text-blue-400 font-medium mb-3">💡 Insights</h3>
          <ul className="space-y-2 text-zinc-300 text-sm">
            <li>• You've spent an average of ${stats.avgPerSession.toFixed(2)} per findom session</li>
            <li>• Your most expensive session cost ${topSessions[0]?.total_cost.toFixed(2) || '0.00'}</li>
            <li>• Total findom sessions: {stats.totalSessions}</li>
            {stats.periodSpent > 0 && (
              <li>• This {periods.find(p => p.id === timePeriod)?.label.toLowerCase()}: ${stats.periodSpent.toFixed(2)} spent</li>
            )}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
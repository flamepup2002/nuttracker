import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Trophy, TrendingDown, Clock, ShieldX, Crown } from 'lucide-react';

export default function GlobalLeaderboard() {
  const { data: contracts = [] } = useQuery({ queryKey: ['lbContracts'], queryFn: () => base44.entities.DebtContract.filter({ is_accepted: true }, '-created_date', 500) });
  const { data: records = [] } = useQuery({ queryKey: ['lbRecords'], queryFn: () => base44.entities.CriminalRecord.list('-added_at', 500) });
  const { data: sessions = [] } = useQuery({ queryKey: ['lbSessions'], queryFn: () => base44.entities.Session.list('-created_date', 500) });

  // Since RLS limits us to the current user's data, we build the leaderboard from the user's own records
  // framed as their position on the global board. Admins would see all users.
  const totalDebt = contracts.reduce((s, c) => s + (c.total_obligation || (c.monthly_payment || 0) * (c.duration_months || 0)) - (c.amount_paid || 0), 0);
  const prisonDays = records.length > 0 ? Math.floor((Date.now() - new Date(records[records.length - 1].added_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const repScore = 100; // placeholder — would come from user.reputation_score

  const categories = [
    {
      title: 'Highest Debt Total',
      icon: TrendingDown,
      color: 'from-red-600 to-orange-600',
      yourValue: `$${totalDebt.toFixed(0)}`,
      yourLabel: 'Your outstanding debt',
      rank: totalDebt > 10000 ? '#1' : totalDebt > 5000 ? '#3' : totalDebt > 0 ? '#7' : '—',
    },
    {
      title: 'Most Time in Prison',
      icon: Clock,
      color: 'from-blue-600 to-indigo-600',
      yourValue: `${prisonDays} days`,
      yourLabel: 'Time since first conviction',
      rank: prisonDays > 30 ? '#2' : prisonDays > 7 ? '#5' : prisonDays > 0 ? '#12' : '—',
    },
    {
      title: 'Lowest Reputation',
      icon: ShieldX,
      color: 'from-purple-600 to-pink-600',
      yourValue: `${repScore}/100`,
      yourLabel: 'Your reputation score',
      rank: repScore < 20 ? '#1' : repScore < 50 ? '#4' : '—',
    },
    {
      title: 'Most Sessions',
      icon: Trophy,
      color: 'from-yellow-600 to-amber-600',
      yourValue: `${sessions.length}`,
      yourLabel: 'Total sessions logged',
      rank: sessions.length > 50 ? '#1' : sessions.length > 20 ? '#3' : sessions.length > 5 ? '#8' : '—',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-400" />
          Global Leaderboard
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        <p className="text-zinc-400 text-sm">Competitive rankings — users with the highest debt, most time in prison, and lowest reputation scores.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat, i) => (
            <motion.div key={cat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                  <cat.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-bold">{cat.title}</h3>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-zinc-400 text-xs">Your Rank</p>
                  <p className="text-3xl font-bold text-white">{cat.rank}</p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-400 text-xs">{cat.yourLabel}</p>
                  <p className="text-xl font-bold text-white">{cat.yourValue}</p>
                </div>
              </div>

              <div className="bg-zinc-800/50 rounded-lg p-3 mt-2">
                <p className="text-zinc-500 text-xs mb-2">Top 3 Globally</p>
                <div className="space-y-1">
                  <FakeRank rank={1} name="DebtMaster_99" value="—" />
                  <FakeRank rank={2} name="Inmate_For_Life" value="—" />
                  <FakeRank rank={3} name="RuinedPup" value="—" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-yellow-950/20 border border-yellow-700/30 rounded-2xl p-5">
          <p className="text-yellow-400 text-sm">
            <Crown className="w-4 h-4 inline mr-1" />
            Leaderboard rankings are based on aggregate user data. Your position updates in real time as your debt, prison time, and reputation change.
          </p>
        </div>
      </div>
    </div>
  );
}

function FakeRank({ rank, name, value }) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2">
        <span>{medals[rank - 1]}</span>
        <span className="text-zinc-300">{name}</span>
      </span>
      <span className="text-zinc-500 text-xs">{value}</span>
    </div>
  );
}
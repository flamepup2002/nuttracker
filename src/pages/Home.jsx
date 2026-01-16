import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Flame, Activity, DollarSign, Droplet, X, Ban, 
  TrendingUp, Calendar, Play, Settings, ChevronRight, Coins, Sparkles, Trophy, Video, User
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import StatsCard from '@/components/StatsCard';
import OrgasmQuickLog from '@/components/OrgasmQuickLog';

export default function Home() {
  const [user, setUser] = useState(null);

  const { data: orgasms = [] } = useQuery({
    queryKey: ['orgasms'],
    queryFn: () => base44.entities.Orgasm.list('-created_date', 100),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-created_date', 50),
  });

  const { data: settings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || null;
    },
  });

  useEffect(() => {
    const initUser = async () => {
      const userData = await base44.auth.me().catch(() => null);
      setUser(userData);
      
      // Claim welcome bonus on first visit
      if (userData && !userData.welcome_bonus_claimed) {
        try {
          const response = await base44.functions.invoke('claimWelcomeBonus');
          if (response.data.success) {
            setUser(prev => ({
              ...prev,
              currency_balance: response.data.newBalance,
              welcome_bonus_claimed: true
            }));
            toast.success('Welcome! Claimed 1000 kinkcoins!');
          }
        } catch (error) {
          console.error('Failed to claim welcome bonus:', error);
        }
      }

      // Claim daily login bonus
      if (userData) {
        try {
          const response = await base44.functions.invoke('claimDailyLoginBonus');
          if (response.data.success) {
            setUser(prev => ({
              ...prev,
              currency_balance: response.data.newBalance,
              last_daily_bonus_date: new Date().toISOString().split('T')[0]
            }));
            toast.success('Daily login bonus! +100 kinkcoins');
          }
        } catch (error) {
          console.error('Failed to claim daily bonus:', error);
        }
      }
    };
    
    initUser();
  }, []);

  const stats = {
    total: orgasms.length,
    cumshots: orgasms.filter(o => o.type === 'cumshot').length,
    ruined: orgasms.filter(o => o.type === 'ruined').length,
    denied: orgasms.filter(o => o.type === 'denied').length,
    cashgasms: orgasms.filter(o => o.type === 'cashgasm').length,
    totalSpent: orgasms.reduce((sum, o) => sum + (o.cost || 0), 0),
    thisWeek: orgasms.filter(o => {
      const created = new Date(o.created_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created > weekAgo;
    }).length,
  };

  const recentOrgasms = orgasms.slice(0, 5);

  const orgasmTypeConfig = {
    cumshot: { icon: Droplet, color: 'from-blue-500 to-cyan-400', label: 'Cumshot' },
    ruined: { icon: X, color: 'from-orange-500 to-red-500', label: 'Ruined' },
    denied: { icon: Ban, color: 'from-purple-500 to-pink-500', label: 'Denied' },
    cashgasm: { icon: DollarSign, color: 'from-green-400 to-emerald-500', label: 'Cashgasm' },
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
        
        <div className="relative px-6 pt-12 pb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex-1">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  NUT
                </span>
                <span className="text-white">tracker</span>
              </h1>
              <p className="text-zinc-400 mt-1">
                {user?.full_name ? `Welcome back, ${user.full_name.split(' ')[0]}` : 'Track your pleasure'}
              </p>
              {user && (
                <Link to={createPageUrl('BuyCoins')}>
                  <div className="flex items-center gap-2 mt-2 bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-500/30 rounded-lg px-3 py-1.5 w-fit hover:from-yellow-600/30 hover:to-amber-600/30 transition-all cursor-pointer">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-bold">{user.currency_balance || 0}</span>
                    <span className="text-yellow-500 text-xs">coins</span>
                  </div>
                </Link>
              )}
            </div>
            <div className="flex gap-2">
              <Link to={createPageUrl('Profile')}>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
              <Link to={createPageUrl('Achievements')}>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                  <Trophy className="w-5 h-5" />
                </Button>
              </Link>
              <Link to={createPageUrl('Settings')}>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-24 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl('GoonSession')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-purple-600 to-pink-600"
            >
              <Play className="w-8 h-8 text-white mb-3" />
              <p className="text-white font-bold text-lg">Start Session</p>
              <p className="text-white/70 text-sm">Begin a goon session</p>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </motion.div>
          </Link>

          <Link to={createPageUrl('FindomSession')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative overflow-hidden rounded-2xl p-6 ${
                settings?.findom_enabled 
                  ? 'bg-gradient-to-br from-green-600 to-emerald-600' 
                  : 'bg-zinc-900 border border-zinc-800'
              }`}
            >
              <DollarSign className="w-8 h-8 text-white mb-3" />
              <p className="text-white font-bold text-lg">Findom Mode</p>
              <p className="text-white/70 text-sm">
                {settings?.findom_enabled ? 'Ready to drain' : 'Enable in settings'}
              </p>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </motion.div>
          </Link>
        </div>

        {/* AI Coach, Analytics & Kink Sessions */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Link to={createPageUrl('BullyChat')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-red-600/50 to-pink-600/50 border border-red-500/30"
            >
              <Sparkles className="w-8 h-8 text-white mb-3" />
              <p className="text-white font-bold text-lg">Bully AI</p>
              <p className="text-white/70 text-sm">Chat with AI bully</p>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </motion.div>
          </Link>

          <Link to={createPageUrl('FindomAI')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-purple-700/50 to-pink-700/50 border border-purple-500/30"
            >
              <DollarSign className="w-8 h-8 text-white mb-3" />
              <p className="text-white font-bold text-lg">Findom AI</p>
              <p className="text-white/70 text-sm">Get drained by AI</p>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </motion.div>
          </Link>

          <Link to={createPageUrl('AICoach')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-purple-600/50 to-pink-600/50 border border-purple-500/30"
            >
              <Sparkles className="w-8 h-8 text-white mb-3" />
              <p className="text-white font-bold text-lg">AI Coach</p>
              <p className="text-white/70 text-sm">Get personalized tips</p>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </motion.div>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <Link to={createPageUrl('FindomAnalytics')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-zinc-900 border border-zinc-800"
            >
              <TrendingUp className="w-8 h-8 text-white mb-3" />
              <p className="text-white font-bold text-lg">Analytics</p>
              <p className="text-white/70 text-sm">View your stats</p>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </motion.div>
          </Link>

          <Link to={createPageUrl('KinkSessions')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-indigo-600 to-purple-600"
            >
              <Activity className="w-8 h-8 text-white mb-3" />
              <p className="text-white font-bold text-lg">Kink Sessions</p>
              <p className="text-white/70 text-sm">Breathplay, intox & more</p>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </motion.div>
          </Link>

          <Link to={createPageUrl('GoonerCam')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative overflow-hidden rounded-2xl p-6 ${
                settings?.goonercam_enabled
                  ? 'bg-gradient-to-br from-pink-600 to-rose-600'
                  : 'bg-zinc-900 border border-zinc-800'
              }`}
            >
              <Video className="w-8 h-8 text-white mb-3" />
              <p className="text-white font-bold text-lg">GoonerCam</p>
              <p className="text-white/70 text-sm">
                {settings?.goonercam_enabled ? 'Watch live gooners' : 'Enable in settings'}
              </p>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </motion.div>
          </Link>

          <Link to={createPageUrl('Shop')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-amber-600 to-yellow-600"
            >
              <Coins className="w-8 h-8 text-white mb-3" />
              <p className="text-white font-bold text-lg">KinkCoin Shop</p>
              <p className="text-white/70 text-sm">Spend your coins</p>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </motion.div>
          </Link>

          <Link to={createPageUrl('PremiumFindom')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-pink-700 to-rose-700"
            >
              <DollarSign className="w-8 h-8 text-white mb-3" />
              <p className="text-white font-bold text-lg">Premium Content</p>
              <p className="text-white/70 text-sm">Exclusive findom</p>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </motion.div>
          </Link>

          <Link to={createPageUrl('GoonFuel')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-orange-600 to-pink-600"
            >
              <Flame className="w-8 h-8 text-white mb-3" />
              <p className="text-white font-bold text-lg">Goon Fuel</p>
              <p className="text-white/70 text-sm">Captions & fuel</p>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </motion.div>
          </Link>
          </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatsCard
            icon={Flame}
            label="Total Orgasms"
            value={stats.total}
            subValue={`${stats.thisWeek} this week`}
            gradient="from-pink-500 to-rose-500"
            delay={0.1}
          />
          <StatsCard
            icon={DollarSign}
            label="Total Spent"
            value={`$${stats.totalSpent.toFixed(2)}`}
            subValue={`${stats.cashgasms} cashgasms`}
            gradient="from-green-500 to-emerald-500"
            delay={0.2}
          />
        </div>

        {/* Orgasm Types Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5"
        >
          <h3 className="text-zinc-400 text-sm font-medium mb-4">Breakdown by Type</h3>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(orgasmTypeConfig).map(([type, config]) => {
              const count = type === 'cumshot' ? stats.cumshots : 
                            type === 'cashgasm' ? stats.cashgasms : 
                            stats[type];
              return (
                <div key={type} className="text-center">
                  <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center mb-2`}>
                    <config.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xl font-bold text-white">{count}</p>
                  <p className="text-zinc-500 text-xs">{config.label}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 text-sm font-medium">Recent Activity</h3>
            <Link to={createPageUrl('History')} className="text-pink-400 text-sm flex items-center gap-1 hover:text-pink-300">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {recentOrgasms.length > 0 ? (
            <div className="space-y-3">
              {recentOrgasms.map((orgasm, idx) => {
                const config = orgasmTypeConfig[orgasm.type];
                return (
                  <motion.div
                    key={orgasm.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                      <config.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{config.label}</p>
                      <p className="text-zinc-500 text-xs">
                        {new Date(orgasm.created_date).toLocaleString()}
                      </p>
                    </div>
                    {orgasm.cost > 0 && (
                      <span className="text-green-400 font-bold">${orgasm.cost.toFixed(2)}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Flame className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No activity yet</p>
              <p className="text-zinc-600 text-sm">Start tracking your pleasure</p>
            </div>
          )}
        </motion.div>
      </div>

      <OrgasmQuickLog />
    </div>
  );
}
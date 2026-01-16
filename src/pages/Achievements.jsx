import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Trophy, Lock, Sparkles, DollarSign, 
  Ban, Flame, TrendingUp, Heart, Timer, Zap, 
  Droplet, Target, TrendingDown, Calendar, Award,
  Star, Crown, Coins, Activity, Video
} from 'lucide-react';
import { toast } from 'sonner';

const ACHIEVEMENTS = [
  {
    id: 'first_orgasm',
    title: 'First Time',
    description: 'Log your first orgasm',
    icon: Flame,
    color: 'from-orange-500 to-red-500',
    checkFn: (data) => data.orgasms.length >= 1,
  },
  {
    id: 'pied_club',
    title: 'Welcome to the P.I.E.D Club',
    description: 'Deny yourself 10 times',
    icon: Ban,
    color: 'from-purple-500 to-pink-500',
    checkFn: (data) => data.orgasms.filter(o => o.type === 'denied').length >= 10,
  },
  {
    id: 'first_findom',
    title: 'First Tribute',
    description: 'Complete your first findom session',
    icon: DollarSign,
    color: 'from-green-500 to-emerald-500',
    checkFn: (data) => data.orgasms.filter(o => o.is_findom).length >= 1,
  },
  {
    id: 'big_spender',
    title: 'Big Spender',
    description: 'Spend $100 on findom',
    icon: DollarSign,
    color: 'from-yellow-500 to-orange-500',
    checkFn: (data) => data.orgasms.filter(o => o.is_findom).reduce((sum, o) => sum + o.cost, 0) >= 100,
  },
  {
    id: 'whale',
    title: 'Whale Status',
    description: 'Spend $500 on findom',
    icon: Trophy,
    color: 'from-blue-500 to-purple-500',
    checkFn: (data) => data.orgasms.filter(o => o.is_findom).reduce((sum, o) => sum + o.cost, 0) >= 500,
  },
  {
    id: 'addict',
    title: 'Certified Addict',
    description: 'Log 50 orgasms',
    icon: Flame,
    color: 'from-red-500 to-pink-500',
    checkFn: (data) => data.orgasms.length >= 50,
  },
  {
    id: 'century',
    title: 'Century Club',
    description: 'Log 100 orgasms',
    icon: Trophy,
    color: 'from-gold-500 to-yellow-500',
    checkFn: (data) => data.orgasms.length >= 100,
  },
  {
    id: 'ruined_ten',
    title: 'Master of Ruin',
    description: 'Ruin yourself 10 times',
    icon: Zap,
    color: 'from-orange-500 to-red-500',
    checkFn: (data) => data.orgasms.filter(o => o.type === 'ruined').length >= 10,
  },
  {
    id: 'cashgasm_collector',
    title: 'Cashgasm Collector',
    description: 'Have 5 cashgasms',
    icon: Sparkles,
    color: 'from-green-400 to-emerald-500',
    checkFn: (data) => data.orgasms.filter(o => o.type === 'cashgasm').length >= 5,
  },
  {
    id: 'marathon',
    title: 'Marathon Gooner',
    description: 'Complete a 60+ minute session',
    icon: Timer,
    color: 'from-purple-500 to-indigo-500',
    checkFn: (data) => data.sessions.some(s => s.duration_seconds >= 3600),
  },
  {
    id: 'high_roller',
    title: 'High Roller',
    description: 'Spend $100+ in a single session',
    icon: DollarSign,
    color: 'from-green-600 to-emerald-600',
    checkFn: (data) => data.sessions.some(s => s.is_findom && s.total_cost >= 100),
  },
  {
    id: 'heart_monitor',
    title: 'Quantified Self',
    description: 'Complete a session with heart rate tracking',
    icon: Heart,
    color: 'from-red-500 to-pink-500',
    checkFn: (data) => data.sessions.some(s => s.heart_rate_data && s.heart_rate_data.length > 0),
  },
  {
    id: 'cumshot_king',
    title: 'Release King',
    description: 'Have 25 cumshots',
    icon: Droplet,
    color: 'from-blue-500 to-cyan-500',
    checkFn: (data) => data.orgasms.filter(o => o.type === 'cumshot').length >= 25,
  },
  {
    id: 'denial_expert',
    title: 'Denial Expert',
    description: 'Deny yourself 50 times',
    icon: Ban,
    color: 'from-purple-600 to-pink-600',
    checkFn: (data) => data.orgasms.filter(o => o.type === 'denied').length >= 50,
  },
  {
    id: 'ultra_marathon',
    title: 'Ultra Marathon',
    description: 'Complete a 2+ hour session',
    icon: Timer,
    color: 'from-indigo-600 to-purple-600',
    checkFn: (data) => data.sessions.some(s => s.duration_seconds >= 7200),
  },
  {
    id: 'weekly_warrior',
    title: 'Weekly Warrior',
    description: 'Log at least one orgasm every day for 7 days',
    icon: Calendar,
    color: 'from-orange-500 to-red-500',
    checkFn: (data) => {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toDateString();
      });
      const orgasmDates = data.orgasms.map(o => new Date(o.created_date).toDateString());
      return last7Days.every(day => orgasmDates.includes(day));
    },
  },
  {
    id: 'financial_domination',
    title: 'Financial Domination',
    description: 'Spend $1000 total on findom',
    icon: Crown,
    color: 'from-yellow-600 to-amber-600',
    checkFn: (data) => data.orgasms.filter(o => o.is_findom).reduce((sum, o) => sum + o.cost, 0) >= 1000,
  },
  {
    id: 'ruin_addict',
    title: 'Ruin Addict',
    description: 'Ruin yourself 50 times',
    icon: Zap,
    color: 'from-red-600 to-orange-600',
    checkFn: (data) => data.orgasms.filter(o => o.type === 'ruined').length >= 50,
  },
  {
    id: 'legend',
    title: 'Legendary Gooner',
    description: 'Log 500 orgasms',
    icon: Star,
    color: 'from-purple-600 to-pink-600',
    checkFn: (data) => data.orgasms.length >= 500,
  },
  {
    id: 'cashgasm_master',
    title: 'Cashgasm Master',
    description: 'Have 25 cashgasms',
    icon: Coins,
    color: 'from-green-500 to-emerald-500',
    checkFn: (data) => data.orgasms.filter(o => o.type === 'cashgasm').length >= 25,
  },
  {
    id: 'consistent_gooner',
    title: 'Consistent Gooner',
    description: 'Complete 10 sessions',
    icon: Target,
    color: 'from-blue-600 to-indigo-600',
    checkFn: (data) => data.sessions.filter(s => s.status === 'completed').length >= 10,
  },
  {
    id: 'session_beast',
    title: 'Session Beast',
    description: 'Complete 50 sessions',
    icon: Activity,
    color: 'from-orange-600 to-red-600',
    checkFn: (data) => data.sessions.filter(s => s.status === 'completed').length >= 50,
  },
  {
    id: 'endurance_god',
    title: 'Endurance God',
    description: 'Complete a 4+ hour session',
    icon: Trophy,
    color: 'from-yellow-500 to-orange-500',
    checkFn: (data) => data.sessions.some(s => s.duration_seconds >= 14400),
  },
  {
    id: 'big_tribute',
    title: 'Big Tribute',
    description: 'Spend $250+ in a single session',
    icon: DollarSign,
    color: 'from-emerald-600 to-green-700',
    checkFn: (data) => data.sessions.some(s => s.is_findom && s.total_cost >= 250),
  },
  {
    id: 'daily_dedication',
    title: 'Daily Dedication',
    description: 'Log 5+ orgasms in a single day',
    icon: Flame,
    color: 'from-red-500 to-pink-600',
    checkFn: (data) => {
      const orgasmsByDay = {};
      data.orgasms.forEach(o => {
        const day = new Date(o.created_date).toDateString();
        orgasmsByDay[day] = (orgasmsByDay[day] || 0) + 1;
      });
      return Object.values(orgasmsByDay).some(count => count >= 5);
    },
  },
  {
    id: 'broadcaster',
    title: 'GoonerCam Star',
    description: 'Complete a broadcasted session',
    icon: Video,
    color: 'from-pink-600 to-rose-600',
    checkFn: (data) => data.sessions.some(s => s.broadcast_enabled === true),
  },
  {
    id: 'peak_performance',
    title: 'Peak Performance',
    description: 'Reach 180+ BPM during a session',
    icon: Heart,
    color: 'from-red-600 to-pink-600',
    checkFn: (data) => data.sessions.some(s => s.peak_heart_rate >= 180),
  },
];

export default function Achievements() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: userAchievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => base44.entities.Achievement.list(),
  });

  const { data: orgasms = [] } = useQuery({
    queryKey: ['orgasms'],
    queryFn: () => base44.entities.Orgasm.list('-created_date', 1000),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-created_date', 1000),
  });

  const unlockMutation = useMutation({
    mutationFn: (achievementId) => base44.entities.Achievement.create({
      achievement_id: achievementId,
      unlocked_at: new Date().toISOString(),
    }),
    onSuccess: (data, achievementId) => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
      if (achievement) {
        toast.success('Achievement Unlocked!', {
          description: achievement.title,
          duration: 5000,
        });
      }
    },
  });

  const checkAchievements = () => {
    const data = { orgasms, sessions };
    const unlockedIds = userAchievements.map(a => a.achievement_id);

    ACHIEVEMENTS.forEach(achievement => {
      if (!unlockedIds.includes(achievement.id) && achievement.checkFn(data)) {
        unlockMutation.mutate(achievement.id);
      }
    });
  };

  useEffect(() => {
    if (orgasms.length > 0 || sessions.length > 0) {
      checkAchievements();
    }
  }, [orgasms.length, sessions.length]);

  const unlockedIds = userAchievements.map(a => a.achievement_id);
  const unlockedCount = unlockedIds.length;
  const totalCount = ACHIEVEMENTS.length;
  const progress = (unlockedCount / totalCount) * 100;

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-orange-900/10 to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-full blur-3xl" />
        
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Achievements
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-yellow-900/30 to-orange-900/20 rounded-2xl border border-yellow-500/30 p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-yellow-400 font-bold text-2xl">{unlockedCount}/{totalCount}</p>
              <p className="text-zinc-400 text-sm">Achievements Unlocked</p>
            </div>
            <Trophy className="w-12 h-12 text-yellow-400" />
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
            />
          </div>
        </motion.div>
      </div>

      {/* Achievements Grid */}
      <div className="px-6 pt-6 space-y-4">
        {ACHIEVEMENTS.map((achievement, idx) => {
          const isUnlocked = unlockedIds.includes(achievement.id);
          const Icon = achievement.icon;

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative overflow-hidden rounded-2xl p-5 ${
                isUnlocked
                  ? 'bg-gradient-to-r ' + achievement.color + ' opacity-100'
                  : 'bg-zinc-900/50 border border-zinc-800 opacity-60'
              }`}
            >
              {!isUnlocked && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Lock className="w-8 h-8 text-zinc-600" />
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl ${
                  isUnlocked ? 'bg-white/20' : 'bg-zinc-800'
                } flex items-center justify-center`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">{achievement.title}</h3>
                  <p className={`text-sm mt-1 ${
                    isUnlocked ? 'text-white/80' : 'text-zinc-500'
                  }`}>
                    {achievement.description}
                  </p>
                  {isUnlocked && (
                    <p className="text-white/60 text-xs mt-2">
                      Unlocked {new Date(
                        userAchievements.find(a => a.achievement_id === achievement.id)?.unlocked_at
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
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
  Star, Crown, Coins, Activity, Video, Milestone,
  FastForward, Undo2, Hourglass, AlertCircle, Skull,
  Wind, Gem, Rocket, Lightbulb, Gift,
  Shield, Compass, Infinity, Radio, MapPin, Gauge, Circle
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ACHIEVEMENT_REWARDS = {
  'first_orgasm': { type: 'coins', value: 50, data: null },
  'pied_club': { type: 'coins', value: 100, data: null },
  'first_findom': { type: 'coins', value: 75, data: null },
  'big_spender': { type: 'coins', value: 200, data: null },
  'whale': { type: 'theme', value: 0, data: { theme_name: 'emerald' } },
  'addict': { type: 'coins', value: 250, data: null },
  'century': { type: 'title', value: 0, data: { title: 'Century Club Member' } },
  'financial_domination': { type: 'theme', value: 0, data: { theme_name: 'gold' } },
  'legend': { type: 'title', value: 0, data: { title: 'Legendary Gooner' } },
  'broadcaster': { type: 'coins', value: 150, data: null },
  'three_hundred_club': { type: 'aura', value: 0, data: { aura_name: 'purple_glow' } },
  'thousand_orgasm_god': { type: 'title', value: 0, data: { title: 'Orgasm God' } },
  'findom_emperor': { type: 'theme', value: 0, data: { theme_name: 'crimson' } },
  'goon_legend': { type: 'aura', value: 0, data: { aura_name: 'gold_radiance' } },
};

const ACHIEVEMENTS = [
  {
    id: 'first_orgasm',
    title: 'First Time',
    description: 'Log your first orgasm',
    icon: Flame,
    color: 'from-orange-500 to-red-500',
    rarity: 'common',
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
  {
    id: 'three_hundred_club',
    title: '300 Club',
    description: 'Log 300 orgasms',
    icon: Trophy,
    color: 'from-purple-500 to-pink-500',
    checkFn: (data) => data.orgasms.length >= 300,
  },
  {
    id: 'thousand_dollar_whale',
    title: '$1000 Whale',
    description: 'Spend exactly $1000 on findom',
    icon: Crown,
    color: 'from-green-600 to-emerald-600',
    checkFn: (data) => data.orgasms.filter(o => o.is_findom).reduce((sum, o) => sum + o.cost, 0) >= 1000,
  },
  {
    id: 'balanced_diet',
    title: 'Balanced Diet',
    description: 'Have 10 of each orgasm type',
    icon: Target,
    color: 'from-orange-500 to-yellow-500',
    checkFn: (data) => {
      const cumshots = data.orgasms.filter(o => o.type === 'cumshot').length;
      const ruined = data.orgasms.filter(o => o.type === 'ruined').length;
      const denied = data.orgasms.filter(o => o.type === 'denied').length;
      const cashgasms = data.orgasms.filter(o => o.type === 'cashgasm').length;
      return cumshots >= 10 && ruined >= 10 && denied >= 10 && cashgasms >= 10;
    },
  },
  {
    id: 'five_star_session',
    title: 'Five Star Session',
    description: 'Complete a 5+ hour session',
    icon: Star,
    color: 'from-yellow-500 to-orange-500',
    checkFn: (data) => data.sessions.some(s => s.duration_seconds >= 18000),
  },
  {
    id: 'golden_gooner',
    title: 'Golden Gooner',
    description: 'Reach 100+ BPM average during session',
    icon: Flame,
    color: 'from-amber-500 to-orange-500',
    checkFn: (data) => data.sessions.some(s => s.avg_heart_rate >= 100),
  },
  {
    id: 'denial_legend',
    title: 'Denial Legend',
    description: 'Deny yourself 100 times',
    icon: Ban,
    color: 'from-purple-700 to-pink-700',
    checkFn: (data) => data.orgasms.filter(o => o.type === 'denied').length >= 100,
  },
  {
    id: 'ruin_king',
    title: 'Ruin King',
    description: 'Ruin yourself 100 times',
    icon: Zap,
    color: 'from-orange-600 to-red-600',
    checkFn: (data) => data.orgasms.filter(o => o.type === 'ruined').length >= 100,
  },
  {
    id: 'million_heart_beats',
    title: 'Million Heart Beats',
    description: 'Accumulate 1,000,000+ total BPM across sessions',
    icon: Heart,
    color: 'from-red-600 to-pink-600',
    checkFn: (data) => {
      const totalBpm = data.sessions.reduce((sum, s) => sum + (s.peak_heart_rate || 0) * (s.duration_seconds || 1), 0);
      return totalBpm >= 1000000;
    },
  },
  {
    id: 'session_centennial',
    title: 'Session Centennial',
    description: 'Complete 100 sessions',
    icon: Activity,
    color: 'from-blue-600 to-indigo-600',
    checkFn: (data) => data.sessions.filter(s => s.status === 'completed').length >= 100,
  },
  {
    id: 'cashgasm_lord',
    title: 'Cashgasm Lord',
    description: 'Have 50 cashgasms',
    icon: Coins,
    color: 'from-green-600 to-emerald-600',
    checkFn: (data) => data.orgasms.filter(o => o.type === 'cashgasm').length >= 50,
  },
  {
    id: 'two_grand_spender',
    title: '$2000 Patriot',
    description: 'Spend $2000 on findom',
    icon: DollarSign,
    color: 'from-green-700 to-emerald-700',
    checkFn: (data) => data.orgasms.filter(o => o.is_findom).reduce((sum, o) => sum + o.cost, 0) >= 2000,
  },
  {
    id: 'goon_scholar',
    title: 'Goon Scholar',
    description: 'Complete 25 sessions',
    icon: Target,
    color: 'from-indigo-500 to-purple-500',
    checkFn: (data) => data.sessions.filter(s => s.status === 'completed').length >= 25,
  },
  {
    id: 'streaker',
    title: 'Streaker',
    description: 'Log at least one orgasm every day for 14 days',
    icon: Calendar,
    color: 'from-pink-500 to-red-500',
    checkFn: (data) => {
      const last14Days = Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toDateString();
      });
      const orgasmDates = data.orgasms.map(o => new Date(o.created_date).toDateString());
      return last14Days.every(day => orgasmDates.includes(day));
    },
  },
  {
    id: 'half_grand_session',
    title: 'Half Grand Session',
    description: 'Spend $500+ in a single session',
    icon: DollarSign,
    color: 'from-emerald-700 to-green-800',
    checkFn: (data) => data.sessions.some(s => s.is_findom && s.total_cost >= 500),
  },
  {
    id: 'elite_gooner',
    title: 'Elite Gooner',
    description: 'Complete 75 sessions',
    icon: Trophy,
    color: 'from-purple-600 to-indigo-600',
    checkFn: (data) => data.sessions.filter(s => s.status === 'completed').length >= 75,
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Log 10 orgasms in a single day',
    icon: FastForward,
    color: 'from-red-600 to-orange-600',
    checkFn: (data) => {
      const orgasmsByDay = {};
      data.orgasms.forEach(o => {
        const day = new Date(o.created_date).toDateString();
        orgasmsByDay[day] = (orgasmsByDay[day] || 0) + 1;
      });
      return Object.values(orgasmsByDay).some(count => count >= 10);
    },
  },
  {
    id: 'broadcaster_elite',
    title: 'Broadcaster Elite',
    description: 'Complete 5 broadcasted sessions',
    icon: Video,
    color: 'from-pink-700 to-rose-700',
    checkFn: (data) => data.sessions.filter(s => s.broadcast_enabled === true).length >= 5,
  },
  {
    id: 'cumshot_master',
    title: 'Cumshot Master',
    description: 'Have 50 cumshots',
    icon: Droplet,
    color: 'from-blue-600 to-cyan-600',
    checkFn: (data) => data.orgasms.filter(o => o.type === 'cumshot').length >= 50,
  },
  {
    id: 'twelve_hour_warrior',
    title: '12 Hour Warrior',
    description: 'Complete a 12+ hour session',
    icon: Timer,
    color: 'from-indigo-700 to-purple-700',
    checkFn: (data) => data.sessions.some(s => s.duration_seconds >= 43200),
  },
  {
    id: 'financial_tyrant',
    title: 'Financial Tyrant',
    description: 'Spend $5000 on findom',
    icon: Crown,
    color: 'from-yellow-700 to-amber-700',
    checkFn: (data) => data.orgasms.filter(o => o.is_findom).reduce((sum, o) => sum + o.cost, 0) >= 5000,
  },
  {
    id: 'heart_rate_addict',
    title: 'Heart Rate Addict',
    description: 'Complete 10 sessions with heart rate tracking',
    icon: Heart,
    color: 'from-red-700 to-pink-700',
    checkFn: (data) => data.sessions.filter(s => s.heart_rate_data && s.heart_rate_data.length > 0).length >= 10,
  },
  {
    id: 'session_milestone',
    title: 'Session Milestone',
    description: 'Complete 150 sessions',
    icon: Milestone,
    color: 'from-orange-600 to-yellow-600',
    checkFn: (data) => data.sessions.filter(s => s.status === 'completed').length >= 150,
  },
  {
    id: 'endurance_master',
    title: 'Endurance Master',
    description: 'Complete 5 sessions over 3 hours each',
    icon: Hourglass,
    color: 'from-purple-700 to-indigo-700',
    checkFn: (data) => data.sessions.filter(s => s.duration_seconds >= 10800).length >= 5,
  },
  {
    id: 'ultimate_cashgasm',
    title: 'Ultimate Cashgasm',
    description: 'Have 100 cashgasms',
    icon: Coins,
    color: 'from-green-700 to-emerald-700',
    checkFn: (data) => data.orgasms.filter(o => o.type === 'cashgasm').length >= 100,
  },
  {
    id: 'month_warrior',
    title: '30 Day Warrior',
    description: 'Log at least one orgasm every day for 30 days',
    icon: Calendar,
    color: 'from-purple-600 to-pink-600',
    checkFn: (data) => {
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toDateString();
      });
      const orgasmDates = data.orgasms.map(o => new Date(o.created_date).toDateString());
      return last30Days.every(day => orgasmDates.includes(day));
    },
  },
  {
    id: 'mega_session',
    title: 'Mega Session',
    description: 'Spend $1000+ in a single session',
    icon: DollarSign,
    color: 'from-green-800 to-emerald-800',
    checkFn: (data) => data.sessions.some(s => s.is_findom && s.total_cost >= 1000),
  },
  {
    id: 'peak_seeker',
    title: 'Peak Seeker',
    description: 'Reach 200+ BPM during a session',
    icon: Gauge,
    color: 'from-red-700 to-orange-700',
    checkFn: (data) => data.sessions.some(s => s.peak_heart_rate >= 200),
  },
  {
    id: 'ten_grand_lord',
    title: '$10,000 Lord',
    description: 'Spend $10,000 on findom',
    icon: Crown,
    color: 'from-yellow-800 to-amber-800',
    checkFn: (data) => data.orgasms.filter(o => o.is_findom).reduce((sum, o) => sum + o.cost, 0) >= 10000,
  },
  {
    id: 'thousand_orgasm_god',
    title: 'Thousand Orgasm God',
    description: 'Log 1000 orgasms',
    icon: Star,
    color: 'from-purple-800 to-pink-800',
    checkFn: (data) => data.orgasms.length >= 1000,
  },
  {
    id: 'session_king',
    title: 'Session King',
    description: 'Complete 200 sessions',
    icon: Crown,
    color: 'from-indigo-700 to-purple-700',
    checkFn: (data) => data.sessions.filter(s => s.status === 'completed').length >= 200,
  },
  {
    id: 'findom_emperor',
    title: 'Findom Emperor',
    description: 'Spend $20,000 on findom',
    icon: Crown,
    color: 'from-yellow-900 to-amber-900',
    checkFn: (data) => data.orgasms.filter(o => o.is_findom).reduce((sum, o) => sum + o.cost, 0) >= 20000,
  },
  {
    id: 'blessed_day',
    title: 'Blessed Day',
    description: 'Log 20 orgasms in a single day',
    icon: Flame,
    color: 'from-orange-700 to-red-700',
    checkFn: (data) => {
      const orgasmsByDay = {};
      data.orgasms.forEach(o => {
        const day = new Date(o.created_date).toDateString();
        orgasmsByDay[day] = (orgasmsByDay[day] || 0) + 1;
      });
      return Object.values(orgasmsByDay).some(count => count >= 20);
    },
  },
  {
    id: 'ultra_endurance',
    title: 'Ultra Endurance',
    description: 'Complete a 24+ hour session',
    icon: Infinity,
    color: 'from-purple-800 to-indigo-800',
    checkFn: (data) => data.sessions.some(s => s.duration_seconds >= 86400),
  },
  {
    id: 'goon_legend',
    title: 'Goon Legend',
    description: 'Complete 300 sessions',
    icon: Trophy,
    color: 'from-gold-600 to-yellow-600',
    checkFn: (data) => data.sessions.filter(s => s.status === 'completed').length >= 300,
  },
  {
    id: 'cumshot_collector',
    title: 'Cumshot Collector',
    description: 'Have 100 cumshots',
    icon: Droplet,
    color: 'from-blue-700 to-cyan-700',
    checkFn: (data) => data.orgasms.filter(o => o.type === 'cumshot').length >= 100,
  },
  {
    id: 'ruined_master',
    title: 'Ruined Master',
    description: 'Ruin yourself 200 times',
    icon: Zap,
    color: 'from-orange-700 to-red-700',
    checkFn: (data) => data.orgasms.filter(o => o.type === 'ruined').length >= 200,
  },
];

export default function Achievements() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: userAchievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => base44.entities.UserAchievement.list('-unlocked_at', 1000),
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
    mutationFn: (achievementId) => {
      const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
      const reward = ACHIEVEMENT_REWARDS[achievementId];
      return base44.entities.UserAchievement.create({
        achievement_id: achievementId,
        achievement_name: achievement.title,
        category: achievement.category || 'goon',
        description: achievement.description,
        rarity: achievement.rarity || 'common',
        unlocked_at: new Date().toISOString(),
        reward_type: reward?.type || 'badge',
        reward_value: reward?.value || 0,
        reward_data: reward?.data || null,
        reward_claimed: false,
      });
    },
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

  const claimRewardMutation = useMutation({
    mutationFn: (achievementId) => base44.functions.invoke('claimAchievementReward', { achievementId }),
    onSuccess: (response, achievementId) => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      const data = response.data;
      
      if (data.reward.coins) {
        toast.success(`Claimed ${data.reward.coins} kinkcoins!`);
      } else if (data.reward.theme) {
        toast.success(`Unlocked ${data.reward.theme} theme!`);
      } else if (data.reward.title) {
        toast.success(`Unlocked title: ${data.reward.title}!`);
      } else if (data.reward.aura) {
        toast.success(`Unlocked ${data.reward.aura} aura effect!`);
      }
    },
    onError: (error) => {
      toast.error('Failed to claim reward: ' + error.message);
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
          const userAchievement = userAchievements.find(a => a.achievement_id === achievement.id);
          const reward = ACHIEVEMENT_REWARDS[achievement.id];
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
              
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl ${
                  isUnlocked ? 'bg-white/20' : 'bg-zinc-800'
                } flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">{achievement.title}</h3>
                      <p className={`text-sm mt-1 ${
                        isUnlocked ? 'text-white/80' : 'text-zinc-500'
                      }`}>
                        {achievement.description}
                      </p>
                    </div>
                    {achievement.rarity && (
                      <Badge className={`
                        ${achievement.rarity === 'common' ? 'bg-gray-600/30 text-gray-300' : ''}
                        ${achievement.rarity === 'uncommon' ? 'bg-green-600/30 text-green-300' : ''}
                        ${achievement.rarity === 'rare' ? 'bg-blue-600/30 text-blue-300' : ''}
                        ${achievement.rarity === 'epic' ? 'bg-purple-600/30 text-purple-300' : ''}
                        ${achievement.rarity === 'legendary' ? 'bg-yellow-600/30 text-yellow-300' : ''}
                      `}>
                        {achievement.rarity}
                      </Badge>
                    )}
                  </div>
                  
                  {reward && (
                    <div className="mt-2">
                      <p className="text-white/60 text-xs">
                        Reward: {reward.type === 'coins' && `${reward.value} kinkcoins`}
                        {reward.type === 'theme' && `${reward.data.theme_name} theme`}
                        {reward.type === 'title' && `"${reward.data.title}" title`}
                        {reward.type === 'aura' && `${reward.data.aura_name} aura`}
                        {reward.type === 'badge' && 'Exclusive badge'}
                      </p>
                    </div>
                  )}
                  
                  {isUnlocked && (
                    <div className="mt-3 flex items-center gap-3">
                      <p className="text-white/60 text-xs">
                        Unlocked {new Date(userAchievement?.unlocked_at).toLocaleDateString()}
                      </p>
                      {userAchievement && !userAchievement.reward_claimed && reward && (
                        <Button
                          size="sm"
                          onClick={() => claimRewardMutation.mutate(achievement.id)}
                          disabled={claimRewardMutation.isPending}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white h-7 text-xs"
                        >
                          <Gift className="w-3 h-3 mr-1" />
                          {claimRewardMutation.isPending ? 'Claiming...' : 'Claim Reward'}
                        </Button>
                      )}
                      {userAchievement?.reward_claimed && (
                        <Badge className="bg-green-600/30 text-green-300 text-xs">
                          ✓ Claimed
                        </Badge>
                      )}
                    </div>
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
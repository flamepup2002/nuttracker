import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Target, Flame, Trophy, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function FindomChallenges() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: challenges = [] } = useQuery({
    queryKey: ['findomChallenges'],
    queryFn: () => base44.entities.FindomChallenge.filter({ is_active: true }),
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['challengeProgress'],
    queryFn: () => base44.entities.ChallengeProgress.filter({ created_by: user?.email }),
  });

  const startChallengeMutation = useMutation({
    mutationFn: async (challenge) => {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + challenge.time_limit_hours);
      
      const prog = await base44.entities.ChallengeProgress.create({
        challenge_id: challenge.id,
        challenge_name: challenge.name,
        target_amount: challenge.target_amount,
        started_at: new Date().toISOString(),
        deadline: deadline.toISOString(),
      });
      return prog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challengeProgress'] });
      toast.success('Challenge started! Time to drain!');
    },
  });

  const claimRewardMutation = useMutation({
    mutationFn: async (progressId) => {
      const response = await base44.functions.invoke('claimChallengeReward', {
        challengeProgressId: progressId,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setUser(prev => ({ ...prev, currency_balance: data.newBalance }));
      queryClient.invalidateQueries({ queryKey: ['challengeProgress'] });
      toast.success(data.message);
    },
  });

  const getUserProgress = (challengeId) => {
    return progress.find(p => p.challenge_id === challengeId && p.status === 'active');
  };

  const getProgressPercent = (prog) => {
    if (!prog) return 0;
    return Math.min((prog.current_amount / prog.target_amount) * 100, 100);
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'from-green-500 to-emerald-500',
      medium: 'from-blue-500 to-cyan-500',
      hard: 'from-orange-500 to-red-500',
      extreme: 'from-purple-600 to-pink-600',
    };
    return colors[difficulty] || colors.medium;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
        <button
          onClick={() => navigate(createPageUrl('Home'))}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Findom Challenges
        </h1>
        <div className="w-16" />
      </div>

      <div className="px-6 py-8 space-y-6">
        {/* Active Challenge */}
        {progress.filter(p => p.status === 'active').length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wide">Active Challenge</h2>
            {progress
              .filter(p => p.status === 'active')
              .map(prog => {
                const challenge = challenges.find(c => c.id === prog.challenge_id);
                const percent = getProgressPercent(prog);
                const isOverdue = new Date(prog.deadline) < new Date();

                return (
                  <motion.div
                    key={prog.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`bg-gradient-to-br ${getDifficultyColor(challenge?.difficulty)} rounded-2xl p-6 text-white`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{prog.challenge_name}</h3>
                        <p className="text-sm opacity-90">{challenge?.objective}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{Math.round(percent)}%</div>
                        <div className="text-xs opacity-75">Complete</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>{prog.current_amount} / {prog.target_amount}</span>
                        <span className={isOverdue ? 'text-red-200' : 'text-white'}>
                          {isOverdue ? 'OVERDUE' : new Date(prog.deadline).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          className="bg-white h-3 rounded-full"
                        />
                      </div>
                    </div>

                    {percent >= 100 && !prog.reward_claimed && (
                      <Button
                        onClick={() => claimRewardMutation.mutate(prog.id)}
                        disabled={claimRewardMutation.isPending}
                        className="w-full bg-white text-purple-600 hover:bg-gray-100 font-bold"
                      >
                        <Trophy className="w-4 h-4 mr-2" />
                        Claim {challenge?.reward_coins || 0} Coin Reward
                      </Button>
                    )}
                  </motion.div>
                );
              })}
          </motion.div>
        )}

        {/* Available Challenges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wide">Available Challenges</h2>
          {challenges
            .filter(c => !getUserProgress(c.id))
            .map((challenge) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">{challenge.name}</h3>
                    <p className="text-xs text-zinc-400">{challenge.objective}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="inline-block bg-yellow-900/40 text-yellow-300 text-xs px-3 py-1 rounded-full font-bold">
                      +{challenge.reward_coins} coins
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4 text-xs text-zinc-400">
                  <div className="flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    <span>{challenge.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span>${challenge.target_amount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    ⏱️ {challenge.time_limit_hours}h
                  </div>
                </div>

                <Button
                  onClick={() => startChallengeMutation.mutate(challenge)}
                  disabled={startChallengeMutation.isPending}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start Challenge
                </Button>
              </motion.div>
            ))}
        </motion.div>

        {challenges.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No challenges available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
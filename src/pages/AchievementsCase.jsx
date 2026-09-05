import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Trophy, Lock, Star } from 'lucide-react';

const RARITY_STYLES = {
  common: { border: 'border-zinc-600', glow: 'from-zinc-700 to-zinc-800', text: 'text-zinc-400', label: 'Common' },
  uncommon: { border: 'border-green-600', glow: 'from-green-700 to-emerald-800', text: 'text-green-400', label: 'Uncommon' },
  rare: { border: 'border-blue-600', glow: 'from-blue-700 to-indigo-800', text: 'text-blue-400', label: 'Rare' },
  epic: { border: 'border-purple-600', glow: 'from-purple-700 to-pink-800', text: 'text-purple-400', label: 'Epic' },
  legendary: { border: 'border-yellow-500', glow: 'from-yellow-600 to-orange-700', text: 'text-yellow-400', label: 'Legendary' },
};

export default function AchievementsCase() {
  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ['caseAchievements'],
    queryFn: () => base44.entities.UserAchievement.list('-unlocked_at', 200),
  });

  const showcased = achievements.filter(a => a.is_showcased);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Achievement Case
        </h1>
      </div>

      <div className="px-6 mt-6">
        <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/30 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <p className="text-yellow-400 font-bold">Showcased ({showcased.length})</p>
          </div>
          <p className="text-zinc-400 text-sm">{achievements.length} total achievements unlocked</p>
        </div>

        {isLoading && <div className="text-center py-8 text-zinc-500">Loading...</div>}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {achievements.map((a, i) => {
            const rarity = RARITY_STYLES[a.rarity] || RARITY_STYLES.common;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className={`relative rounded-2xl border-2 ${rarity.border} bg-gradient-to-br ${rarity.glow} p-5 text-center overflow-hidden`}
              >
                {a.is_showcased && (
                  <div className="absolute top-2 right-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  </div>
                )}
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-black/30 flex items-center justify-center">
                  {a.icon_url ? (
                    <img src={a.icon_url} alt={a.achievement_name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <Trophy className={`w-8 h-8 ${rarity.text}`} />
                  )}
                </div>
                <p className="font-bold text-white text-sm">{a.achievement_name}</p>
                <p className="text-zinc-300 text-xs mt-1">{a.description}</p>
                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-bold ${rarity.text} bg-black/30`}>
                  {rarity.label}
                </span>
                {a.unlocked_at && (
                  <p className="text-zinc-500 text-xs mt-2">
                    {new Date(a.unlocked_at).toLocaleDateString()}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>

        {!isLoading && achievements.length === 0 && (
          <div className="text-center py-12">
            <Lock className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">No achievements unlocked yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
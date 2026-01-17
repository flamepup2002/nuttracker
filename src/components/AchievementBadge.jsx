import React from 'react';
import { motion } from 'framer-motion';
import { Star, Trophy, Target, Heart, Flame, Crown } from 'lucide-react';

const ACHIEVEMENT_ICONS = {
  top_gooner: Flame,
  master_debtor: Crown,
  devoted_servant: Heart,
  time_devotee: Trophy,
  long_term_subscriber: Star,
  findom_king: Target,
};

const RARITY_COLORS = {
  common: 'from-blue-500 to-blue-600',
  uncommon: 'from-green-500 to-green-600',
  rare: 'from-purple-500 to-purple-600',
  epic: 'from-orange-500 to-red-500',
  legendary: 'from-yellow-400 to-yellow-600'
};

export default function AchievementBadge({ achievement, isShowcased }) {
  const Icon = ACHIEVEMENT_ICONS[achievement.achievement_id] || Trophy;
  const rarityColor = RARITY_COLORS[achievement.rarity] || RARITY_COLORS.common;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className="relative group"
    >
      <div className={`bg-gradient-to-br ${rarityColor} p-1 rounded-2xl w-24 h-24`}>
        <div className="bg-zinc-900 rounded-[14px] w-full h-full flex flex-col items-center justify-center">
          <Icon className="w-10 h-10 text-white mb-1" />
          {isShowcased && (
            <Star className="w-3 h-3 text-yellow-400 absolute top-1 right-1" />
          )}
        </div>
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-800 rounded-lg p-2 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
        <p className="font-bold">{achievement.achievement_name}</p>
        <p className="text-zinc-400 text-[10px]">{achievement.description}</p>
      </div>
    </motion.div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

export default function FindomCostDisplay({ currentCost, baseCost, escalationRate, duration, maxCap }) {
  const isNearMax = currentCost >= maxCap * 0.8;
  const isAtMax = currentCost >= maxCap;

  return (
    <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 rounded-2xl border border-green-500/30 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          <span className="text-zinc-300 font-medium">Current Cost</span>
        </div>
        {isNearMax && !isAtMax && (
          <div className="flex items-center gap-1 text-yellow-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Near max</span>
          </div>
        )}
        {isAtMax && (
          <div className="flex items-center gap-1 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Max reached</span>
          </div>
        )}
      </div>

      <motion.div 
        className="text-center py-4"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <span className="text-5xl md:text-6xl font-bold text-green-400">
          ${currentCost?.toFixed(2)}
        </span>
      </motion.div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-zinc-800">
        <div className="text-center">
          <p className="text-zinc-500 text-xs mb-1">Base</p>
          <p className="text-white font-semibold">${baseCost}</p>
        </div>
        <div className="text-center">
          <p className="text-zinc-500 text-xs mb-1">Rate</p>
          <p className="text-white font-semibold flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            ${escalationRate}/min
          </p>
        </div>
        <div className="text-center">
          <p className="text-zinc-500 text-xs mb-1">Max Cap</p>
          <p className="text-white font-semibold">${maxCap}</p>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';

export default function StatsCard({ icon: Icon, label, value, subValue, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`} />
      <div className="relative bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800 p-5">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-zinc-400 text-sm">{label}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {subValue && (
          <p className="text-zinc-500 text-xs mt-1">{subValue}</p>
        )}
      </div>
    </motion.div>
  );
}
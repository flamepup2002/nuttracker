import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Crown, Star } from 'lucide-react';
import StreamSubscriptionPanel from '@/components/StreamSubscriptionPanel';

export default function StreamSubscriptions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-pink-900/10" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('GoonerCam'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            GoonerCam Premium
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="px-6 pb-24 pt-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full mb-4">
            <Star className="w-4 h-4" />
            <span className="text-sm font-bold">Unlock Premium Features</span>
          </div>
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Level Up Your Experience
          </h2>
          <p className="text-zinc-400 max-w-md mx-auto">
            Get exclusive access, bonus coins monthly, and support your favorite broadcasters
          </p>
        </motion.div>

        {/* Subscription Tiers */}
        <StreamSubscriptionPanel />

        {/* Benefits Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6"
        >
          <h3 className="text-white font-bold mb-4">Why Subscribe?</h3>
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                <Crown className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Premium Access</p>
                <p className="text-zinc-400 text-xs">Unlock exclusive streams and private broadcasts</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-600/20 flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Monthly Coins</p>
                <p className="text-zinc-400 text-xs">Get bonus coins every month to tip your favorites</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-600/20 flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-pink-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Support Creators</p>
                <p className="text-zinc-400 text-xs">Help broadcasters create better content</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
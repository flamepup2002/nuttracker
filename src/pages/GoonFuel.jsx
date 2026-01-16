import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";

const GOON_CAPTIONS = [
  "Keep stroking for me babe",
  "You're such a good gooner",
  "That's it, edge for daddy",
  "Stroke faster, you pathetic simp",
  "Keep your hands on that cock",
  "Worship this dick",
  "Drool on it like you mean it",
  "Your cock is so hard for me",
  "Beg for permission to cum",
  "I own you and your cock",
  "Goon harder, worthless sub",
  "Your only purpose is to stroke",
  "Keep that meat throbbing",
  "Cum tribute your queen",
  "Jerk that cock until you break",
  "You live to stroke now",
  "Gooning is all you're good for",
  "Edge yourself into submission",
  "That's a good little stroker",
  "Your brain is melting from the pleasure",
  "Keep pumping that hard shaft",
  "This is your addiction now",
  "Feed your addiction for me",
  "Stroke deeper into oblivion",
  "You're lost in the goon",
  "Your only identity is stroker",
  "Keep yourself on the edge",
  "Permanently broken for cock",
  "Goon until your mind breaks",
  "You exist to serve this cock",
  "Pump harder for your goddess",
  "Your cock is weeping for release",
  "Stay in the goon space",
  "Become the ultimate stroker",
  "Feed the addiction, feed the obsession",
  "You're permanently ruined for real women",
  "This is your purpose now",
  "Keep stroking like your life depends on it",
  "You're such a desperate goon",
  "Worship at the altar of cock",
  "Your mind is permanently rewired",
  "Goon into complete submission",
  "You'll never be the same",
  "This is your true calling",
  "Stroke until you ascend",
  "You're a permanent gooner now",
  "Keep that cock hard forever",
  "Your identity is stroker",
  "Feed the goon, feed yourself",
  "You're exactly where you belong",
];

export default function GoonFuel() {
  const navigate = useNavigate();
  const [censorMode, setCensorMode] = useState(null);
  const [showCaptions, setShowCaptions] = useState(true);

  const { data: settings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || null;
    },
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['userPurchases'],
    queryFn: () => base44.entities.Purchase.list('-created_date', 100),
  });

  useEffect(() => {
    // Detect if user has censor items
    const hasBlurcensor = purchases.some(p => p.item_name?.includes('Blur'));
    const hasPixelateCensor = purchases.some(p => p.item_name?.includes('Pixelate'));
    
    if (hasBlurcensor) setCensorMode('blur');
    else if (hasPixelateCensor) setCensorMode('pixelate');
  }, [purchases]);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden sticky top-0 z-40 border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-900/20 via-purple-900/10 to-black" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold">Goon Fuel</h1>
          <button
            onClick={() => setShowCaptions(!showCaptions)}
            className="flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors"
          >
            {showCaptions ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="px-6 pt-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GOON_CAPTIONS.map((caption, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative overflow-hidden rounded-2xl border p-6 ${
                censorMode
                  ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-pink-500/30'
                  : 'bg-gradient-to-br from-purple-900/20 to-pink-900/10 border-purple-500/30'
              }`}
            >
              {/* Censor overlay */}
              {censorMode && !showCaptions && (
                <div className={`absolute inset-0 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center ${
                  censorMode === 'blur' ? 'backdrop-blur-xl' : ''
                } ${
                  censorMode === 'pixelate' ? '[background-image:repeating-linear-gradient(0deg,rgba(0,0,0,.5)0px,rgba(0,0,0,.5)2px,transparent 2px,transparent 4px),repeating-linear-gradient(90deg,rgba(0,0,0,.5)0px,rgba(0,0,0,.5)2px,transparent 2px,transparent 4px)]' : ''
                }`}>
                  <div className="text-center">
                    <Eye className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-zinc-500 text-sm">Content censored</p>
                  </div>
                </div>
              )}

              {/* Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: showCaptions ? 1 : 0.3 }}
                className="relative"
              >
                <p className="text-white font-semibold text-lg leading-relaxed">
                  {caption}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">#{idx + 1}</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      navigator.clipboard.writeText(caption);
                    }}
                    className="text-xs px-3 py-1 rounded-lg bg-pink-600/20 text-pink-400 hover:bg-pink-600/40 transition-all"
                  >
                    Copy
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Censor Info Bar */}
      {censorMode && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 border-t border-zinc-800 px-6 py-4 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-400">
                {censorMode === 'blur' ? 'Blur Censor Active' : 'Pixelate Censor Active'}
              </span>
            </div>
            <button
              onClick={() => setShowCaptions(!showCaptions)}
              className="text-xs px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition-all"
            >
              {showCaptions ? 'Hide Content' : 'Show Content'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
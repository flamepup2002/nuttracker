import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Eye, EyeOff, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";

// Goon captions for gay content
const GOON_CAPTIONS = [
  { id: 1, text: 'STROKE FOR HIM', color: 'from-pink-600 to-red-600' },
  { id: 2, text: 'GOON YOUR COCK', color: 'from-purple-600 to-pink-600' },
  { id: 3, text: 'EDGE FOR ME', color: 'from-blue-600 to-purple-600' },
  { id: 4, text: 'FEEL THAT PLEASURE', color: 'from-green-500 to-blue-600' },
  { id: 5, text: 'LOSE YOUR MIND', color: 'from-red-600 to-orange-600' },
  { id: 6, text: 'DRAIN YOURSELF', color: 'from-yellow-600 to-red-600' },
  { id: 7, text: 'SUBMIT TO THE MOMENT', color: 'from-pink-600 to-purple-600' },
  { id: 8, text: 'KEEP STROKING', color: 'from-orange-600 to-pink-600' },
  { id: 9, text: 'WORSHIP THIS', color: 'from-purple-700 to-pink-700' },
  { id: 10, text: 'CUM FOR HIM', color: 'from-red-700 to-orange-700' },
  { id: 11, text: 'GOON HARDER', color: 'from-blue-700 to-purple-700' },
  { id: 12, text: 'NEVER STOP', color: 'from-pink-700 to-red-700' },
  { id: 13, text: 'LET GO', color: 'from-green-600 to-teal-600' },
  { id: 14, text: 'PLEASURE OVERLOAD', color: 'from-yellow-500 to-orange-600' },
  { id: 15, text: 'OBEY THE URGE', color: 'from-purple-600 to-red-600' },
  { id: 16, text: 'GOON UNTIL DUMB', color: 'from-pink-500 to-rose-600' },
  { id: 17, text: 'KEEP EDGING', color: 'from-blue-600 to-cyan-600' },
  { id: 18, text: 'STROKE IN RHYTHM', color: 'from-orange-500 to-red-600' },
  { id: 19, text: 'FEEL THE POWER', color: 'from-purple-500 to-pink-600' },
  { id: 20, text: 'SUCCUMB TO PLEASURE', color: 'from-red-600 to-pink-600' },
];

export default function GoonFuel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [censorEnabled, setCensorEnabled] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || {};
    },
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => base44.entities.Purchase.list(),
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Check if user has purchased censor tool
  const hasCensorTool = purchases.some(p => p.item_name === 'Beta Censor Tool');

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden sticky top-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-900/20 via-purple-900/10 to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative px-6 py-4 flex items-center justify-between border-b border-zinc-800">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-pink-400" />
            Goon Fuel
          </h1>
          {hasCensorTool && (
            <button
              onClick={() => setCensorEnabled(!censorEnabled)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                censorEnabled
                  ? 'bg-blue-600/30 border border-blue-500/50'
                  : 'bg-zinc-900 border border-zinc-700'
              }`}
            >
              {censorEnabled ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span className="text-xs">Censored</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span className="text-xs">Uncensored</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {!hasCensorTool && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-900/30 border border-blue-500/30 rounded-2xl p-4 mb-6"
          >
            <p className="text-blue-400 text-sm">
              Unlock the Beta Censor Tool in the shop to hide goon fuel during public viewing.
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {GOON_CAPTIONS.map((caption, idx) => (
            <motion.div
              key={caption.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative overflow-hidden rounded-2xl aspect-square flex items-center justify-center bg-gradient-to-br ${caption.color} group cursor-pointer`}
            >
              {/* Background image placeholder with blur if censored */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${caption.color} opacity-30 ${
                  censorEnabled ? 'blur-2xl' : ''
                }`}
              />
              
              {/* Censored overlay */}
              {censorEnabled && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-lg">
                  <EyeOff className="w-8 h-8 text-zinc-600" />
                </div>
              )}

              {/* Caption text */}
              <div className={`relative z-10 text-center px-4 transition-all ${
                censorEnabled ? 'opacity-30' : ''
              }`}>
                <p className="text-white font-black text-xl sm:text-2xl drop-shadow-lg">
                  {caption.text}
                </p>
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
            </motion.div>
          ))}
        </div>

        {/* Session Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4"
        >
          <p className="text-zinc-400 text-xs text-center">
            💡 Use this during goon sessions for maximum fuel and edging intensity
          </p>
        </motion.div>
      </div>
    </div>
  );
}
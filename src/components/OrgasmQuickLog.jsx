import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplet, X, Ban, DollarSign, Flame, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const orgasmTypes = [
  { id: 'cumshot', label: 'Cumshot', icon: Droplet, color: 'from-blue-500 to-cyan-400', description: 'Full release' },
  { id: 'ruined', label: 'Ruined', icon: X, color: 'from-orange-500 to-red-500', description: 'Stopped at edge' },
  { id: 'denied', label: 'Denied', icon: Ban, color: 'from-purple-500 to-pink-500', description: 'No release allowed' },
  { id: 'cashgasm', label: 'Cashgasm', icon: DollarSign, color: 'from-green-400 to-emerald-500', description: 'Financial tribute' },
];

export default function OrgasmQuickLog({ sessionId, isFindom, currentCost, heartRate, onLog }) {
  const [isOpen, setIsOpen] = useState(false);
  const [logging, setLogging] = useState(null);

  const handleLog = async (type) => {
    setLogging(type);
    try {
      const orgasmData = {
        type,
        session_id: sessionId || null,
        is_findom: isFindom || false,
        cost: isFindom ? currentCost : 0,
        heart_rate_at_time: heartRate || null,
      };
      
      await base44.entities.Orgasm.create(orgasmData);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} logged!`, {
        description: isFindom ? `Cost: $${currentCost?.toFixed(2)}` : undefined,
      });
      
      if (onLog) onLog(orgasmData);
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to log');
    } finally {
      setLogging(null);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/30 flex items-center justify-center"
      >
        <Plus className="w-8 h-8 text-white" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 z-50 p-6 pb-10"
            >
              <div className="max-w-md mx-auto bg-zinc-900/95 rounded-3xl border border-zinc-800 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-pink-500" />
                    Log Orgasm
                  </h3>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {orgasmTypes.map((type) => (
                    <motion.button
                      key={type.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={logging === type.id}
                      onClick={() => handleLog(type.id)}
                      className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all ${
                        logging === type.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-20`} />
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-3`}>
                          <type.icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-white font-semibold">{type.label}</p>
                        <p className="text-zinc-400 text-xs mt-1">{type.description}</p>
                        {isFindom && currentCost > 0 && (
                          <p className="text-green-400 text-sm font-bold mt-2">${currentCost?.toFixed(2)}</p>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
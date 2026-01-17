import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Lock, Unlock, Zap, AlertTriangle, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import CellmateConnect from '@/components/CellmateConnect';

export default function HornyJail() {
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockStartTime, setLockStartTime] = useState(null);
  const [aiDuration, setAiDuration] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const { data: settings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || null;
    },
  });

  const aiControlMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiChastityControl', {
        userHistory: {
          dangerous_mode: settings?.ai_dangerous_encouragements || false,
          findom_enabled: settings?.findom_enabled || false
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      setAiDuration(data.duration_minutes);
      setLockStartTime(Date.now());
      setIsLocked(true);
      toast.success(`🔒 AI has locked you for ${data.duration_minutes} minutes`, {
        description: data.message
      });
    },
    onError: () => {
      toast.error('AI control failed');
    }
  });

  const handleAiControl = () => {
    if (!device) {
      toast.error('Please connect your Cellmate device first');
      return;
    }
    aiControlMutation.mutate();
  };

  const handleUnlock = () => {
    if (!isLocked || !lockStartTime || !aiDuration) return;
    
    const remainingMinutes = aiDuration - (elapsedTime / 60000);
    if (remainingMinutes > 0) {
      toast.error(`AI says no. ${Math.ceil(remainingMinutes)} minutes remaining.`);
      return;
    }

    setIsLocked(false);
    setLockStartTime(null);
    setAiDuration(null);
    toast.success('Released from Horny Jail');
  };

  // Timer effect
  useEffect(() => {
    if (!isLocked || !lockStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lockStartTime;
      setElapsedTime(elapsed);

      // Auto unlock when time is up
      if (aiDuration && elapsed >= aiDuration * 60000) {
        setIsLocked(false);
        setLockStartTime(null);
        toast.success('Time served! You are free.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, lockStartTime, aiDuration]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const remainingTime = aiDuration ? Math.max(0, aiDuration * 60000 - elapsedTime) : 0;
  const progress = aiDuration ? Math.min(100, (elapsedTime / (aiDuration * 60000)) * 100) : 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            Horny Jail
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="px-6 pb-24 pt-6 space-y-6">
        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-900/30 border-2 border-orange-500/50 rounded-2xl p-4 flex items-start gap-4"
        >
          <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-orange-300 font-bold">⚠️ AI CHASTITY CONTROL</p>
            <p className="text-orange-400/80 text-sm mt-1">
              The AI will decide how long you stay locked. No safe word. No escape until time is served.
            </p>
          </div>
        </motion.div>

        {/* Device Connection */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-bold">Connect Device</h2>
          </div>
          <CellmateConnect onDeviceConnected={setDevice} />
        </div>

        {/* Lock Status */}
        <AnimatePresence>
          {isLocked && aiDuration && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gradient-to-br from-red-900/50 to-red-950/50 border-2 border-red-500/50 rounded-2xl p-8"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-red-600/20 flex items-center justify-center mb-4">
                  <Lock className="w-10 h-10 text-red-400" />
                </div>
                <h3 className="text-red-300 font-bold text-2xl mb-2">🔒 LOCKED</h3>
                <p className="text-red-400/80 text-sm">AI is in control</p>
              </div>

              {/* Timer */}
              <div className="space-y-4">
                <div className="bg-black/30 rounded-xl p-6">
                  <p className="text-red-400 text-xs mb-2 text-center">TIME REMAINING</p>
                  <p className="text-white text-4xl font-bold text-center font-mono">
                    {formatTime(remainingTime)}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="bg-zinc-900 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-red-600 to-red-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-black/30 rounded-lg p-3">
                    <p className="text-zinc-500 text-xs">Locked for</p>
                    <p className="text-white font-bold">{aiDuration} min</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    <p className="text-zinc-500 text-xs">Elapsed</p>
                    <p className="text-white font-bold">{Math.floor(elapsedTime / 60000)} min</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleUnlock}
                disabled={remainingTime > 0}
                className={`w-full mt-6 ${
                  remainingTime > 0
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {remainingTime > 0 ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Still Locked
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Release Me
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Control Button */}
        {!isLocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              onClick={handleAiControl}
              disabled={!device || aiControlMutation.isPending}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 py-6 text-lg font-bold"
            >
              <Zap className="w-5 h-5 mr-2" />
              {aiControlMutation.isPending ? 'AI Deciding...' : 'Let AI Lock Me'}
            </Button>

            {!device && (
              <p className="text-zinc-500 text-xs text-center mt-2">
                Connect your Cellmate device to begin
              </p>
            )}
          </motion.div>
        )}

        {/* Info */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-white font-bold text-sm mb-3">How It Works</h3>
          <ul className="space-y-2 text-zinc-400 text-xs">
            <li className="flex items-start gap-2">
              <span className="text-red-400">1.</span>
              <span>Connect your Cellmate 2 or Cellmate 3 CAGINK Pro device</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">2.</span>
              <span>AI analyzes your profile and decides lock duration</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">3.</span>
              <span>You stay locked until the timer expires - no exceptions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">4.</span>
              <span>AI considers your settings, history, and randomness</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
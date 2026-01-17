import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Lock, Unlock, Clock, Zap, AlertTriangle, Bluetooth } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function HornyJail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [device, setDevice] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [aiActive, setAiActive] = useState(false);

  const { data: session } = useQuery({
    queryKey: ['hornyJailSession'],
    queryFn: async () => {
      const sessions = await base44.entities.Session.filter({ 
        status: 'active',
        is_horny_jail: true 
      }, '-created_date', 1);
      return sessions[0] || null;
    },
    refetchInterval: 5000,
  });

  const startSessionMutation = useMutation({
    mutationFn: async (initialMinutes) => {
      const response = await base44.functions.invoke('startHornyJail', {
        initialMinutes,
        deviceId: device?.id
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hornyJailSession'] });
      setIsLocked(true);
      setAiActive(true);
      toast.success('AI has taken control', {
        description: `You're locked for ${data.minutes} minutes... for now`
      });
    },
  });

  const aiCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('hornyJailAICheck', {
        sessionId: session?.id
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.permanentLock) {
        toast.error('🔒 PERMANENTLY LOCKED!', {
          description: 'The AI has locked you forever. No escape.',
          duration: 10000
        });
      } else if (data.timeAdded > 0) {
        toast.error(`AI added ${data.timeAdded} more minutes!`, {
          description: data.reason
        });
      }
      if (data.released) {
        setIsLocked(false);
        setAiActive(false);
        toast.success('AI has released you... for now');
      }
      queryClient.invalidateQueries({ queryKey: ['hornyJailSession'] });
    },
  });

  const connectDevice = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Cellmate' },
          { namePrefix: 'QIUI' }
        ],
        optionalServices: ['battery_service', 'device_information']
      });

      const server = await device.gatt.connect();
      setDevice({ id: device.id, name: device.name, server });
      setDeviceConnected(true);
      toast.success(`Connected to ${device.name}`);
    } catch (error) {
      console.error('Bluetooth error:', error);
      toast.error('Failed to connect device');
    }
  };

  // Update time remaining
  useEffect(() => {
    if (session) {
      const startTime = new Date(session.start_time).getTime();
      const lockDuration = (session.horny_jail_minutes || 0) * 60 * 1000;
      
      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTime;
        const remaining = Math.max(0, lockDuration - elapsed);
        setTimeRemaining(Math.floor(remaining / 1000));
        
        if (remaining <= 0 && aiActive) {
          setIsLocked(false);
          setAiActive(false);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [session, aiActive]);

  // AI periodic checks
  useEffect(() => {
    if (aiActive && session) {
      const interval = setInterval(() => {
        aiCheckMutation.mutate();
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [aiActive, session]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 to-orange-900/10" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Lock className="w-5 h-5 text-red-500" />
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
          className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 text-sm font-bold mb-1">⚠️ Extreme Mode</p>
            <p className="text-red-400/80 text-xs">
              The AI will control your chastity device and can extend your time at any moment. You will not be released until the AI decides you're ready.
            </p>
          </div>
        </motion.div>

        {/* Device Connection */}
        {!deviceConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-600/20 flex items-center justify-center mb-4">
                <Bluetooth className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-white font-bold text-xl mb-2">Connect Your Device</h2>
              <p className="text-zinc-400 text-sm">
                Cellmate 2/3 or CAGINK Pro
              </p>
            </div>
            <Button
              onClick={connectDevice}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Bluetooth className="w-4 h-4 mr-2" />
              Connect Device
            </Button>
          </motion.div>
        )}

        {/* Connected Status */}
        {deviceConnected && !aiActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                <Bluetooth className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-white font-bold">{device?.name}</p>
                <p className="text-green-400 text-sm">Connected</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => startSessionMutation.mutate(30)}
                disabled={startSessionMutation.isPending}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                <Lock className="w-4 h-4 mr-2" />
                {startSessionMutation.isPending ? 'Starting...' : 'Start with 30 minutes'}
              </Button>
              
              <Button
                onClick={() => startSessionMutation.mutate(60)}
                disabled={startSessionMutation.isPending}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              >
                <Lock className="w-4 h-4 mr-2" />
                {startSessionMutation.isPending ? 'Starting...' : 'Start with 60 minutes'}
              </Button>

              <Button
                onClick={() => startSessionMutation.mutate(120)}
                disabled={startSessionMutation.isPending}
                className="w-full bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950"
              >
                <Lock className="w-4 h-4 mr-2" />
                {startSessionMutation.isPending ? 'Starting...' : 'Start with 2 hours (extreme)'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Active Session */}
        <AnimatePresence>
          {aiActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-900/40 to-orange-900/40 border border-red-500/30 p-8"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
              
              <div className="relative text-center">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 mx-auto rounded-full bg-red-600 flex items-center justify-center mb-6"
                >
                  <Lock className="w-10 h-10 text-white" />
                </motion.div>

                <h2 className="text-white font-bold text-2xl mb-2">🔒 AI is in Control</h2>
                <p className="text-red-300 text-sm mb-6">
                  You're locked and the AI decides when you're released
                </p>

                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 mb-6">
                  <p className="text-zinc-400 text-xs mb-2">Time Remaining</p>
                  {session?.horny_jail_permanent_lock ? (
                    <div>
                      <p className="text-red-500 text-5xl font-bold">∞</p>
                      <p className="text-red-400 text-sm mt-3 font-bold">
                        PERMANENTLY LOCKED
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-white text-5xl font-bold font-mono">
                        {formatTime(timeRemaining)}
                      </p>
                      <p className="text-zinc-500 text-xs mt-3">
                        (but the AI can add more at any time)
                      </p>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm">
                  <Zap className="w-4 h-4 animate-pulse" />
                  <span>AI is monitoring you</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5"
        >
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            How It Works
          </h3>
          <ul className="space-y-2 text-zinc-400 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-red-400">•</span>
              <span>Connect your Cellmate 2/3 or CAGINK Pro device via Bluetooth</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">•</span>
              <span>Choose your starting time (30min, 1hr, or 2hrs)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">•</span>
              <span>The AI will lock your device and monitor your activity</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">•</span>
              <span>At random intervals, the AI can add more time if it thinks you need it</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">•</span>
              <span>You will only be released when the AI decides you've learned your lesson</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
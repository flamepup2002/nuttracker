import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Wind, Wine, Zap, Flame, Play, Square,
  Timer, TrendingUp, AlertTriangle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const KINK_SESSIONS = [
  {
    id: 'breathplay',
    title: 'Breathplay Gooner',
    description: 'Controlled breathing exercises during edging',
    icon: Wind,
    color: 'from-blue-500 to-cyan-400',
    instructions: [
      'Edge while holding your breath',
      'Release when you need air',
      'Repeat and push your limits',
      'Track your breath hold times'
    ],
    cycles: [
      { hold: 10, rest: 20 },
      { hold: 15, rest: 20 },
      { hold: 20, rest: 25 },
      { hold: 25, rest: 30 },
      { hold: 30, rest: 40 }
    ]
  },
  {
    id: 'intox',
    title: 'Intox Gooner',
    description: 'Enhance your session with substances',
    icon: Wine,
    color: 'from-purple-500 to-pink-500',
    instructions: [
      'Take your chosen substance',
      'Wait for effects to kick in',
      'Enjoy intensified sensations',
      'Stay safe and hydrated'
    ],
    intervals: [15, 30, 45, 60]
  },
  {
    id: 'poppers',
    title: 'Poppers Challenge',
    description: 'Timed poppers hits during edging',
    icon: Zap,
    color: 'from-yellow-500 to-orange-500',
    instructions: [
      'Hit poppers on command',
      'Edge while high',
      'Follow the timer',
      'Ride the waves'
    ],
    intervals: [3, 5, 10, 15]
  },
  {
    id: 'endurance',
    title: 'Endurance Goon',
    description: 'Long-form edging marathon',
    icon: Flame,
    color: 'from-red-500 to-pink-500',
    instructions: [
      'Edge continuously',
      'No cumming allowed',
      'Build stamina',
      'Push your limits'
    ],
    goals: [30, 60, 90, 120]
  },
  {
    id: 'suffocation',
    title: 'Suffocation Play',
    description: 'Extreme breath restriction during edging',
    icon: Wind,
    color: 'from-red-600 to-purple-600',
    instructions: [
      'Edge while restricting airflow',
      'Use safe methods only',
      'Have a safety release ready',
      'Stop immediately if dizzy'
    ],
    cycles: [
      { hold: 15, rest: 30 },
      { hold: 20, rest: 35 },
      { hold: 25, rest: 40 },
      { hold: 30, rest: 45 },
      { hold: 35, rest: 60 }
    ]
  }
];

function SessionRunner({ session, onEnd, snuffPlayEnabled }) {
  const [isActive, setIsActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [phase, setPhase] = useState('rest'); // 'hold' or 'rest' for breathplay

  useEffect(() => {
    let interval;
    if (isActive) {
      interval = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEnd = () => {
    setIsActive(false);
    toast.success('Session completed!');
    onEnd();
  };

  const getNextInstruction = () => {
    if ((session.id === 'breathplay' || session.id === 'suffocation') && session.cycles) {
      const cycle = session.cycles[currentCycle % session.cycles.length];
      if (phase === 'hold') {
        if (snuffPlayEnabled) {
          return `Hold as long as you want - NO LIMITS`;
        }
        return `Hold your breath for ${cycle.hold}s`;
      } else {
        if (snuffPlayEnabled) {
          return `Rest when ready - NO SAFETY TIMER`;
        }
        return `Rest and breathe for ${cycle.rest}s`;
      }
    }
    if (session.intervals) {
      const interval = session.intervals[currentCycle % session.intervals.length];
      return `Next hit in ${interval} minutes`;
    }
    if (session.goals) {
      return `Goal: ${session.goals[Math.min(currentCycle, session.goals.length - 1)]} minutes`;
    }
    return 'Keep going...';
  };

  return (
    <div className="space-y-6">
      {/* Timer Display */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-8 text-center border border-zinc-700"
      >
        <p className="text-zinc-400 text-sm mb-2">Session Time</p>
        <p className="text-6xl font-bold text-white mb-2">{formatTime(elapsed)}</p>
        {isActive && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-green-400 text-sm"
          >
            ● Recording
          </motion.div>
        )}
      </motion.div>

      {/* Instructions */}
      {isActive && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-2xl p-6"
          >
            <p className="text-purple-400 text-sm mb-2">Current Instruction</p>
            <p className="text-white text-lg font-medium">{getNextInstruction()}</p>
          </motion.div>
          
          {snuffPlayEnabled && (session.id === 'breathplay' || session.id === 'suffocation') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-900/30 border border-red-500/50 rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-bold text-sm">⚠️ EXTREME MODE ACTIVE</p>
                  <p className="text-red-400/70 text-xs mt-1">
                    Safety features disabled. You are responsible for your own safety.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {!isActive ? (
          <Button
            onClick={() => setIsActive(true)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg font-bold rounded-2xl"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Session
          </Button>
        ) : (
          <Button
            onClick={handleEnd}
            variant="outline"
            className="flex-1 border-zinc-700 text-white py-6 text-lg font-bold rounded-2xl"
          >
            <Square className="w-5 h-5 mr-2" />
            End Session
          </Button>
        )}
      </div>

      {/* Cycle Control for Breathplay/Suffocation */}
      {isActive && (session.id === 'breathplay' || session.id === 'suffocation') && (
        <Button
          onClick={() => {
            setPhase(prev => prev === 'hold' ? 'rest' : 'hold');
            setCurrentCycle(prev => prev + 1);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 py-4"
        >
          Next: {phase === 'hold' ? 'Rest' : 'Hold Breath'}
        </Button>
      )}
    </div>
  );
}

export default function KinkSessions() {
  const navigate = useNavigate();
  const [selectedSession, setSelectedSession] = useState(null);

  const { data: settings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || { snuff_play_enabled: false };
    },
  });

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
        
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => selectedSession ? setSelectedSession(null) : navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Kink Sessions
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pt-6">
        <AnimatePresence mode="wait">
          {!selectedSession ? (
            <motion.div
              key="selector"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Warning */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-900/20 border border-orange-500/30 rounded-2xl p-5"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-orange-400 font-medium text-sm">Safety First</p>
                    <p className="text-orange-500/70 text-xs mt-1">
                      Know your limits. Stay safe. Use substances responsibly.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Session Cards */}
              {KINK_SESSIONS.map((session, idx) => {
                const Icon = session.icon;
                return (
                  <motion.button
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => setSelectedSession(session)}
                    className="w-full text-left"
                  >
                    <div className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${session.color}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <h3 className="text-white font-bold text-xl mb-2">{session.title}</h3>
                      <p className="text-white/80 text-sm">{session.description}</p>
                      <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="session"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Session Header */}
              <div className={`bg-gradient-to-br ${selectedSession.color} rounded-2xl p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <selectedSession.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-xl">{selectedSession.title}</h2>
                    <p className="text-white/70 text-sm">{selectedSession.description}</p>
                  </div>
                </div>
                
                {/* Instructions */}
                <div className="bg-black/20 rounded-xl p-4">
                  <p className="text-white/60 text-xs mb-2">Instructions:</p>
                  <ul className="space-y-1">
                    {selectedSession.instructions.map((instruction, idx) => (
                      <li key={idx} className="text-white text-sm flex items-start gap-2">
                        <span className="text-white/40 mt-1">•</span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Session Runner */}
              <SessionRunner 
                session={selectedSession} 
                onEnd={() => setSelectedSession(null)}
                snuffPlayEnabled={settings?.snuff_play_enabled}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
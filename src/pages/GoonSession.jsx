import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Play, Square, ArrowLeft, Activity, Heart, 
  Flame, Clock, TrendingUp, ChevronDown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import SessionTimer from '@/components/SessionTimer';
import HeartRateMonitor from '@/components/HeartRateMonitor';
import HeartRateChart from '@/components/HeartRateChart';
import OrgasmQuickLog from '@/components/OrgasmQuickLog';
import AIBully from '@/components/AIBully';

export default function GoonSession() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [heartRate, setHeartRate] = useState(null);
  const [heartRateData, setHeartRateData] = useState([]);
  const [showStats, setShowStats] = useState(false);
  
  // Detect iOS (Web Bluetooth not supported)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const startSession = async () => {
    try {
      const newSession = await base44.entities.Session.create({
        start_time: new Date().toISOString(),
        is_findom: false,
        status: 'active',
        heart_rate_data: [],
      });
      setSession(newSession);
      setIsActive(true);
      setHeartRateData([]);
      toast.success('Goon session started!');
    } catch (error) {
      toast.error('Failed to start session');
    }
  };

  const endSession = async () => {
    if (!session) return;
    
    try {
      const peakHR = heartRateData.length > 0 
        ? Math.max(...heartRateData.map(d => d.bpm))
        : null;
      const avgHR = heartRateData.length > 0
        ? Math.round(heartRateData.reduce((sum, d) => sum + d.bpm, 0) / heartRateData.length)
        : null;

      await base44.entities.Session.update(session.id, {
        end_time: new Date().toISOString(),
        duration_seconds: duration,
        status: 'completed',
        heart_rate_data: heartRateData,
        peak_heart_rate: peakHR,
        avg_heart_rate: avgHR,
      });
      
      setIsActive(false);
      setShowStats(true);
      toast.success('Session completed!');
    } catch (error) {
      toast.error('Failed to end session');
    }
  };

  const handleHeartRateChange = (bpm) => {
    setHeartRate(bpm);
  };

  const handleDataPoint = (dataPoint) => {
    setHeartRateData(prev => [...prev, dataPoint]);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stats = {
    peak: heartRateData.length > 0 ? Math.max(...heartRateData.map(d => d.bpm)) : '--',
    avg: heartRateData.length > 0 
      ? Math.round(heartRateData.reduce((sum, d) => sum + d.bpm, 0) / heartRateData.length)
      : '--',
    min: heartRateData.length > 0 ? Math.min(...heartRateData.map(d => d.bpm)) : '--',
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-purple-400" />
            Goon Session
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-24 space-y-6">
        {/* Timer */}
        <SessionTimer 
          isActive={isActive} 
          startTime={session?.start_time}
          onDurationChange={setDuration}
        />

        {/* Control Buttons */}
        <div className="flex justify-center gap-4">
          {!isActive ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startSession}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg flex items-center gap-3 shadow-lg shadow-purple-500/30"
            >
              <Play className="w-6 h-6" />
              Start Session
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={endSession}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-lg flex items-center gap-3 shadow-lg shadow-red-500/30"
            >
              <Square className="w-6 h-6" />
              End Session
            </motion.button>
          )}
        </div>

        {/* Heart Rate Monitor */}
        {!isIOS && (
          <>
            <HeartRateMonitor 
              onHeartRateChange={handleHeartRateChange}
              onDataPoint={handleDataPoint}
            />

            {/* Heart Rate Stats */}
            {isActive && heartRateData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-3"
              >
                <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 text-center">
                  <p className="text-zinc-500 text-xs mb-1">Peak</p>
                  <p className="text-2xl font-bold text-red-400">{stats.peak}</p>
                  <p className="text-zinc-600 text-xs">BPM</p>
                </div>
                <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 text-center">
                  <p className="text-zinc-500 text-xs mb-1">Average</p>
                  <p className="text-2xl font-bold text-orange-400">{stats.avg}</p>
                  <p className="text-zinc-600 text-xs">BPM</p>
                </div>
                <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 text-center">
                  <p className="text-zinc-500 text-xs mb-1">Low</p>
                  <p className="text-2xl font-bold text-green-400">{stats.min}</p>
                  <p className="text-zinc-600 text-xs">BPM</p>
                </div>
              </motion.div>
            )}

            {/* Heart Rate Chart */}
            {heartRateData.length > 0 && (
              <HeartRateChart data={heartRateData} />
            )}
          </>
        )}

        {/* Session Complete Stats */}
        <AnimatePresence>
          {showStats && !isActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-3xl border border-purple-500/30 p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-purple-400" />
                Session Complete!
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 rounded-xl p-4">
                  <p className="text-zinc-400 text-sm">Duration</p>
                  <p className="text-2xl font-bold text-white">{formatDuration(duration)}</p>
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <p className="text-zinc-400 text-sm">Data Points</p>
                  <p className="text-2xl font-bold text-white">{heartRateData.length}</p>
                </div>
                {stats.peak !== '--' && (
                  <>
                    <div className="bg-black/30 rounded-xl p-4">
                      <p className="text-zinc-400 text-sm">Peak HR</p>
                      <p className="text-2xl font-bold text-red-400">{stats.peak} BPM</p>
                    </div>
                    <div className="bg-black/30 rounded-xl p-4">
                      <p className="text-zinc-400 text-sm">Avg HR</p>
                      <p className="text-2xl font-bold text-orange-400">{stats.avg} BPM</p>
                    </div>
                  </>
                )}
              </div>

              <Button
                onClick={() => {
                  setShowStats(false);
                  setSession(null);
                  setHeartRateData([]);
                  setDuration(0);
                }}
                className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white"
              >
                Start New Session
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isActive && (
        <>
          <OrgasmQuickLog 
            sessionId={session?.id}
            isFindom={false}
            heartRate={heartRate}
          />
          <AIBully
            isActive={isActive}
            duration={duration}
            heartRate={heartRate}
            isFindom={false}
          />
        </>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Timer, Pause, Play, Square } from 'lucide-react';

export default function SessionTimer({ isActive, startTime, onDurationChange }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval;
    if (isActive && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const start = new Date(startTime).getTime();
        const seconds = Math.floor((now - start) / 1000);
        setElapsed(seconds);
        if (onDurationChange) onDurationChange(seconds);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, startTime, onDurationChange]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl rounded-full" />
      <div className="relative bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-zinc-800 p-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <motion.div
            animate={isActive ? { rotate: 360 } : {}}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          >
            <Timer className="w-6 h-6 text-purple-400" />
          </motion.div>
          <span className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
            Session Duration
          </span>
        </div>
        
        <motion.div 
          className="text-center"
          animate={isActive ? { scale: [1, 1.02, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="text-6xl md:text-7xl font-mono font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            {formatTime(elapsed)}
          </span>
        </motion.div>

        {isActive && (
          <motion.div 
            className="mt-4 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full">
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-2 h-2 rounded-full bg-green-500"
              />
              <span className="text-green-400 text-sm font-medium">Recording</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
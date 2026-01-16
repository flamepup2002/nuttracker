import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, Zap, AlertTriangle, Bluetooth, Activity, 
  Play, Pause, X, Info, Heart
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const HEART_RATE_THRESHOLD = 110;
const NORMAL_HR = 60;

export default function Edge() {
  const navigate = useNavigate();
  const [heartRate, setHeartRate] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isStimulating, setIsStimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stimulationLevel, setStimulationLevel] = useState(0);
  const [hrDevice, setHrDevice] = useState(null);
  const [toyDevice, setToyDevice] = useState(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [maxHeartRate, setMaxHeartRate] = useState(0);
  const hrCharacteristic = useRef(null);
  const toyCharacteristic = useRef(null);
  const sessionInterval = useRef(null);
  const hrCheckInterval = useRef(null);

  // Load saved toy device
  useEffect(() => {
    const saved = localStorage.getItem('bluetoothToyDevice');
    if (saved) {
      try {
        setToyDevice(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('bluetoothToyDevice');
      }
    }
  }, []);

  // Session timer
  useEffect(() => {
    if (isMonitoring) {
      sessionInterval.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(sessionInterval.current);
  }, [isMonitoring]);

  // Heart rate threshold check
  useEffect(() => {
    if (!isStimulating || !isMonitoring) return;

    if (heartRate >= HEART_RATE_THRESHOLD) {
      if (!isPaused) {
        pauseStimulation();
        toast.success('Heart rate too high! Pausing stimulation.');
      }
    } else if (heartRate < NORMAL_HR && isPaused) {
      resumeStimulation();
      toast.success('Heart rate normalized. Resuming.');
    }
  }, [heartRate, isStimulating, isPaused, isMonitoring]);

  const connectHeartMonitor = async () => {
    if (!navigator.bluetooth) {
      toast.error('Bluetooth not supported on this device');
      return;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['generic_access', 'device_information']
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');

      hrCharacteristic.current = characteristic;
      setHrDevice(device);

      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const data = event.target.value;
        const heartRateValue = data.getUint8(1);
        setHeartRate(heartRateValue);
        setMaxHeartRate(prev => Math.max(prev, heartRateValue));
      });

      await characteristic.startNotifications();
      setIsMonitoring(true);
      toast.success(`Connected to ${device.name || 'heart monitor'}!`);

      device.addEventListener('gattserverdisconnected', () => {
        setIsMonitoring(false);
        setHrDevice(null);
        toast.error('Heart monitor disconnected');
      });

    } catch (error) {
      if (error.name !== 'NotFoundError') {
        toast.error('Failed to connect: ' + error.message);
      }
    }
  };

  const connectToy = async () => {
    if (!navigator.bluetooth) {
      toast.error('Bluetooth not supported');
      return;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_attribute']
      });

      const server = await device.gatt.connect();
      setToyDevice({ id: device.id, name: device.name || 'Toy' });
      localStorage.setItem('bluetoothToyDevice', JSON.stringify({ id: device.id, name: device.name }));
      
      toast.success(`Connected to ${device.name || 'toy'}!`);

    } catch (error) {
      if (error.name !== 'NotFoundError') {
        toast.error('Failed to connect toy');
      }
    }
  };

  const startStimulation = () => {
    if (!hrDevice || !toyDevice) {
      toast.error('Connect both heart monitor and toy first');
      return;
    }

    setIsStimulating(true);
    setIsPaused(false);
    setStimulationLevel(1);
    toast.success('Stimulation started!');
  };

  const pauseStimulation = () => {
    setIsPaused(true);
    setStimulationLevel(0);
  };

  const resumeStimulation = () => {
    setIsPaused(false);
    setStimulationLevel(1);
  };

  const stopSession = () => {
    setIsStimulating(false);
    setIsMonitoring(false);
    setHeartRate(0);
    setSessionTime(0);
    
    if (hrCharacteristic.current) {
      hrCharacteristic.current.stopNotifications();
    }

    toast.success('Session ended');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-pink-400" />
            Edge Play
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-24 space-y-6">
        {/* Heart Rate Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-8 text-center border transition-all ${
            isPaused
              ? 'bg-gradient-to-br from-yellow-900/30 to-yellow-900/10 border-yellow-500/30'
              : heartRate >= HEART_RATE_THRESHOLD
              ? 'bg-gradient-to-br from-red-900/30 to-red-900/10 border-red-500/30'
              : 'bg-gradient-to-br from-pink-900/30 to-pink-900/10 border-pink-500/30'
          }`}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Heart className={`w-6 h-6 ${heartRate >= HEART_RATE_THRESHOLD ? 'text-red-400 animate-pulse' : 'text-pink-400'}`} />
            <span className="text-5xl font-bold text-white">{heartRate}</span>
            <span className="text-2xl text-zinc-400">BPM</span>
          </div>
          {isPaused && (
            <p className="text-yellow-400 font-medium text-sm mt-2">Paused - Heart rate too high</p>
          )}
          {isStimulating && !isPaused && (
            <p className="text-pink-400 font-medium text-sm mt-2">Stimulating</p>
          )}
        </motion.div>

        {/* Session Info */}
        {isStimulating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3"
          >
            <div className="bg-zinc-900/50 rounded-xl p-4 text-center border border-zinc-800">
              <p className="text-zinc-400 text-xs mb-1">Time</p>
              <p className="text-white font-bold text-lg">{formatTime(sessionTime)}</p>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-4 text-center border border-zinc-800">
              <p className="text-zinc-400 text-xs mb-1">Max HR</p>
              <p className="text-red-400 font-bold text-lg">{maxHeartRate}</p>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-4 text-center border border-zinc-800">
              <p className="text-zinc-400 text-xs mb-1">Level</p>
              <p className="text-pink-400 font-bold text-lg">{stimulationLevel}</p>
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-4"
        >
          <h2 className="text-white font-bold flex items-center gap-2">
            <Bluetooth className="w-5 h-5 text-blue-400" />
            Device Connection
          </h2>

          {/* Heart Monitor */}
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-white font-medium text-sm">Heart Rate Monitor</span>
              </div>
              {hrDevice && <span className="text-green-400 text-xs font-bold">Connected</span>}
            </div>
            {!hrDevice ? (
              <Button
                onClick={connectHeartMonitor}
                variant="outline"
                className="w-full bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600 text-sm"
              >
                <Plus className="w-3 h-3 mr-2" />
                Connect Heart Monitor
              </Button>
            ) : (
              <p className="text-zinc-400 text-xs">{hrDevice.name}</p>
            )}
          </div>

          {/* Toy Connection */}
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-white font-medium text-sm">Bluetooth Toy</span>
              </div>
              {toyDevice && <span className="text-green-400 text-xs font-bold">Connected</span>}
            </div>
            {!toyDevice ? (
              <Button
                onClick={connectToy}
                variant="outline"
                className="w-full bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600 text-sm"
              >
                <Plus className="w-3 h-3 mr-2" />
                Connect Toy
              </Button>
            ) : (
              <p className="text-zinc-400 text-xs">{toyDevice.name}</p>
            )}
          </div>
        </motion.div>

        {/* Session Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {!isStimulating ? (
            <Button
              onClick={startStimulation}
              disabled={!hrDevice || !toyDevice}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 py-6 text-lg font-bold rounded-2xl"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Edge Session
            </Button>
          ) : (
            <>
              {!isPaused ? (
                <Button
                  onClick={pauseStimulation}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 py-6 text-lg font-bold rounded-2xl"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause (Manual)
                </Button>
              ) : (
                <Button
                  onClick={resumeStimulation}
                  className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg font-bold rounded-2xl"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </Button>
              )}
              <Button
                onClick={stopSession}
                variant="destructive"
                className="w-full py-6 text-lg font-bold rounded-2xl"
              >
                <X className="w-5 h-5 mr-2" />
                End Session
              </Button>
            </>
          )}
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-5"
        >
          <p className="text-blue-400 font-medium text-sm mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            How Edge Play Works
          </p>
          <ul className="text-blue-400/70 text-xs space-y-1 ml-2">
            <li>• Connect your heart rate monitor and toy</li>
            <li>• Stimulation pauses when heart rate reaches {HEART_RATE_THRESHOLD}+ BPM</li>
            <li>• Automatically resumes when heart rate drops below {NORMAL_HR} BPM</li>
            <li>• Manual pause/resume available anytime</li>
          </ul>
        </motion.div>

        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-red-900/20 border border-red-500/30 rounded-2xl p-5 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium text-sm">Health & Safety</p>
            <p className="text-red-500/70 text-xs mt-1">
              Stop immediately if you feel pain, numbness, or discomfort. Edge play involves physical intensity—always prioritize your health.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
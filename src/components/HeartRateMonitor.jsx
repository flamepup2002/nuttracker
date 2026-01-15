import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Bluetooth, BluetoothOff, Activity } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function HeartRateMonitor({ onHeartRateChange, onDataPoint }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [heartRate, setHeartRate] = useState(null);
  const [device, setDevice] = useState(null);
  const characteristicRef = useRef(null);

  const connectToMonitor = async () => {
    if (!navigator.bluetooth) {
      toast.error('Bluetooth not supported', {
        description: 'Your browser doesn\'t support Web Bluetooth API'
      });
      return;
    }

    setIsConnecting(true);
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['heart_rate'] },
          { namePrefix: 'H808' },
          { namePrefix: 'Cospo' }
        ],
        optionalServices: ['heart_rate', 'battery_service']
      });

      device.addEventListener('gattserverdisconnected', handleDisconnect);
      setDevice(device);

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');
      
      characteristicRef.current = characteristic;
      
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleHeartRateChange);
      
      setIsConnected(true);
      toast.success('Heart monitor connected!', {
        description: device.name || 'Cospo H808S'
      });
    } catch (error) {
      console.error('Connection failed:', error);
      if (error.name !== 'NotFoundError') {
        toast.error('Connection failed', {
          description: error.message
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleHeartRateChange = (event) => {
    const value = event.target.value;
    const flags = value.getUint8(0);
    let bpm;
    
    if (flags & 0x01) {
      bpm = value.getUint16(1, true);
    } else {
      bpm = value.getUint8(1);
    }
    
    setHeartRate(bpm);
    if (onHeartRateChange) onHeartRateChange(bpm);
    if (onDataPoint) onDataPoint({ timestamp: Date.now(), bpm });
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setHeartRate(null);
    toast.info('Heart monitor disconnected');
  };

  const disconnect = async () => {
    if (device && device.gatt.connected) {
      if (characteristicRef.current) {
        try {
          await characteristicRef.current.stopNotifications();
        } catch (e) {}
      }
      device.gatt.disconnect();
    }
    setIsConnected(false);
    setHeartRate(null);
    setDevice(null);
  };

  useEffect(() => {
    return () => {
      if (device && device.gatt.connected) {
        device.gatt.disconnect();
      }
    };
  }, [device]);

  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-pink-500" />
          <span className="text-zinc-400 text-sm font-medium">Heart Rate</span>
        </div>
        {isConnected ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={disconnect}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <BluetoothOff className="w-4 h-4 mr-1" />
            Disconnect
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={connectToMonitor}
            disabled={isConnecting}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
          >
            <Bluetooth className="w-4 h-4 mr-1" />
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        )}
      </div>

      <div className="flex items-center justify-center py-4">
        {isConnected && heartRate ? (
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 60 / (heartRate || 60), ease: "easeInOut" }}
            >
              <Heart className="w-12 h-12 text-red-500 fill-red-500" />
            </motion.div>
            <div>
              <span className="text-5xl font-bold text-white">{heartRate}</span>
              <span className="text-zinc-400 text-lg ml-2">BPM</span>
            </div>
          </div>
        ) : isConnected ? (
          <div className="text-zinc-500 flex items-center gap-2">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Heart className="w-8 h-8" />
            </motion.div>
            <span>Waiting for signal...</span>
          </div>
        ) : (
          <div className="text-center">
            <Heart className="w-12 h-12 text-zinc-700 mx-auto mb-2" />
            <p className="text-zinc-500 text-sm">Connect your Cospo H808S</p>
            <p className="text-zinc-600 text-xs mt-1">Uses Web Bluetooth API</p>
          </div>
        )}
      </div>
    </div>
  );
}
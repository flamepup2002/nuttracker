import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bluetooth, Plus, Trash2, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function BluetoothToyConnect() {
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Load saved device on mount
  useEffect(() => {
    const saved = localStorage.getItem('bluetoothToyDevice');
    if (saved) {
      try {
        setConnectedDevice(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('bluetoothToyDevice');
      }
    }
  }, []);

  const scanForDevices = async () => {
    if (!navigator.bluetooth) {
      toast.error('Bluetooth not supported on this browser');
      return;
    }

    setScanning(true);
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access', 'generic_attribute', 'device_information']
      });

      setConnecting(true);
      
      const server = await device.gatt.connect();
      
      const connectedInfo = {
        id: device.id,
        name: device.name || 'Unknown Device',
        connected: true,
        connectedAt: new Date().toISOString()
      };

      setConnectedDevice(connectedInfo);
      localStorage.setItem('bluetoothToyDevice', JSON.stringify(connectedInfo));
      toast.success(`Connected to ${device.name || 'device'}!`);

      // Auto disconnect after 30 seconds of inactivity
      device.addEventListener('gattserverdisconnected', () => {
        setConnectedDevice(null);
        localStorage.removeItem('bluetoothToyDevice');
      });

    } catch (error) {
      if (error.name !== 'NotFoundError') {
        toast.error('Failed to connect: ' + error.message);
      }
    } finally {
      setScanning(false);
      setConnecting(false);
    }
  };

  const disconnectDevice = () => {
    setConnectedDevice(null);
    localStorage.removeItem('bluetoothToyDevice');
    toast.success('Device disconnected');
  };

  return (
    <div className="space-y-4">
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-purple-400 font-medium text-sm">Bluetooth Connection</p>
          <p className="text-purple-500/70 text-xs mt-1">
            Connect compatible Bluetooth sex toys for synchronized control during sessions.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {connectedDevice ? (
          <motion.div
            key="connected"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-green-900/20 border border-green-500/30 rounded-xl p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{connectedDevice.name}</p>
                  <p className="text-green-400 text-xs mt-1">Connected</p>
                  <p className="text-zinc-500 text-xs mt-2">
                    {new Date(connectedDevice.connectedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <Button
                onClick={disconnectDevice}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="disconnected"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button
              onClick={scanForDevices}
              disabled={scanning || connecting}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {scanning || connecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {scanning ? 'Scanning...' : 'Connecting...'}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Connect Bluetooth Toy
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-zinc-800/50 rounded-xl p-4 text-xs text-zinc-400 space-y-2">
        <p className="font-medium text-zinc-300">Compatible Devices:</p>
        <ul className="space-y-1 ml-2">
          <li>• Standard Bluetooth LE sex toys</li>
          <li>• Vibrators with Bluetooth control</li>
          <li>• Smart wearables</li>
        </ul>
      </div>
    </div>
  );
}
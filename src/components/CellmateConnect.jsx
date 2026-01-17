import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Bluetooth, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CellmateConnect({ onDeviceConnected }) {
  const [device, setDevice] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const connectDevice = async () => {
    try {
      setConnecting(true);

      // Request Bluetooth device
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Cellmate' }, // Cellmate 2 & 3
          { namePrefix: 'QIUI' },     // CAGINK Pro
        ],
        optionalServices: ['battery_service', 'device_information']
      });

      // Connect to GATT server
      const server = await bluetoothDevice.gatt.connect();
      
      setDevice({
        name: bluetoothDevice.name,
        id: bluetoothDevice.id,
        server: server
      });

      onDeviceConnected({
        name: bluetoothDevice.name,
        id: bluetoothDevice.id,
        server: server
      });

      toast.success(`Connected to ${bluetoothDevice.name}`);
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      if (error.name === 'NotFoundError') {
        toast.error('No Cellmate device found nearby');
      } else if (error.name === 'SecurityError') {
        toast.error('Bluetooth access denied');
      } else {
        toast.error('Failed to connect to device');
      }
    } finally {
      setConnecting(false);
    }
  };

  const disconnectDevice = () => {
    if (device?.server) {
      device.server.disconnect();
    }
    setDevice(null);
    onDeviceConnected(null);
    toast.success('Device disconnected');
  };

  return (
    <div className="space-y-4">
      {!device ? (
        <Button
          onClick={connectDevice}
          disabled={connecting}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Bluetooth className="w-4 h-4 mr-2" />
          {connecting ? 'Searching...' : 'Connect Cellmate Device'}
        </Button>
      ) : (
        <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">{device.name}</p>
                <p className="text-green-400 text-xs">Connected</p>
              </div>
            </div>
            <Button
              onClick={disconnectDevice}
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
        <p className="text-blue-400 text-xs">
          ℹ️ Compatible with Cellmate 2, Cellmate 3, and CAGINK Pro by QIUI. Make sure Bluetooth is enabled.
        </p>
      </div>
    </div>
  );
}
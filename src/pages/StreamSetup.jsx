import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Video, Info } from 'lucide-react';
import StreamBroadcaster from '@/components/StreamBroadcaster';

export default function StreamSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionId = location.state?.sessionId;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Video className="w-5 h-5 text-red-500" />
            Go Live
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="px-6 pb-24 pt-6 space-y-6">
        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3"
        >
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-300 text-sm font-bold mb-1">Broadcasting Tips</p>
            <ul className="text-blue-400/80 text-xs space-y-1">
              <li>• Ensure good lighting for best video quality</li>
              <li>• Use a stable internet connection</li>
              <li>• Test audio before going live</li>
              <li>• Choose appropriate quality based on your bandwidth</li>
            </ul>
          </div>
        </motion.div>

        {/* Broadcaster Component */}
        <StreamBroadcaster sessionId={sessionId} />

        {/* Requirements */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-white font-bold text-sm mb-3">Browser Requirements</h3>
          <ul className="text-zinc-400 text-xs space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Chrome, Firefox, Safari, or Edge (latest version)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Camera and microphone permissions enabled</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Stable internet connection (5+ Mbps recommended)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
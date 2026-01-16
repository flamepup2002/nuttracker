import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Maximize2, Minimize2, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function GoonCam({ isActive }) {
  const [isCamActive, setIsCamActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCamActive(true);
      toast.success('Camera started');
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Failed to access camera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCamActive(false);
    toast.success('Camera stopped');
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      {!isCamActive ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-24 right-6 z-40"
        >
          <Button
            onClick={startCamera}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
          >
            <Camera className="w-4 h-4 mr-2" />
            Start GoonCam
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`fixed z-50 ${
            isExpanded 
              ? 'inset-4 md:inset-8' 
              : 'bottom-24 right-6 w-40 h-32 md:w-48 md:h-36'
          }`}
        >
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black border-2 border-pink-500/50 shadow-2xl shadow-pink-500/20">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
            
            {/* Controls Overlay */}
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={stopCamera}
                className="w-8 h-8 rounded-lg bg-red-500/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Indicator */}
            <div className="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-500"
              />
              <span className="text-white text-xs font-medium">LIVE</span>
            </div>
          </div>
        </motion.div>
      )}

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </AnimatePresence>
  );
}
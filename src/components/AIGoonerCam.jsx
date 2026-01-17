import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Radio, Heart, Users, Volume2, VolumeX } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function AIGoonerCam() {
  const [currentImage, setCurrentImage] = useState(null);
  const [isStreaming, setIsStreaming] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [viewerCount, setViewerCount] = useState(Math.floor(Math.random() * 150) + 50);
  const [streamDuration, setStreamDuration] = useState(0);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateAIGoonContent');
      return response.data;
    },
    onSuccess: (data) => {
      setCurrentImage(data.url);
    },
    onError: () => {
      toast.error('Stream interrupted');
    },
  });

  const chatMutation = useMutation({
    mutationFn: async (message) => {
      const response = await base44.functions.invoke('aiLiveStreamChat', {
        message,
        streamDuration
      });
      return response.data;
    },
    onSuccess: (data) => {
      setStreamChat(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      }]);
    },
  });

  // Generate initial image
  useEffect(() => {
    generateMutation.mutate();
  }, []);

  // Auto-refresh stream every 5 seconds for live feel
  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        generateMutation.mutate();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isStreaming]);

  // Stream timer
  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        setStreamDuration(prev => prev + 1);
        setViewerCount(prev => Math.max(10, prev + Math.floor(Math.random() * 5) - 2));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isStreaming]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = {
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString()
    };
    setStreamChat(prev => [...prev, userMsg]);
    chatMutation.mutate(chatInput);
    setChatInput('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [streamChat]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Live Stream */}
      <div className="space-y-4">
        {/* Stream Container */}
        <div className="relative aspect-video bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-2xl overflow-hidden border border-purple-500/30">
          <AnimatePresence mode="wait">
            {generateMutation.isPending ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                  <p className="text-white font-bold text-sm">Streaming...</p>
                </div>
              </motion.div>
            ) : currentImage ? (
              <motion.img
                key={currentImage}
                src={currentImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full object-cover"
                alt="Live Stream"
              />
            ) : null}
          </AnimatePresence>

          {/* Live Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full animate-pulse">
            <Radio className="w-3 h-3 text-white animate-pulse" />
            <span className="text-white text-xs font-bold">LIVE</span>
          </div>

          {/* Stream Info */}
          <div className="absolute top-4 right-4 space-y-2">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
              <Users className="w-3 h-3 text-white" />
              <span className="text-white text-xs font-bold">{viewerCount.toLocaleString()}</span>
            </div>
            <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-white text-xs font-bold">{formatTime(streamDuration)}</span>
            </div>
          </div>

          {/* Stream Controls Bottom */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-white text-xs">AI Live Stream</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsMuted(!isMuted)}
              className="bg-black/40 hover:bg-black/60 text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Stream Controls */}
        <div className="flex gap-2">
          <Button
            onClick={() => setIsStreaming(!isStreaming)}
            className={isStreaming ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}
            variant="default"
          >
            <Radio className="w-4 h-4 mr-2" />
            {isStreaming ? 'Stop Stream' : 'Start Stream'}
          </Button>
          <Button
            variant="outline"
            className="border-purple-500 text-purple-400 hover:bg-purple-600/20"
          >
            <Heart className="w-4 h-4" />
          </Button>
        </div>
      </div>


    </div>
  );
}
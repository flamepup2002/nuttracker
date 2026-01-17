import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function AIGoonerCam() {
  const [currentImage, setCurrentImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const response = await base44.functions.invoke('generateAIGoonContent');
      return response.data;
    },
    onSuccess: (data) => {
      setCurrentImage(data.url);
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
      toast.error('Failed to generate content');
    },
  });

  useEffect(() => {
    generateMutation.mutate();
  }, []);

  useEffect(() => {
    if (autoRefresh && !isGenerating) {
      const interval = setInterval(() => {
        generateMutation.mutate();
      }, 30000); // Generate new image every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, isGenerating]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-2xl overflow-hidden border border-purple-500/30">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                <p className="text-white font-bold">Generating AI Content...</p>
              </div>
            </motion.div>
          ) : currentImage ? (
            <motion.img
              key={currentImage}
              src={currentImage}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full object-cover"
              alt="AI Generated"
            />
          ) : null}
        </AnimatePresence>

        {/* AI Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-purple-600 px-3 py-1 rounded-full">
          <Sparkles className="w-3 h-3 text-white animate-pulse" />
          <span className="text-white text-xs font-bold">AI GENERATED</span>
        </div>

        {/* Auto-refresh indicator */}
        {autoRefresh && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
            <Zap className="w-3 h-3 text-yellow-400 animate-pulse" />
            <span className="text-white text-xs">Auto</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={isGenerating}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
          Generate New
        </Button>
        <Button
          onClick={() => setAutoRefresh(!autoRefresh)}
          variant="outline"
          className={autoRefresh ? 'border-purple-500 text-purple-400' : 'border-zinc-700'}
        >
          <Zap className="w-4 h-4 mr-2" />
          {autoRefresh ? 'Auto On' : 'Auto Off'}
        </Button>
      </div>

      <div className="text-center text-xs text-zinc-500">
        AI generates new content every 30 seconds when auto mode is on
      </div>
    </div>
  );
}
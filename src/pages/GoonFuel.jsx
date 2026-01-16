import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Zap, Eye, EyeOff, Loader } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function GoonFuel() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || { goon_censor_enabled: false };
    },
  });

  const generateGoonFuel = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const response = await base44.functions.invoke('generateGoonFuel', {});
      if (response.data.error) {
        toast.error(response.data.error);
      } else {
        setImages(prev => [response.data.image, ...prev]);
        toast.success('Goon fuel generated!');
      }
    } catch (error) {
      toast.error('Failed to generate fuel');
    } finally {
      setIsGenerating(false);
    }
  };

  const isCensored = settings?.goon_censor_enabled;

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="relative px-6 py-4 flex items-center justify-between border-b border-zinc-800">
        <button
          onClick={() => navigate(createPageUrl('Home'))}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Zap className="w-5 h-5 text-pink-400" />
          Goon Fuel
        </h1>
        <div>
          {isCensored ? (
            <EyeOff className="w-5 h-5 text-blue-400" />
          ) : (
            <Eye className="w-5 h-5 text-pink-400" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Generate Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateGoonFuel}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Generate Goon Fuel
            </>
          )}
        </motion.button>

        {/* Images Grid */}
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {images.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="relative rounded-2xl overflow-hidden bg-zinc-900"
              >
                <img
                  src={img.url}
                  alt={img.caption}
                  className={`w-full h-auto ${isCensored ? 'blur-2xl' : ''}`}
                />
                
                {/* Caption Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-white text-center text-sm font-semibold">
                    {img.caption}
                  </p>
                </div>

                {/* Censor Notice */}
                {isCensored && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="text-center">
                      <EyeOff className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-blue-400 text-xs">Beta Censor Active</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {images.length === 0 && !isGenerating && (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">No fuel yet. Generate some to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
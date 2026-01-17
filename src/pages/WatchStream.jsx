import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Video } from 'lucide-react';
import StreamViewer from '@/components/StreamViewer';

export default function WatchStream() {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const sessions = await base44.entities.Session.filter({ id: sessionId });
      return sessions[0] || null;
    },
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session || !session.broadcast_enabled) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center">
          <Video className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h2 className="text-white font-bold text-xl mb-2">Stream Not Available</h2>
          <p className="text-zinc-400 text-sm mb-6">This stream is no longer live or doesn't exist.</p>
          <button
            onClick={() => navigate(createPageUrl('GoonerCam'))}
            className="text-purple-400 hover:text-purple-300"
          >
            Back to GoonerCam
          </button>
        </div>
      </div>
    );
  }

  const broadcaster = {
    username: session.created_by?.split('@')[0] || 'Anonymous'
  };

  const viewerCount = Math.floor(Math.random() * 200) + 50;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('GoonerCam'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-400" />
            Live Stream
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="px-6 pb-24 pt-6">
        <StreamViewer 
          stream={session} 
          broadcaster={broadcaster}
          viewerCount={viewerCount}
        />
      </div>
    </div>
  );
}
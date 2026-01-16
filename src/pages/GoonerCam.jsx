import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  ArrowLeft, Video, Users, Eye, Heart, MessageCircle,
  Radio, Zap, Crown, Search
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const FEATURED_CAMS = [
  {
    id: 1,
    username: 'edgegod420',
    viewers: 1234,
    duration: '2h 15m',
    tags: ['edging', 'marathon', 'findom'],
    isLive: true,
    isPremium: false
  },
  {
    id: 2,
    username: 'ruinedking',
    viewers: 892,
    duration: '45m',
    tags: ['ruined', 'denial', 'bdsm'],
    isLive: true,
    isPremium: true
  },
  {
    id: 3,
    username: 'goonstick69',
    viewers: 2156,
    duration: '3h 30m',
    tags: ['endurance', 'breathplay'],
    isLive: true,
    isPremium: false
  },
  {
    id: 4,
    username: 'drained247',
    viewers: 567,
    duration: '1h 10m',
    tags: ['findom', 'cashgasm', 'drain'],
    isLive: true,
    isPremium: true
  },
  {
    id: 5,
    username: 'edgemaster',
    viewers: 1890,
    duration: '4h 05m',
    tags: ['marathon', 'poppers', 'extreme'],
    isLive: true,
    isPremium: false
  },
  {
    id: 6,
    username: 'deniedslut',
    viewers: 445,
    duration: '55m',
    tags: ['denial', 'chastity', 'tease'],
    isLive: true,
    isPremium: false
  }
];

function CamCard({ cam }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative rounded-2xl overflow-hidden cursor-pointer"
    >
      {/* Thumbnail/Preview */}
      <div className="aspect-video bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm border border-zinc-800 flex items-center justify-center relative">
        <Video className="w-12 h-12 text-zinc-600" />
        
        {/* Live Badge */}
        {cam.isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-600 px-2 py-1 rounded-full">
            <Radio className="w-3 h-3 text-white animate-pulse" />
            <span className="text-white text-xs font-bold">LIVE</span>
          </div>
        )}

        {/* Premium Badge */}
        {cam.isPremium && (
          <div className="absolute top-3 right-3 bg-yellow-600 px-2 py-1 rounded-full">
            <Crown className="w-3 h-3 text-white" />
          </div>
        )}

        {/* Duration */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
          <span className="text-white text-xs font-medium">{cam.duration}</span>
        </div>

        {/* Viewers */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
          <Eye className="w-3 h-3 text-white" />
          <span className="text-white text-xs font-medium">{cam.viewers.toLocaleString()}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-zinc-900/50 border-x border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white font-bold">{cam.username}</p>
          <div className="flex items-center gap-2 text-zinc-400">
            <button className="hover:text-pink-400 transition-colors">
              <Heart className="w-4 h-4" />
            </button>
            <button className="hover:text-blue-400 transition-colors">
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {cam.tags.map((tag, idx) => (
            <Badge key={idx} variant="outline" className="text-xs border-zinc-700 text-zinc-400">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function GoonerCam() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
        
        <div className="relative px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => navigate(createPageUrl('Home'))}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-400" />
              GoonerCam
            </h1>
            <div className="w-16" />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search cams, tags, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-900/50 border-zinc-800 text-white"
            />
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-4 mb-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Radio className="w-4 h-4 text-red-400" />
              <p className="text-xl font-bold text-white">24</p>
            </div>
            <p className="text-zinc-500 text-xs">Live Now</p>
          </div>
          <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-purple-400" />
              <p className="text-xl font-bold text-white">7.2k</p>
            </div>
            <p className="text-zinc-500 text-xs">Viewers</p>
          </div>
          <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <p className="text-xl font-bold text-white">156</p>
            </div>
            <p className="text-zinc-500 text-xs">Active</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Edging', 'Findom', 'Denial', 'Marathon', 'Breathplay', 'Poppers'].map((category) => (
            <Button
              key={category}
              variant={category === 'All' ? 'default' : 'outline'}
              size="sm"
              className={category === 'All' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Cam Grid */}
      <div className="px-6 space-y-6">
        <div>
          <h2 className="text-white font-bold text-lg mb-4">Featured Cams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURED_CAMS.map((cam) => (
              <CamCard key={cam.id} cam={cam} />
            ))}
          </div>
        </div>

        {/* Coming Soon Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-2xl p-6 text-center"
        >
          <Zap className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <h3 className="text-white font-bold text-xl mb-2">Go Live Soon!</h3>
          <p className="text-zinc-400 text-sm">
            Stream your goon sessions to the community. Coming in next update.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
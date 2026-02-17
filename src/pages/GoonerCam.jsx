import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  ArrowLeft, Video, Users, Eye, Heart, MessageCircle,
  Radio, Zap, Crown, Search, Lock, Filter, SlidersHorizontal, Star, TrendingUp, Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AIGoonerCam from '@/components/AIGoonerCam';



function CamCard({ cam, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
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
          <div className="flex items-center gap-3 text-zinc-400">
            <button className="hover:text-pink-400 transition-colors p-2 -m-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </button>
            <button className="hover:text-blue-400 transition-colors p-2 -m-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
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
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minViewers, setMinViewers] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [liveViewers, setLiveViewers] = useState({});

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['activeBroadcasts'] }),
      queryClient.invalidateQueries({ queryKey: ['userSettings'] }),
    ]);
  };

  const { data: settings, isLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || { goonercam_enabled: false };
    },
  });

  const { data: broadcasts = [], isLoading: broadcastsLoading } = useQuery({
    queryKey: ['activeBroadcasts'],
    queryFn: async () => {
      const sessions = await base44.entities.Session.filter({ status: 'active' }, '-created_date', 100);
      return sessions.filter(s => s.broadcast_enabled);
    },
    enabled: settings?.goonercam_enabled,
  });

  const { data: viewingHistory = [] } = useQuery({
    queryKey: ['viewingHistory'],
    queryFn: () => base44.entities.ViewingHistory.list('-created_date', 50),
    enabled: settings?.goonercam_enabled,
  });

  // Get personalized recommendations based on viewing history
  const recommendedTags = React.useMemo(() => {
    const tagCounts = {};
    viewingHistory.forEach(vh => {
      vh.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);
  }, [viewingHistory]);

  // Process and categorize broadcasts
  const processedBroadcasts = React.useMemo(() => {
    return broadcasts.map(b => {
      const viewerCount = liveViewers[b.id] || Math.floor(Math.random() * 500) + 50;
      const username = b.created_by?.split('@')[0] || 'Anonymous';
      const tags = b.tags || ['live'];
      
      // Calculate recommendation score
      const tagMatch = tags.some(t => recommendedTags.includes(t)) ? 2 : 0;
      const viewerBonus = viewerCount > 200 ? 1 : 0;
      const score = tagMatch + viewerBonus + Math.random();

      return {
        id: b.id,
        username,
        viewers: viewerCount,
        duration: b.duration_seconds ? `${Math.floor(b.duration_seconds / 60)}m` : '0m',
        tags,
        isLive: true,
        isPremium: viewerCount > 300,
        recommendationScore: score,
        isFeatured: viewerCount > 200,
      };
    });
  }, [broadcasts, recommendedTags, liveViewers]);

  // Filter broadcasts
  const filteredBroadcasts = React.useMemo(() => {
    return processedBroadcasts.filter(b => {
      const categoryMatch = selectedCategory === 'All' || b.tags.includes(selectedCategory.toLowerCase());
      const viewerMatch = b.viewers >= minViewers;
      const searchMatch = searchQuery === '' || 
        b.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return categoryMatch && viewerMatch && searchMatch;
    });
  }, [processedBroadcasts, selectedCategory, minViewers, searchQuery]);

  // Get featured and recommended streams
  const featuredStreams = filteredBroadcasts.filter(b => b.isFeatured).slice(0, 4);
  const recommendedStreams = filteredBroadcasts
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 6);
  const allStreams = filteredBroadcasts;

  // Real-time subscriptions for broadcast updates
  useEffect(() => {
    if (!settings?.goonercam_enabled || broadcasts.length === 0) return;

    const unsubscribes = broadcasts.map(broadcast => 
      base44.entities.Session.subscribe((event) => {
        if (event.id === broadcast.id && event.type === 'update') {
          setLiveViewers(prev => ({
            ...prev,
            [broadcast.id]: event.data.viewer_count || Math.floor(Math.random() * 500) + 50
          }));
        }
      })
    );

    return () => {
      unsubscribes.forEach(unsub => unsub?.());
    };
  }, [broadcasts, settings?.goonercam_enabled]);

  // Check for checkout success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    
    if (sessionId) {
      base44.functions.invoke('handleGoonerCamCheckoutSuccess', { sessionId })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['user'] });
          toast.success('Subscription activated! Check your profile for details.');
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(err => {
          toast.error('Failed to activate subscription: ' + err.message);
        });
    }
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!settings?.goonercam_enabled) {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-12">
        <button 
          onClick={() => navigate(createPageUrl('Home'))}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-zinc-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">GoonerCam Locked</h2>
          <p className="text-zinc-400 mb-6">Enable GoonerCam in Settings to access live sessions</p>
          <Button
            onClick={() => navigate(createPageUrl('Settings'))}
            className="bg-gradient-to-r from-pink-600 to-rose-600"
          >
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-black text-white pb-24">
        {/* Header */}
        <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
        
        <div className="relative px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Video className="w-6 h-6 text-purple-400" />
              GoonerCam
            </h1>
            <button 
              onClick={() => navigate(createPageUrl('StreamSubscriptions'))}
              className="text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              <Crown className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search cams, tags, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-900/50 border-zinc-800 text-white"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={`border-zinc-800 ${showFilters ? 'bg-purple-600 border-purple-600 text-white' : 'text-zinc-400'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 space-y-4"
            >
              <div>
                <label className="text-zinc-400 text-xs mb-2 block">Minimum Viewers</label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="50"
                  value={minViewers}
                  onChange={(e) => setMinViewers(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-white text-sm mt-1">{minViewers}+ viewers</p>
              </div>
              {recommendedTags.length > 0 && (
                <div>
                  <label className="text-zinc-400 text-xs mb-2 block">Your Preferences</label>
                  <div className="flex flex-wrap gap-2">
                    {recommendedTags.map(tag => (
                      <Badge key={tag} className="bg-purple-600/20 text-purple-400 border-purple-600/30">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-4 mb-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Radio className="w-4 h-4 text-red-400" />
              <p className="text-xl font-bold text-white">{broadcasts.length}</p>
            </div>
            <p className="text-zinc-500 text-xs">Live Now</p>
          </div>
          <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-purple-400" />
              <p className="text-xl font-bold text-white">{broadcasts.length > 0 ? (broadcasts.length * 50).toLocaleString() : '0'}</p>
            </div>
            <p className="text-zinc-500 text-xs">Viewers</p>
          </div>
          <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <p className="text-xl font-bold text-white">{broadcasts.length}</p>
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
              onClick={() => setSelectedCategory(category)}
              variant={category === selectedCategory ? 'default' : 'outline'}
              size="sm"
              className={category === selectedCategory 
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
      <div className="px-6 space-y-8">
        {broadcastsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredBroadcasts.length > 0 ? (
          <>
            {/* Featured Streams */}
            {featuredStreams.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-white font-bold text-lg">Featured</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredStreams.map((cam) => (
                    <CamCard 
                      key={cam.id} 
                      cam={cam}
                      onClick={() => navigate(createPageUrl('WatchStream').replace(':sessionId', cam.id))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recommended For You */}
            {recommendedTags.length > 0 && recommendedStreams.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <h2 className="text-white font-bold text-lg">Recommended For You</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedStreams.slice(0, 4).map((cam) => (
                    <CamCard 
                      key={cam.id} 
                      cam={cam}
                      onClick={() => navigate(createPageUrl('WatchStream').replace(':sessionId', cam.id))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Live Streams */}
            <div>
              <h2 className="text-white font-bold text-lg mb-4">All Live ({allStreams.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allStreams.map((cam) => (
                  <CamCard 
                    key={cam.id} 
                    cam={cam}
                    onClick={() => navigate(createPageUrl('WatchStream').replace(':sessionId', cam.id))}
                  />
                ))}
              </div>
            </div>
          </>
        ) : broadcasts.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Filter className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-white font-bold text-xl mb-2">No Results</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Try adjusting your filters or search terms
            </p>
            <Button
              onClick={() => {
                setSelectedCategory('All');
                setMinViewers(0);
                setSearchQuery('');
              }}
              variant="outline"
              className="border-zinc-700"
            >
              Clear Filters
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center py-8">
              <Video className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <h3 className="text-white font-bold text-xl mb-2">No Live Broadcasts</h3>
              <p className="text-zinc-400 text-sm mb-4">
                No one is broadcasting right now, but you can still goon to AI
              </p>
            </div>

            {/* AI GoonerCam */}
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-white font-bold text-lg">AI GoonerCam</h2>
              </div>
              <AIGoonerCam />
            </div>
          </motion.div>
        )}
      </div>
      </div>
    </PullToRefresh>
  );
}
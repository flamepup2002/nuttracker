import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Heart, MessageCircle, Users, Radio } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function StreamViewer({ stream, broadcaster, viewerCount }) {
  const [message, setMessage] = useState('');
  const [liked, setLiked] = useState(false);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      // In a real implementation, this would send to chat backend
      console.log('Message sent:', message);
      setMessage('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Stream Video */}
      <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
        <div className="w-full h-full flex items-center justify-center text-zinc-600">
          <Video className="w-16 h-16 mb-3" />
        </div>

        {/* Live Indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
          <Radio className="w-3 h-3 text-white animate-pulse" />
          <span className="text-white text-sm font-bold">LIVE</span>
        </div>

        {/* Viewer Count */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
          <Users className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-bold">{viewerCount || 0}</span>
        </div>

        {/* Broadcaster Info */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
            <p className="text-white font-bold">{broadcaster?.username || 'Anonymous'}</p>
            <p className="text-zinc-400 text-xs">Broadcasting now</p>
          </div>
        </div>
      </div>

      {/* Interaction Controls */}
      <div className="flex gap-2">
        <Button
          onClick={() => setLiked(!liked)}
          variant="outline"
          className={`flex-1 ${liked ? 'bg-pink-600 border-pink-600 text-white' : 'border-zinc-700'}`}
        >
          <Heart className={`w-4 h-4 mr-2 ${liked ? 'fill-current' : ''}`} />
          {liked ? 'Liked' : 'Like'}
        </Button>
        <Button
          variant="outline"
          className="border-zinc-700"
        >
          <MessageCircle className="w-4 h-4" />
        </Button>
      </div>

      {/* Chat */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-white font-bold text-sm mb-3">Live Chat</h3>
        
        {/* Chat Messages */}
        <div className="space-y-2 mb-3 h-32 overflow-y-auto">
          <p className="text-zinc-500 text-xs italic">Chat will appear here during live stream</p>
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Send a message..."
            className="bg-zinc-900 border-zinc-800 text-white text-sm"
          />
          <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700">
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
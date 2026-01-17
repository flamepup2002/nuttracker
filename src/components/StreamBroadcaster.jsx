import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, VideoOff, Mic, MicOff, Monitor, Camera, Settings as SettingsIcon, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function StreamBroadcaster({ sessionId, onViewerCountChange }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [streamSource, setStreamSource] = useState('camera'); // camera or screen
  const [quality, setQuality] = useState('720p');
  const [viewerCount] = useState(0);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const QUALITY_SETTINGS = {
    '360p': { width: 640, height: 360, frameRate: 24 },
    '480p': { width: 854, height: 480, frameRate: 30 },
    '720p': { width: 1280, height: 720, frameRate: 30 },
    '1080p': { width: 1920, height: 1080, frameRate: 30 }
  };

  const startStream = async () => {
    try {
      const qualityConfig = QUALITY_SETTINGS[quality];
      let mediaStream;

      if (streamSource === 'camera') {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: qualityConfig.width },
            height: { ideal: qualityConfig.height },
            frameRate: { ideal: qualityConfig.frameRate }
          },
          audio: audioEnabled
        });
      } else {
        // Screen sharing
        mediaStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: qualityConfig.width },
            height: { ideal: qualityConfig.height },
            frameRate: { ideal: qualityConfig.frameRate }
          },
          audio: audioEnabled
        });
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setIsStreaming(true);
      toast.success('Stream started');
    } catch (error) {
      console.error('Error starting stream:', error);
      toast.error('Failed to start stream. Please check camera/microphone permissions.');
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    toast.success('Stream stopped');
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Stream Preview */}
      <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
        {isStreaming ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Live Indicator */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-sm font-bold">LIVE</span>
            </div>
            {/* Viewer Count */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">{viewerCount}</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
            <Video className="w-16 h-16 mb-3" />
            <p className="text-sm">Stream preview will appear here</p>
          </div>
        )}
      </div>

      {/* Quality Settings (shown before streaming) */}
      {!isStreaming && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <SettingsIcon className="w-4 h-4 text-purple-400" />
            <h3 className="text-white font-bold">Stream Settings</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 text-xs mb-2 block">Source</label>
              <Select value={streamSource} onValueChange={setStreamSource}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="camera">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Camera
                    </div>
                  </SelectItem>
                  <SelectItem value="screen">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      Screen
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-zinc-400 text-xs mb-2 block">Quality</label>
              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="360p">360p (Low)</SelectItem>
                  <SelectItem value="480p">480p (Medium)</SelectItem>
                  <SelectItem value="720p">720p (HD)</SelectItem>
                  <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={audioEnabled}
                onChange={(e) => setAudioEnabled(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              Enable Audio
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={videoEnabled}
                onChange={(e) => setVideoEnabled(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              Enable Video
            </label>
          </div>
        </motion.div>
      )}

      {/* Stream Controls */}
      <div className="flex gap-3">
        {!isStreaming ? (
          <Button
            onClick={startStream}
            className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
          >
            <Video className="w-4 h-4 mr-2" />
            Start Broadcast
          </Button>
        ) : (
          <>
            <Button
              onClick={toggleAudio}
              variant="outline"
              className={`flex-1 ${audioEnabled ? 'border-zinc-700' : 'bg-red-900/30 border-red-500/30'}`}
            >
              {audioEnabled ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
              {audioEnabled ? 'Mute' : 'Unmute'}
            </Button>
            
            <Button
              onClick={toggleVideo}
              variant="outline"
              className={`flex-1 ${videoEnabled ? 'border-zinc-700' : 'bg-red-900/30 border-red-500/30'}`}
            >
              {videoEnabled ? <Video className="w-4 h-4 mr-2" /> : <VideoOff className="w-4 h-4 mr-2" />}
              {videoEnabled ? 'Hide' : 'Show'}
            </Button>

            <Button
              onClick={stopStream}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              End Broadcast
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
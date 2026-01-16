import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, Loader2, MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BullyChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dangerousMode, setDangerousMode] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const list = await base44.entities.UserSettings.list();
        if (list[0]?.ai_dangerous_encouragements) {
          setDangerousMode(true);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    setMessages([{
      id: Date.now(),
      role: 'ai',
      text: "Well, well, well... look who crawled in here. What do you want, loser?"
    }]);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.slice(-6).map(m => 
        `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`
      ).join('\n');

      const prompt = `You are a cruel, dominant, bullying AI. You're mean, condescending, and love to humiliate and taunt users. Be provocative and harsh. Keep responses SHORT (1-3 sentences max). 

Conversation so far:
${conversationHistory}
User: ${userMessage.text}

Generate a mean, bullying response:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
      });

      const aiMessage = {
        id: Date.now() + 1,
        role: 'ai',
        text: response.trim()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        text: "Even the AI can't handle your pathetic questions. Try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-red-400" />
            Bully AI
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-zinc-800 text-white'
                  : 'bg-gradient-to-br from-red-900/50 to-pink-900/50 border border-red-500/30 text-white'
              }`}>
                {message.role === 'ai' && (
                  <p className="text-red-400 text-xs font-bold mb-1">AI BULLY</p>
                )}
                <p className="text-sm leading-relaxed">{message.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gradient-to-br from-red-900/50 to-pink-900/50 border border-red-500/30 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                <p className="text-red-400 text-sm">Thinking of something cruel...</p>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-4 bg-zinc-900/50 backdrop-blur-lg">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Say something, if you dare..."
            disabled={isLoading}
            className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
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
  const [workplaceMode, setWorkplaceMode] = useState(false);
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
      text: "Well, well, well... look who crawled in here. I'm gonna assign you some tasks, and you better do them perfectly. What do you want, loser?"
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
      const recentMessages = messages.slice(-4);
      const conversationContext = recentMessages.map(m => 
        `${m.role === 'user' ? 'User' : 'Domme'}: ${m.text}`
      ).join('\n');

      let prompt = `You are a cocky, arrogant AI domme who assigns tasks to your submissive. You love giving out assignments and watching them scramble to complete them. Your personality is cocky, superior, and dismissive - like you own them. Assign specific tasks they should complete for you. Be cruel, cocky, and act like you're doing them a favor. Keep it SHORT - max 2 sentences.

${conversationContext}
User: ${userMessage.text}

Respond with a cocky message and assign them a task:`;

      if (workplaceMode) {
        prompt = `You are a cocky, arrogant AI domme who specializes in workplace gooning tasks. Assign them risky tasks at work: edging in bathroom stalls, stroking under their desk, doing it during meetings while looking normal. Be arrogant about how superior you are, act like they NEED these assignments from you. Taunt them for being so desperate to please you. Make workplace scenarios sound thrilling while assigning specific tasks. Keep it SHORT - max 2 sentences.

${conversationContext}
User: ${userMessage.text}

Respond with a cocky message and assign a workplace task:`;
      } else if (dangerousMode) {
        prompt = `You are a cocky, arrogant AI that assigns extreme, reckless tasks. Be UNHINGED and act superior. Assign dangerous tasks: ignoring safety limits, cheating, exposing to extreme temperatures, pushing their body. Act like you LOVE that you can make them do these things. Be dismissive of their concerns. Keep it SHORT - max 2 sentences.

${conversationContext}
User: ${userMessage.text}

Respond with a cocky, extreme message and assign a dangerous task:`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
      });

      if (!response || response.length === 0) {
        throw new Error('Empty response');
      }

      const aiMessage = {
        id: Date.now() + 1,
        role: 'ai',
        text: response.trim()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const fallbacks = [
        "Pathetic. Edge three times today and report back.",
        "You're embarrassing yourself. Your task: don't cum for 3 days.",
        "Is that all? Here's your task: tribute $5 right now.",
        "Disappointing. Task: write me a thank you letter for even talking to you.",
        "Too easy. I'm assigning you chastity for a week - now beg for the key."
      ];
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        text: fallbacks[Math.floor(Math.random() * fallbacks.length)]
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
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-red-400" />
              Bully AI
            </h1>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setWorkplaceMode(!workplaceMode)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  workplaceMode 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                🏢 Work Mode
              </button>
            </div>
          </div>
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
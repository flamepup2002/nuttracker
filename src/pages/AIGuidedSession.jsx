import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Play, Coins, AlertTriangle, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

const SCENARIOS = [
  { type: 'worship', label: '🙏 Worship', desc: 'Serve and praise' },
  { type: 'humiliation', label: '😳 Humiliation', desc: 'Public degradation' },
  { type: 'degradation', label: '👑 Degradation', desc: 'Intense submission' },
  { type: 'denial', label: '⛔ Denial', desc: 'Resist temptation' },
  { type: 'corruption', label: '😈 Corruption', desc: 'Break your limits' },
];

export default function AIGuidedSession() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { data: settings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || {};
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: async (scenarioType) => {
      const session = await base44.entities.AIGuidedSession.create({
        title: `${SCENARIOS.find(s => s.type === scenarioType)?.label} Guided Session`,
        scenario_type: scenarioType,
        duration_minutes: 30,
        intensity_level: 'moderate',
        base_cost: 5,
        started_at: new Date().toISOString(),
      });
      return session;
    },
    onSuccess: (session) => {
      setActiveSession(session);
      setMessages([
        {
          role: 'ai',
          content: `Welcome to your ${SCENARIOS.find(s => s.type === session.scenario_type)?.label} guided session. I'm going to take you on a journey of submission. Are you ready to begin?`,
        },
      ]);
    },
  });

  const stepMutation = useMutation({
    mutationFn: async (userInput) => {
      const response = await base44.functions.invoke('aiGuidedSessionStep', {
        sessionId: activeSession.id,
        userInput,
        scenarioType: activeSession.scenario_type,
        currentStep: activeSession.current_step || 0,
        dangerousMode: settings?.ai_dangerous_encouragements || false,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setActiveSession(prev => ({
        ...prev,
        current_step: data.currentStep,
        total_spent: (prev.total_spent || 0) + data.cost,
      }));
      setUser(prev => ({ ...prev, currency_balance: data.newBalance }));
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          content: data.response,
          cost: data.cost,
          teaser: data.nextStepTeaser,
        },
      ]);
      toast.success(`-${data.cost} coins`);
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userInput = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userInput }]);
    setIsLoading(true);

    try {
      await stepMutation.mutateAsync(userInput);
    } catch (error) {
      toast.error('Failed to generate next step');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    await base44.entities.AIGuidedSession.update(activeSession.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
    setActiveSession(null);
    setMessages([]);
    setSelectedScenario(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Active session view
  if (activeSession) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <button
            onClick={handleEndSession}
            className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>End Session</span>
          </button>
          <h1 className="text-lg font-bold">{activeSession.title}</h1>
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-500/30 rounded-lg px-3 py-1.5">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{user.currency_balance}</span>
          </div>
        </div>

        {/* Info Bar */}
        <div className="px-6 py-3 bg-zinc-900/50 border-b border-zinc-800">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Step {activeSession.current_step || 0}</span>
            <span>Spent: {activeSession.total_spent || 0} coins</span>
            <span>Duration: ~{activeSession.duration_minutes} min</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-pink-500/30 text-white'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  {msg.cost && (
                    <p className="text-xs text-red-300 mt-2 font-bold">-{msg.cost} coins</p>
                  )}
                  {msg.teaser && (
                    <p className="text-xs text-pink-300 italic mt-2">Next: {msg.teaser}</p>
                  )}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-zinc-800/50 rounded-2xl px-4 py-3">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-zinc-800">
          <div className="flex gap-3">
            <Input
              placeholder="Respond to the AI..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
              disabled={isLoading}
              className="bg-zinc-900 border-zinc-800 text-white"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Scenario selection view
  if (selectedScenario) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
          <button
            onClick={() => setSelectedScenario(null)}
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">
            {SCENARIOS.find(s => s.type === selectedScenario)?.label}
          </h1>
        </div>

        <div className="px-6 py-8 max-w-2xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 rounded-2xl p-8 space-y-6"
          >
            <div className="text-center">
              <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                {SCENARIOS.find(s => s.type === selectedScenario)?.label}
              </h2>
              <p className="text-zinc-400 mb-6">
                A personalized AI-guided journey tailored to your desires
              </p>
            </div>

            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2">
              <p className="text-sm text-zinc-300">
                ✨ AI adapts to your responses<br/>
                💰 Dynamic costs based on engagement<br/>
                🎯 Multi-step progression<br/>
                🔥 Customize intensity level
              </p>
            </div>

            <Button
              onClick={() => startSessionMutation.mutate(selectedScenario)}
              disabled={startSessionMutation.isPending}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 py-6 text-lg font-bold"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Session (5 coins)
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Scenarios grid
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <button
          onClick={() => navigate(createPageUrl('Home'))}
          className="text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">AI-Guided Sessions</h1>
      </div>

      <div className="px-6 py-8">
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 mb-8 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">
            Each step costs coins. AI adapts based on your responses.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {SCENARIOS.map((scenario) => (
            <motion.button
              key={scenario.type}
              onClick={() => setSelectedScenario(scenario.type)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-pink-500/30 rounded-2xl p-6 text-left hover:border-pink-500/60 transition-all"
            >
              <div className="text-2xl mb-2">{scenario.label.split(' ')[0]}</div>
              <h3 className="font-bold text-white mb-1">{scenario.label.split(' ').slice(1).join(' ')}</h3>
              <p className="text-xs text-zinc-400">{scenario.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
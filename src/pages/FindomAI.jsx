import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Send, Coins, AlertTriangle, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

export default function FindomAI() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: 'Welcome to Findom AI. I\'m here to drain your coins, and you\'re going to beg for the privilege. What do you have to say for yourself?',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [drainCard, setDrainCard] = useState(false);
  const [cardAmount, setCardAmount] = useState('5');
  const [coinAmount, setCoinAmount] = useState('10');
  const messagesEndRef = useRef(null);

  const { data: settings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || { findom_enabled: false };
    },
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (customCoins = null) => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const coinsSpending = customCoins || (!drainCard ? parseInt(coinAmount) || 0 : 0);
      const response = await base44.functions.invoke('findomAIDrain', {
        message: userMessage,
        coinsToSpend: coinsSpending,
        drainCard: drainCard && !customCoins,
        cardAmount: drainCard ? parseFloat(cardAmount) : null,
        dangerousMode: settings?.ai_dangerous_encouragements || false,
      });

      if (response.data.error) {
        toast.error(response.data.error);
        setMessages(prev => [
          ...prev,
          {
            role: 'ai',
            content: `Error: ${response.data.error}`,
          },
        ]);
      } else {
        setUser(prev => ({
          ...prev,
          currency_balance: response.data.newBalance,
        }));
        setMessages(prev => [
          ...prev,
          {
            role: 'ai',
            content: response.data.aiResponse,
            coinsSpent: response.data.coinsSpent,
            cardCharged: response.data.cardCharged,
            cardAmount: response.data.amount,
          },
        ]);
        toast.success(
          response.data.cardCharged 
            ? `Charged $${response.data.amount.toFixed(2)} to card` 
            : `Spent ${response.data.coinsSpent} coins`
        );
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const quickDemands = [
    { text: 'I want to tribute', coins: 10 },
    { text: 'Drain me completely', coins: 25 },
    { text: 'Tell me what I deserve', coins: null },
  ];

  // Check if findom is enabled
  if (!settings?.findom_enabled) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <Zap className="w-16 h-16 text-pink-500 mx-auto" />
          <h1 className="text-2xl font-bold">Findom AI Locked</h1>
          <p className="text-zinc-400 max-w-xs">
            Enable Findom Mode in your settings to access the Findom AI and begin your financial submission.
          </p>
          <Button
            onClick={() => navigate(createPageUrl('Settings'))}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 mt-4"
          >
            Go to Settings
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
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
          Findom AI
        </h1>
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-500/30 rounded-lg px-3 py-1.5">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 font-bold">{user?.currency_balance || 0}</span>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="px-6 pt-4">
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-xs">
            Findom AI will drain your kinkcoins. Spend responsibly.
          </p>
        </div>
      </div>

      {/* Chat Container */}
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
                {msg.coinsSpent && (
                  <p className="text-xs text-red-300 mt-2 font-bold">
                    -{msg.coinsSpent} coins
                  </p>
                )}
                {msg.cardCharged && (
                  <p className="text-xs text-red-300 mt-2 font-bold">
                    -${msg.cardAmount?.toFixed(2)} charged to card
                  </p>
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

      {/* Payment Mode Toggle */}
      <div className="px-6 py-3 bg-zinc-900/50 border-t border-zinc-800">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setDrainCard(false)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              !drainCard
                ? 'bg-pink-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <Coins className="w-4 h-4 inline mr-2" />
            Coins
          </button>
          <button
            onClick={() => setDrainCard(true)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              drainCard
                ? 'bg-red-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            💳 Card
          </button>
        </div>

        {drainCard && (
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Amount to charge (USD)</label>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={cardAmount}
              onChange={(e) => setCardAmount(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white h-8"
            />
          </div>
        )}
      </div>

      {/* Quick Demands */}
      <div className="px-6 py-3 space-y-2">
        <p className="text-xs text-zinc-500">Quick tributes:</p>
        <div className="flex gap-2 flex-wrap">
          {quickDemands.map((demand, idx) => (
            <Button
              key={idx}
              size="sm"
              variant="outline"
              className="bg-zinc-900 border-pink-500/30 text-pink-400 hover:bg-pink-900/30 text-xs"
              onClick={() => {
                setInputValue(demand.text);
                setTimeout(() => handleSendMessage(demand.coins), 100);
              }}
              disabled={isLoading}
            >
              {demand.text}
              {demand.coins && <Coins className="w-3 h-3 ml-1" />}
              {demand.coins && <span className="text-xs">{demand.coins}</span>}
            </Button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-zinc-800">
        <div className="flex gap-3">
          <Input
            placeholder="Beg for more instructions..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            disabled={isLoading}
            className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputValue.trim()}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
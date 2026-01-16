import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Send, Coins, AlertTriangle, Zap, Lock } from 'lucide-react';
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
  const messagesEndRef = useRef(null);

  const { data: settings, isLoadingSettings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || null;
    },
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  if (isLoadingSettings) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!settings?.findom_enabled) {
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
          <h2 className="text-2xl font-bold text-white mb-2">Findom Mode Locked</h2>
          <p className="text-zinc-400 mb-6">Enable Findom mode in Settings to access this feature</p>
          <Button
            onClick={() => navigate(createPageUrl('Settings'))}
            className="bg-gradient-to-r from-green-600 to-emerald-600"
          >
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

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
      const response = await base44.functions.invoke('findomAIDrain', {
        message: userMessage,
        coinsToSpend: customCoins,
      });

      if (response.data.error) {
        toast.error(response.data.error);
        setMessages(prev => [
          ...prev,
          {
            role: 'ai',
            content: `You don't have enough coins! You need ${response.data.requiredCoins} but only have ${response.data.currentBalance}. Buy more coins if you want to continue.`,
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
          },
        ]);
        toast.success(`Spent ${response.data.coinsSpent} coins`);
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardDrain = async () => {
    if (!cardAmount || parseFloat(cardAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    const userMessage = inputValue || 'I submit my card as tribute';
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: `Charges $${cardAmount} to card` }]);
    setIsLoading(true);

    try {
      const response = await base44.functions.invoke('findomCardDrain', {
        message: userMessage,
        amount: parseFloat(cardAmount),
      });

      if (response.data.error) {
        toast.error(response.data.error);
        setMessages(prev => [
          ...prev,
          {
            role: 'ai',
            content: response.data.error,
          },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'ai',
            content: response.data.aiResponse,
            cardCharged: response.data.amountCharged,
          },
        ]);
        toast.success(`$${response.data.amountCharged} charged`);
        setCardAmount('');
        setShowCardPayment(false);
      }
    } catch (error) {
      toast.error('Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const [showCardPayment, setShowCardPayment] = useState(false);
  const [cardAmount, setCardAmount] = useState('');

  const quickDemands = [
    { text: 'I want to tribute coins', coins: 10 },
    { text: 'Drain me completely', coins: 25 },
    { text: 'Take my money instead...', card: true },
  ];

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
                    CHARGED -${msg.cardCharged}
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
                if (demand.card) {
                  setShowCardPayment(true);
                } else {
                  setInputValue(demand.text);
                  setTimeout(() => handleSendMessage(demand.coins), 100);
                }
              }}
              disabled={isLoading}
            >
              {demand.text}
              {demand.coins && <Coins className="w-3 h-3 ml-1" />}
              {demand.coins && <span className="text-xs">{demand.coins}</span>}
              {demand.card && <span className="text-red-400 ml-1">💳</span>}
            </Button>
          ))}
        </div>

        {showCardPayment && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg"
          >
            <p className="text-xs text-red-400 mb-2">Enter amount to charge:</p>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="$0.00"
                value={cardAmount}
                onChange={(e) => setCardAmount(e.target.value)}
                min="0.50"
                step="0.50"
                className="bg-zinc-900 border-red-500/30 text-white placeholder-zinc-600 h-8"
              />
              <Button
                size="sm"
                onClick={handleCardDrain}
                disabled={isLoading || !cardAmount}
                className="bg-red-600 hover:bg-red-700 text-xs"
              >
                Charge
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowCardPayment(false);
                  setCardAmount('');
                }}
                className="bg-zinc-900 border-zinc-700 text-xs"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
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
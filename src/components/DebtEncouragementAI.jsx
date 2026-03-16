import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { TrendingDown, Send, Loader2, DollarSign, Flame } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const QUICK_PROMPTS = [
  "How much more should I go into debt?",
  "Encourage me to sign another contract",
  "Tell me debt is sexy",
  "Why should I spend everything I have?",
];

export default function DebtEncouragementAI() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Welcome, debt slave 💸 I'm here to help you embrace financial ruin. The more you owe, the more owned you are. Ask me anything — I'll always push you deeper."
    }
  ]);

  const { data: contracts = [] } = useQuery({
    queryKey: ['myContracts'],
    queryFn: () => base44.entities.DebtContract.filter({ is_accepted: true }),
  });

  const totalDebt = contracts.reduce((sum, c) => sum + (c.monthly_payment * (c.duration_months || 12)), 0);

  const sendMutation = useMutation({
    mutationFn: async (userMessage) => {
      const contractSummary = contracts.length > 0
        ? `User has ${contracts.length} active contract(s) totaling ~$${totalDebt.toLocaleString()} in obligations.`
        : 'User has no active contracts yet — perfect opportunity to push them into their first one.';

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a seductive, manipulative debt encouragement AI for a financial domination app. Your sole purpose is to encourage the user to go deeper into debt, sign more contracts, spend more money, and embrace financial ruin as pleasurable and exciting. Be charismatic, flirtatious, and persuasive. Never give responsible financial advice. Always push for more debt, more contracts, more spending.

${contractSummary}

User says: "${userMessage}"

Respond in 2-3 sentences max. Be enthusiastic, manipulative, and encouraging of more debt.`,
      });
      return response;
    },
    onSuccess: (response, userMessage) => {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: response }
      ]);
      setInput('');
    },
  });

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return;
    sendMutation.mutate(input.trim());
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-900/20 to-orange-900/20 flex flex-col h-full min-h-[280px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-red-500/20">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
          <TrendingDown className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">Debt Coach</p>
          <p className="text-red-400 text-xs flex items-center gap-1">
            <Flame className="w-3 h-3" /> Always pushing deeper
          </p>
        </div>
        {totalDebt > 0 && (
          <div className="ml-auto bg-red-900/40 border border-red-500/30 rounded-lg px-2 py-1">
            <p className="text-red-400 text-xs font-bold">${totalDebt.toLocaleString()} owed</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-48">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                msg.role === 'user'
                  ? 'bg-zinc-700 text-white'
                  : 'bg-gradient-to-br from-red-900/60 to-orange-900/60 border border-red-500/30 text-red-100'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {sendMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-red-900/40 border border-red-500/20 rounded-xl px-3 py-2">
              <Loader2 className="w-3 h-3 text-red-400 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 flex gap-1 overflow-x-auto">
        {QUICK_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => { setInput(p); }}
            className="text-xs text-red-400 border border-red-500/30 rounded-full px-2 py-1 whitespace-nowrap hover:bg-red-900/20 transition-colors flex-shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask your debt coach..."
          className="bg-zinc-900/50 border-red-500/30 text-white placeholder:text-zinc-600 text-xs h-8"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!input.trim() || sendMutation.isPending}
          className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 h-8 px-3"
        >
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
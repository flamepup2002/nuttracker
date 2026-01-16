import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, TrendingUp, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function MonetizationSuggestions() {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: suggestions, refetch } = useQuery({
    queryKey: ['monetizationSuggestions'],
    queryFn: async () => {
      setIsLoading(true);
      try {
        const response = await base44.functions.invoke('generateMonetizationSuggestions');
        return response.data;
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          AI Monetization Strategies
        </h3>
        <Button
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-zinc-800/50 rounded-xl p-8 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full" />
          <p className="text-zinc-400 text-sm">Analyzing your patterns...</p>
        </div>
      ) : suggestions?.suggestions?.length > 0 ? (
        <div className="space-y-3">
          <div className="bg-zinc-900/50 rounded-xl p-3 text-xs text-zinc-400 space-y-1">
            <p><span className="text-yellow-400 font-bold">Total Spent:</span> ${suggestions.stats.totalSpent.toFixed(2)}</p>
            <p><span className="text-yellow-400 font-bold">Sessions:</span> {suggestions.stats.totalSessions}</p>
            <p><span className="text-yellow-400 font-bold">Avg Cost:</span> ${suggestions.stats.avgSessionCost.toFixed(2)}</p>
          </div>

          {suggestions.suggestions.map((suggestion, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-800/50 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                className="w-full p-4 flex items-start justify-between hover:bg-zinc-700/50 transition-colors"
              >
                <div className="text-left flex-1">
                  <h4 className="text-white font-bold text-sm mb-1">{suggestion.strategy}</h4>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-block bg-yellow-900/40 text-yellow-300 text-xs px-2 py-1 rounded">
                      ${suggestion.recommended_price}
                    </span>
                    <span className={`inline-block text-xs px-2 py-1 rounded ${
                      suggestion.expected_engagement === 'high'
                        ? 'bg-green-900/40 text-green-300'
                        : suggestion.expected_engagement === 'medium'
                        ? 'bg-blue-900/40 text-blue-300'
                        : 'bg-zinc-700 text-zinc-300'
                    }`}>
                      {suggestion.expected_engagement} engagement
                    </span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${
                  expandedIndex === idx ? 'rotate-180' : ''
                }`} />
              </button>

              <AnimatePresence>
                {expandedIndex === idx && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-zinc-700 p-4 bg-zinc-900/50"
                  >
                    <p className="text-zinc-300 text-xs leading-relaxed mb-3">
                      {suggestion.reasoning}
                    </p>
                    <Button
                      size="sm"
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-xs"
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Create Plan
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-zinc-800/50 rounded-xl">
          <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-500 text-sm">Generate suggestions by engaging more</p>
        </div>
      )}
    </div>
  );
}
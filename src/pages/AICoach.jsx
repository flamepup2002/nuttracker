import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, Sparkles, TrendingUp, Target, 
  Lightbulb, DollarSign, Brain, Zap, RefreshCw
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

export default function AICoach() {
  const navigate = useNavigate();
  const [coaching, setCoaching] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: orgasms = [] } = useQuery({
    queryKey: ['orgasms'],
    queryFn: () => base44.entities.Orgasm.list('-created_date', 100),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-created_date', 50),
  });

  const { data: settings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || null;
    },
  });

  const generateCoaching = async () => {
    setLoading(true);
    try {
      const findomOrgasms = orgasms.filter(o => o.is_findom && o.cost > 0);
      const findomSessions = sessions.filter(s => s.is_findom && s.total_cost > 0);

      const userData = {
        total_findom_orgasms: findomOrgasms.length,
        total_findom_sessions: findomSessions.length,
        total_spent: findomOrgasms.reduce((sum, o) => sum + o.cost, 0),
        avg_session_cost: findomSessions.length > 0 
          ? findomSessions.reduce((sum, s) => sum + s.total_cost, 0) / findomSessions.length 
          : 0,
        avg_session_duration: findomSessions.length > 0
          ? findomSessions.reduce((sum, s) => sum + s.duration_seconds, 0) / findomSessions.length / 60
          : 0,
        highest_session_cost: Math.max(...findomSessions.map(s => s.total_cost), 0),
        current_settings: {
          base_cost: settings?.base_cost || 5,
          escalation_rate: settings?.escalation_rate || 0.5,
          interest_rate: settings?.interest_rate || 0,
        },
        orgasm_breakdown: {
          cumshot: orgasms.filter(o => o.type === 'cumshot').length,
          ruined: orgasms.filter(o => o.type === 'ruined').length,
          denied: orgasms.filter(o => o.type === 'denied').length,
          cashgasm: orgasms.filter(o => o.type === 'cashgasm').length,
        }
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert Findom (Financial Domination) coach analyzing a user's kink tracking data. Based on the following data, provide personalized coaching advice:

User Data:
${JSON.stringify(userData, null, 2)}

Provide a comprehensive coaching analysis with the following sections:

1. **Performance Overview**: Brief analysis of their current findom activity and spending patterns

2. **Optimization Opportunities**: Specific actionable recommendations to increase their findom experience and costs (e.g., adjusting base cost, escalation rate, interest rate, session timing)

3. **Session Structure Ideas**: 3-4 creative findom session structures or challenges tailored to their patterns (e.g., "Progressive Escalation Challenge", "Denial Tax Week", "Rush Hour Premium")

4. **Psychology & Mindset**: Tips on embracing the findom dynamic and getting more from the experience

5. **Risk Management**: Responsible advice on setting limits while still enjoying the kink

Keep the tone supportive, knowledgeable, and playfully dominant where appropriate. Be specific with numbers and recommendations based on their data.`,
        response_json_schema: {
          type: "object",
          properties: {
            overview: { type: "string" },
            optimization: { 
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            session_ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  suggested_settings: { type: "string" }
                }
              }
            },
            mindset_tips: { type: "array", items: { type: "string" } },
            risk_management: { type: "string" }
          }
        }
      });

      setCoaching(response);
      toast.success('Coaching generated!');
    } catch (error) {
      toast.error('Failed to generate coaching');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgasms.length > 0 || sessions.length > 0) {
      generateCoaching();
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
        
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            AI Coach
          </h1>
          <Button
            onClick={generateCoaching}
            disabled={loading}
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && !coaching && (
        <div className="px-6 pt-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-ping opacity-20" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Brain className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>
            <p className="text-white font-medium">Analyzing your patterns...</p>
            <p className="text-zinc-500 text-sm mt-1">This may take a moment</p>
          </motion.div>
        </div>
      )}

      {/* Coaching Content */}
      <AnimatePresence>
        {coaching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-6 pt-6 space-y-6"
          >
            {/* Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 rounded-2xl border border-purple-500/30 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-white font-bold text-lg">Performance Overview</h2>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed">
                {coaching.overview}
              </p>
            </motion.div>

            {/* Optimization Opportunities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h2 className="text-white font-bold text-lg">Optimization Opportunities</h2>
              </div>
              <div className="space-y-4">
                {coaching.optimization?.map((opt, idx) => (
                  <div key={idx} className="bg-zinc-800/50 rounded-xl p-4">
                    <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      {opt.title}
                    </h3>
                    <p className="text-zinc-400 text-sm">{opt.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Session Ideas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-400" />
                <h2 className="text-white font-bold text-lg">Session Structure Ideas</h2>
              </div>
              <div className="space-y-4">
                {coaching.session_ideas?.map((idea, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-5">
                    <h3 className="text-blue-400 font-bold mb-2">{idea.name}</h3>
                    <p className="text-zinc-300 text-sm mb-3">{idea.description}</p>
                    <div className="bg-black/30 rounded-lg p-3">
                      <p className="text-zinc-500 text-xs mb-1">Suggested Settings:</p>
                      <p className="text-zinc-300 text-sm">{idea.suggested_settings}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Mindset Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h2 className="text-white font-bold text-lg">Psychology & Mindset</h2>
              </div>
              <ul className="space-y-3">
                {coaching.mindset_tips?.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-zinc-300 text-sm">
                    <span className="text-pink-400 mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Risk Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-orange-900/20 border border-orange-500/30 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-orange-400" />
                <h2 className="text-white font-bold text-lg">Risk Management</h2>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed">
                {coaching.risk_management}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!loading && !coaching && orgasms.length === 0 && sessions.length === 0 && (
        <div className="px-6 pt-12">
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Data Yet</h3>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto">
              Start tracking your sessions and orgasms to receive personalized AI coaching
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
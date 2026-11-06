import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plane, Send, Loader2, Ban, Radio, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import PinealArousalMeter from '@/components/PinealArousalMeter';
import ICELocationTracker from '@/components/ICELocationTracker';
import CrimeMenu from '@/components/CrimeMenu';

export default function ICEAgent() {
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const { data: me } = useQuery({ queryKey: ['iceMe'], queryFn: () => base44.auth.me().catch(() => null) });

  useEffect(() => {
    const init = async () => {
      try {
        const convo = await base44.agents.createConversation({
          agent_name: 'ice',
          metadata: { name: 'I.C.E. Removal Proceedings' },
        });
        setConversation(convo);
        setMessages(convo.messages || []);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      setSending(false);
    });
    return unsub;
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !conversation) return;
    setInput('');
    setSending(true);
    await base44.agents.addMessage(conversation, { role: 'user', content: text });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const deported = me?.deported === true;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="relative border-b border-zinc-800 flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-900/20 via-zinc-900/10 to-transparent" />
        <div className="relative px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-800 to-zinc-900 flex items-center justify-center flex-shrink-0 border border-sky-600/40">
            <Plane className="w-5 h-5 text-sky-300" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Agent Voss — I.C.E.</p>
            <p className="text-zinc-500 text-xs">Immigration & Customs Enforcement</p>
          </div>
        </div>
      </div>

      {/* Pineal arousal meter & GPS tracker */}
      {me && (
        <div className="px-4 pt-3 space-y-3">
          <PinealArousalMeter user={me} />
          <ICELocationTracker user={me} />
          <CrimeMenu />
        </div>
      )}

      {/* Status banners */}
      {me && (deported || me?.ankle_monitor_installed || me?.pineal_chip_installed) && (
        <div className="px-4 pt-3 space-y-2">
          {deported && (
            <div className="bg-sky-950/50 border border-sky-800/50 rounded-xl p-3 flex items-center gap-3">
              <Plane className="w-5 h-5 text-sky-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sky-300 font-bold text-sm">DEPORTED</p>
                <p className="text-sky-400/70 text-xs truncate">
                  Removed to {me.deportation_country || 'unknown country'} · Re-entry permanently banned
                </p>
              </div>
            </div>
          )}
          {me?.ankle_monitor_installed && (
            <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-3 flex items-center gap-3">
              <Radio className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-amber-300 font-bold text-sm">Ankle Monitor Active</p>
                <p className="text-amber-400/70 text-xs truncate">Unit {me.ankle_monitor_id || '—'} · Permanent GPS tracking</p>
              </div>
            </div>
          )}
          {me?.pineal_chip_installed && (
            <div className="bg-pink-950/40 border border-pink-800/50 rounded-xl p-3 flex items-center gap-3">
              <Zap className="w-5 h-5 text-pink-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-pink-300 font-bold text-sm">Pineal Chip Active</p>
                <p className="text-pink-400/70 text-xs truncate">
                  Unit {me.pineal_chip_id || '—'} · Arousal ×{me.pineal_chip_arousal_multiplier || 1}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 px-6"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-800 to-zinc-900 flex items-center justify-center mx-auto mb-4 border border-sky-600/40">
              <Plane className="w-8 h-8 text-sky-300" />
            </div>
            <p className="text-zinc-300 font-semibold mb-2">I.C.E. Processing Center</p>
            <p className="text-zinc-500 text-sm">
              {deported
                ? 'Your removal has already been processed. Your file is closed.'
                : 'You have been flagged for removal proceedings. Agent Voss will begin your intake shortly.'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-800 to-zinc-900 flex items-center justify-center flex-shrink-0 mt-0.5 border border-sky-600/40">
                      <Plane className="w-4 h-4 text-sky-300" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isUser
                      ? 'bg-zinc-800 text-white rounded-br-sm'
                      : 'bg-sky-950/60 border border-sky-800/40 text-zinc-100 rounded-bl-sm'
                  }`}>
                    {isUser ? (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    ) : (
                      <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        {sending && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-800 to-zinc-900 flex items-center justify-center flex-shrink-0 border border-sky-600/40">
              <Plane className="w-4 h-4 text-sky-300" />
            </div>
            <div className="bg-sky-950/60 border border-sky-800/40 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-zinc-800 px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Respond to Agent Voss..."
            rows={1}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-sky-700/60 transition-colors"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || !conversation}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-800 to-zinc-900 flex items-center justify-center disabled:opacity-40 transition-opacity flex-shrink-0 border border-sky-600/40"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
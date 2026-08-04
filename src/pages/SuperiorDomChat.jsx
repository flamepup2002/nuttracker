import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Crown, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function SuperiorDomChat() {
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const convo = await base44.agents.createConversation({
          agent_name: 'superior_dom',
          metadata: { name: 'Superior Dom Session' },
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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="relative border-b border-zinc-800 flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-900/20 via-red-900/10 to-transparent" />
        <div className="relative px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-600 via-red-700 to-yellow-800 flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-yellow-100" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">SUPERIOR DOM</p>
            <p className="text-zinc-500 text-xs">Winners win. Losers pay.</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-zinc-700 border-t-yellow-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 px-6"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-600 via-red-700 to-yellow-800 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-yellow-100" />
            </div>
            <p className="text-zinc-300 font-semibold mb-2">SUPERIOR DOM</p>
            <p className="text-zinc-500 text-sm">You're in the presence of a winner. Speak up — and have your wallet ready. Believe me.</p>
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-600 via-red-700 to-yellow-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Crown className="w-4 h-4 text-yellow-100" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isUser
                      ? 'bg-zinc-800 text-white rounded-br-sm'
                      : 'bg-gradient-to-br from-yellow-950/70 to-red-950/50 border border-yellow-800/40 text-zinc-100 rounded-bl-sm'
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-600 via-red-700 to-yellow-800 flex items-center justify-center flex-shrink-0">
              <Crown className="w-4 h-4 text-yellow-100" />
            </div>
            <div className="bg-gradient-to-br from-yellow-950/70 to-red-950/50 border border-yellow-800/40 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '300ms' }} />
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
            placeholder="Address your superior..."
            rows={1}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-yellow-600/60 transition-colors"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || !conversation}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-600 via-red-700 to-yellow-800 flex items-center justify-center disabled:opacity-40 transition-opacity flex-shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Shield, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser &&
      <div className="h-8 w-8 rounded-lg bg-red-900 border border-red-700 flex items-center justify-center flex-shrink-0 mt-1">
          <Shield className="w-4 h-4 text-red-400" />
        </div>
      }
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
      isUser ?
      'bg-zinc-700 text-white rounded-br-sm' :
      'bg-zinc-900 border border-red-900/50 text-zinc-100 rounded-bl-sm'}`
      }>
        {isUser ?
        <p className="text-sm leading-relaxed">{message.content}</p> :

        <ReactMarkdown className="text-sm prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {message.content}
          </ReactMarkdown>
        }
      </div>
    </div>);

}

export default function DebtEnforcer() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'debt_enforcer',
        metadata: { name: 'Debt Enforcement Session' }
      });
      setConversation(conv);

      const unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
        setMessages(data.messages || []);
        const last = data.messages?.[data.messages.length - 1];
        if (last?.role === 'assistant' && last?.content) setLoading(false);
      });

      // Send initial greeting trigger
      await base44.agents.addMessage(conv, {
        role: 'user',
        content: 'Review my current obligations and give me a summary.'
      });
      setLoading(true);

      return () => unsubscribe();
    } catch (e) {
      console.error(e);
    } finally {
      setInitializing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversation || loading) return;
    const text = input.trim();
    setInput('');
    setLoading(true);
    await base44.agents.addMessage(conversation, { role: 'user', content: text });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-zinc-950 border-b border-red-900/50 px-4 py-4 flex items-center gap-3 flex-shrink-0">
        <Link to="/">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="w-10 h-10 rounded-xl bg-red-900 border border-red-700 flex items-center justify-center">
          <Shield className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg">Debt Enforcer</h1>
          <p className="text-red-400 text-xs">Contracts &amp; Challenges — No Excuses</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 py-4 my-5">
        {initializing ?
        <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Shield className="w-12 h-12 text-red-800 mx-auto mb-3 animate-pulse" />
              <p className="text-zinc-500 text-sm">Reviewing your obligations...</p>
            </div>
          </div> :

        <AnimatePresence initial={false}>
            {messages.map((msg, idx) =>
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}>
            
                <MessageBubble message={msg} />
              </motion.div>
          )}
            {loading &&
          <motion.div
            key="typing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 justify-start">
            
                <div className="h-8 w-8 rounded-lg bg-red-900 border border-red-700 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-red-400" />
                </div>
                <div className="bg-zinc-900 border border-red-900/50 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
          }
          </AnimatePresence>
        }
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-zinc-950 border-t border-zinc-800 px-4 py-4 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Respond to the enforcer..."
            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 flex-1"
            disabled={loading || initializing} />
          
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || loading || initializing}
            className="bg-red-700 hover:bg-red-600 text-white">
            
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>);

}
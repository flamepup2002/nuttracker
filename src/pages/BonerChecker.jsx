import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Scan, Send, Camera, X, DollarSign } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function BonerChecker() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [pendingImage, setPendingImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    initConversation();
  }, []);

  useEffect(() => {
    if (conversation?.id) {
      const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
        setMessages(data.messages || []);
      });
      return () => unsubscribe();
    }
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initConversation = async () => {
    try {
      const existing = await base44.agents.listConversations({ agent_name: 'boner_checker' });
      if (existing && existing.length > 0) {
        const conv = existing[0];
        setConversation(conv);
        setMessages(conv.messages || []);
      } else {
        const conv = await base44.agents.createConversation({
          agent_name: 'boner_checker',
          metadata: { name: 'Boner Checker', description: 'Erection verification enforcer' }
        });
        setConversation(conv);
        setMessages(conv.messages || []);
      }
    } catch (e) {
      console.error('Failed to init conversation:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !pendingImage) || !conversation || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');

    try {
      let fileUrls = [];
      if (pendingImage) {
        const formData = new FormData();
        formData.append('file', pendingImage);
        const uploadRes = await base44.integrations.Core.UploadFile({ file: pendingImage });
        fileUrls = [uploadRes.file_url];
        setPendingImage(null);
      }

      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: text || (fileUrls.length > 0 ? '[photo]' : ''),
        file_urls: fileUrls.length > 0 ? fileUrls : undefined
      });
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setPendingImage(file);
    e.target.value = '';
  };

  const FunctionDisplay = ({ toolCall }) => {
    const [expanded, setExpanded] = useState(false);
    const isFailed = toolCall.status === 'failed' || toolCall.status === 'error';
    const statusText = {
      pending: 'Pending...', running: 'Running...', in_progress: 'Working...',
      completed: 'Done', success: 'Success', failed: 'Failed', error: 'Error'
    }[toolCall.status] || toolCall.status;

    return (
      <div className="mt-2 text-xs bg-zinc-800/50 rounded-lg p-2 border border-zinc-700">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 w-full text-left">
          <span className={`w-2 h-2 rounded-full ${isFailed ? 'bg-red-500' : 'bg-green-500'}`} />
          <span className="text-zinc-300 font-medium">{toolCall.name || 'Tool'}</span>
          <span className="text-zinc-500">{statusText}</span>
        </button>
        {expanded && (
          <div className="mt-2 space-y-1 text-zinc-400">
            {toolCall.arguments_string && (
              <div><span className="text-zinc-500">Args:</span> {toolCall.arguments_string}</div>
            )}
            {toolCall.results && (
              <div><span className="text-zinc-500">Result:</span> {typeof toolCall.results === 'string' ? toolCall.results : JSON.stringify(toolCall.results)}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-zinc-800 bg-gradient-to-r from-pink-950/50 to-red-950/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600 to-red-600 flex items-center justify-center">
            <Scan className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Boner Checker</h1>
            <p className="text-zinc-400 text-sm">Prove it or pay $200</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
        {messages.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <Scan className="w-12 h-12 mx-auto mb-3 text-pink-500/50" />
            <p>Send a message to start your check</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl p-3 ${
                isUser ? 'bg-pink-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-100'
              }`}>
                {msg.file_urls?.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {msg.file_urls.map((url, i) => (
                      <img key={i} src={url} alt="proof" className="rounded-lg max-h-48 object-cover" />
                    ))}
                  </div>
                )}
                {msg.content && (
                  isUser
                    ? <p className="text-sm">{msg.content}</p>
                    : <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none">{msg.content}</ReactMarkdown>
                )}
                {msg.tool_calls?.map((tc, i) => <FunctionDisplay key={i} toolCall={tc} />)}
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Pending image preview */}
      {pendingImage && (
        <div className="px-4 pb-2">
          <div className="inline-flex items-center gap-2 bg-zinc-800 rounded-lg p-2">
            <img src={URL.createObjectURL(pendingImage)} alt="pending" className="w-12 h-12 rounded object-cover" />
            <button onClick={() => setPendingImage(null)} className="text-zinc-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur border-t border-zinc-800 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="text-pink-400 hover:text-pink-300 shrink-0"
          >
            <Camera className="w-5 h-5" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Message the checker..."
            className="flex-1 bg-zinc-900 border-zinc-700 text-white"
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={sending || (!input.trim() && !pendingImage)}
            size="icon"
            className="bg-pink-600 hover:bg-pink-500 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
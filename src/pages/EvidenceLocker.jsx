import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowLeft, Archive, Loader2, ImageOff, CheckCircle2, XCircle, Clock } from 'lucide-react';

const STATUS_STYLES = {
  pending_review: { icon: Clock, label: 'Pending Review', text: 'text-amber-300', bg: 'bg-amber-950/60', border: 'border-amber-700/40' },
  approved: { icon: CheckCircle2, label: 'Approved', text: 'text-emerald-300', bg: 'bg-emerald-950/60', border: 'border-emerald-700/40' },
  rejected: { icon: XCircle, label: 'Rejected', text: 'text-red-300', bg: 'bg-red-950/60', border: 'border-red-700/40' },
};

export default function EvidenceLockerPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      const records = await base44.entities.TaskCompletion.list('-submitted_at', 100);
      setItems(records.filter(r => r.proof_images && r.proof_images.length > 0));
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center flex-shrink-0 border border-zinc-600/40">
          <Archive className="w-5 h-5 text-zinc-300" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">Evidence Locker</p>
          <p className="text-zinc-500 text-xs">Photo proofs submitted to enforcement agents</p>
        </div>
      </div>

      <div className="px-4 py-4">
        {items === null ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-3 border border-zinc-800">
              <Archive className="w-7 h-7 text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-medium mb-1">Evidence locker is empty</p>
            <p className="text-zinc-600 text-sm">No photo proofs have been submitted yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item, idx) => {
              const status = STATUS_STYLES[item.status] || STATUS_STYLES.pending_review;
              const StatusIcon = status.icon;
              const firstImage = item.proof_images[0];
              return (
                <motion.button
                  key={item.id || idx}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => setSelected(item)}
                  className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-square group"
                >
                  {firstImage ? (
                    <img src={firstImage} alt="Evidence" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-8 h-8 text-zinc-700" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-2">
                    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full ${status.bg} border ${status.border}`}>
                      <StatusIcon className={`w-2.5 h-2.5 ${status.text}`} />
                      <span className={`text-[10px] ${status.text}`}>{status.label}</span>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 bg-black/70 rounded-full px-1.5 py-0.5">
                    <span className="text-[10px] text-zinc-300">{item.proof_images.length}📷</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <p className="font-semibold text-sm">Evidence Detail</p>
              <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {selected.proof_images?.map((img, i) => (
                  <img key={i} src={img} alt={`Evidence ${i + 1}`} className="w-full rounded-lg border border-zinc-800" />
                ))}
              </div>
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Task</p>
                <p className="text-zinc-200 text-sm">{selected.task_description}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">User Report</p>
                <p className="text-zinc-300 text-sm">{selected.user_report}</p>
              </div>
              {selected.ai_feedback && (
                <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 p-3">
                  <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">AI Feedback</p>
                  <p className="text-zinc-300 text-sm">{selected.ai_feedback}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <span className="text-zinc-600 text-xs">
                  {selected.submitted_at ? new Date(selected.submitted_at).toLocaleString() : ''}
                </span>
                {selected.coins_awarded > 0 && (
                  <span className="text-amber-300 text-xs">+{selected.coins_awarded} coins</span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
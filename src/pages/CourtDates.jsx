import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Gavel, Calendar, Clock, CheckCircle, AlertTriangle, Shield } from 'lucide-react';

export default function CourtDates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['courtDateNotifications'],
    queryFn: () => base44.entities.Notification.filter({ type: 'criminal_charge' }, '-created_date'),
  });

  const dismissMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { charges_dismissed: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courtDateNotifications'] }),
  });

  const now = new Date();

  const upcoming = notifications.filter(n => !n.charges_dismissed && n.court_date && new Date(n.court_date) > now);
  const past = notifications.filter(n => !n.charges_dismissed && n.court_date && new Date(n.court_date) <= now);
  const dismissed = notifications.filter(n => n.charges_dismissed);

  const formatDate = (iso) => {
    if (!iso) return 'Unknown';
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getDaysUntil = (iso) => {
    const diff = Math.ceil((new Date(iso) - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff === 0) return 'TODAY';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Gavel className="w-5 h-5 text-red-500" />
            Court Dates
          </h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="px-6 pb-24 pt-6 space-y-6">
        {isLoading ? (
          <div className="text-center py-16 text-zinc-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center"
          >
            <Shield className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No Court Dates</p>
            <p className="text-zinc-600 text-sm">You have no scheduled court appearances.</p>
          </motion.div>
        ) : (
          <>
            {/* Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-3"
            >
              <div className="bg-red-950/40 border border-red-700/40 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-red-300">{upcoming.length}</p>
                <p className="text-zinc-500 text-xs mt-1">Upcoming</p>
              </div>
              <div className="bg-orange-950/40 border border-orange-700/40 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-orange-300">{past.length}</p>
                <p className="text-zinc-500 text-xs mt-1">Overdue</p>
              </div>
              <div className="bg-green-950/40 border border-green-700/40 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-green-300">{dismissed.length}</p>
                <p className="text-zinc-500 text-xs mt-1">Dismissed</p>
              </div>
            </motion.div>

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div className="space-y-3">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-red-400" /> Upcoming Court Dates
                </p>
                {upcoming.map((n, idx) => (
                  <motion.div key={n.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                    className="bg-red-950/30 border-2 border-red-600/60 rounded-2xl p-5"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm mb-1">{n.title}</p>
                        <p className="text-zinc-400 text-xs">{n.message}</p>
                      </div>
                      <span className="text-xs font-bold bg-red-600 text-white px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                        {getDaysUntil(n.court_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                      <Calendar className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <p className="text-red-300 text-sm font-semibold">{formatDate(n.court_date)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Overdue / Missed */}
            {past.length > 0 && (
              <div className="space-y-3">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3 h-3 text-orange-400" /> Missed / Overdue Appearances
                </p>
                {past.map((n, idx) => (
                  <motion.div key={n.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                    className="bg-orange-950/30 border border-orange-600/60 rounded-2xl p-5"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm mb-1">{n.title}</p>
                        <p className="text-zinc-400 text-xs">{n.message}</p>
                      </div>
                      <span className="text-xs font-bold bg-orange-700 text-white px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                        {getDaysUntil(n.court_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                      <Calendar className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <p className="text-orange-300 text-sm font-semibold">{formatDate(n.court_date)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Dismissed */}
            {dismissed.length > 0 && (
              <div className="space-y-3">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400" /> Dismissed
                </p>
                {dismissed.map((n, idx) => (
                  <motion.div key={n.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                    className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 opacity-60"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-zinc-400 font-bold text-sm line-through">{n.title}</p>
                      <span className="text-xs font-bold bg-green-900/60 text-green-400 border border-green-700/40 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                        Dismissed
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                      <Calendar className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                      <p className="text-zinc-500 text-sm">{formatDate(n.court_date)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
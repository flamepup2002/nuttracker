import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Gavel, CreditCard, AlertTriangle, Clock, Loader2, CheckCircle2 } from 'lucide-react';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const d = new Date(dateStr);
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function CourtCalendarPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(null);
  const [contracts, setContracts] = useState(null);

  useEffect(() => {
    const load = async () => {
      const notifs = await base44.entities.Notification.list('-court_date', 100);
      setNotifications(notifs.filter(n => n.court_date));
      const c = await base44.entities.DebtContract.list('-next_payment_due', 100);
      setContracts(c.filter(x => x.next_payment_due && x.cancel_status !== 'cancelled'));
    };
    load();
  }, []);

  const events = useMemo(() => {
    const courtEvents = (notifications || []).map(n => ({
      id: n.id,
      type: 'court',
      title: n.title || 'Court Date',
      date: n.court_date,
      detail: n.message,
      dismissed: n.charges_dismissed,
    }));
    const paymentEvents = (contracts || []).map(c => ({
      id: c.id,
      type: 'payment',
      title: c.title || 'Debt Contract Payment',
      date: c.next_payment_due,
      detail: `Monthly payment: $${(c.monthly_payment || 0).toLocaleString()}`,
      paid: (c.amount_paid || 0) >= (c.monthly_payment || 0),
    }));
    return [...courtEvents, ...paymentEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [notifications, contracts]);

  const overdue = events.filter(e => !e.dismissed && !e.paid && daysUntil(e.date) < 0);
  const upcoming = events.filter(e => !e.dismissed && !e.paid && daysUntil(e.date) >= 0);
  const resolved = events.filter(e => e.dismissed || e.paid);

  const loading = notifications === null || contracts === null;

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-800 to-slate-900 flex items-center justify-center flex-shrink-0 border border-indigo-700/40">
          <Calendar className="w-5 h-5 text-indigo-300" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">Court Calendar</p>
          <p className="text-zinc-500 text-xs">Court dates, sentencing & payment deadlines</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-red-800/40 bg-red-950/40 p-3 text-center">
            <p className="text-red-400 text-2xl font-bold">{overdue.length}</p>
            <p className="text-zinc-500 text-xs">Overdue</p>
          </div>
          <div className="rounded-xl border border-amber-800/40 bg-amber-950/40 p-3 text-center">
            <p className="text-amber-400 text-2xl font-bold">{upcoming.length}</p>
            <p className="text-zinc-500 text-xs">Upcoming</p>
          </div>
          <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/40 p-3 text-center">
            <p className="text-emerald-400 text-2xl font-bold">{resolved.length}</p>
            <p className="text-zinc-500 text-xs">Resolved</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-3 border border-zinc-800">
              <Calendar className="w-7 h-7 text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-medium mb-1">No scheduled dates</p>
            <p className="text-zinc-600 text-sm">You have no pending court dates or payment deadlines.</p>
          </div>
        ) : (
          <>
            {/* Overdue */}
            {overdue.length > 0 && (
              <Section title="Overdue" icon={AlertTriangle} iconClass="text-red-400">
                {overdue.map((e, i) => <EventCard key={e.id} event={e} overdue />)}
              </Section>
            )}
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <Section title="Upcoming" icon={Clock} iconClass="text-amber-400">
                {upcoming.map((e, i) => <EventCard key={e.id} event={e} />)}
              </Section>
            )}
            {/* Resolved */}
            {resolved.length > 0 && (
              <Section title="Resolved" icon={CheckCircle2} iconClass="text-emerald-400">
                {resolved.map((e, i) => <EventCard key={e.id} event={e} resolved />)}
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, iconClass, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <Icon className={`w-4 h-4 ${iconClass}`} />
        <p className="text-zinc-400 text-xs uppercase tracking-wide">{title}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function EventCard({ event, overdue, resolved }) {
  const isCourt = event.type === 'court';
  const Icon = isCourt ? Gavel : CreditCard;
  const days = daysUntil(event.date);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 ${
        overdue ? 'border-red-800/50 bg-red-950/30' :
        resolved ? 'border-emerald-800/40 bg-emerald-950/20' :
        'border-zinc-800 bg-zinc-900/50'
      }`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          isCourt ? 'bg-indigo-950 border border-indigo-800/50' : 'bg-amber-950 border border-amber-800/50'
        }`}>
          <Icon className={`w-4 h-4 ${isCourt ? 'text-indigo-300' : 'text-amber-300'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{event.title}</p>
          <p className="text-zinc-500 text-xs mt-0.5">{formatDate(event.date)}</p>
          {event.detail && <p className="text-zinc-400 text-sm mt-1.5">{event.detail}</p>}
          <div className="flex items-center gap-2 mt-2">
            {overdue && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-950 border border-red-800/50 text-red-300">
                {Math.abs(days)}d overdue
              </span>
            )}
            {!overdue && !resolved && days !== null && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800/50 text-amber-300">
                in {days}d
              </span>
            )}
            {resolved && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800/50 text-emerald-300">
                Resolved
              </span>
            )}
            <span className="text-xs text-zinc-600">{isCourt ? 'Court Date' : 'Payment Due'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
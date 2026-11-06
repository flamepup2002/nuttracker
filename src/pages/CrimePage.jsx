import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Skull, RefreshCw, MapPin, Clock, Calendar, Wrench,
  Lock, Flame, Check, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  rollBoard, nextDays, LOCATIONS, METHODS, TIME_SLOTS,
  SEVERITY_COLOR, RISK_COLOR,
} from '@/lib/crimeData';

export default function CrimePage() {
  const navigate = useNavigate();
  const [board, setBoard] = useState(() => rollBoard());
  const [refreshUsed, setRefreshUsed] = useState(false);
  const [selected, setSelected] = useState(null);
  const [variant, setVariant] = useState(null);
  const [location, setLocation] = useState(null);
  const [time, setTime] = useState(null);
  const [date, setDate] = useState(null);
  const [method, setMethod] = useState(null);
  const [committed, setCommitted] = useState(false);

  const dates = useMemo(() => nextDays(7), []);

  const refresh = () => {
    if (refreshUsed) { toast.error('Free refresh already used.'); return; }
    setBoard(rollBoard());
    setRefreshUsed(true);
    toast.success('Crime board refreshed.');
  };

  const openCrime = (c) => {
    setSelected(c);
    setVariant(null);
    setLocation(null);
    setTime(null);
    setDate(null);
    setMethod(null);
    setCommitted(false);
  };

  const backToBoard = () => {
    setSelected(null);
    setCommitted(false);
  };

  const planComplete = selected && variant && location && time && date && method;

  const commit = () => {
    if (!planComplete) return;
    setCommitted(true);
    toast.success('Crime plan committed.');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="relative border-b border-red-900/40 flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/30 via-zinc-900/10 to-transparent" />
        <div className="relative px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-700 to-zinc-900 flex items-center justify-center border border-red-500/40">
            <Skull className="w-5 h-5 text-red-300" />
          </div>
          <div>
            <p className="text-red-200 font-bold text-sm leading-tight">Crime Page</p>
            <p className="text-red-400/60 text-xs">Plan & commit a crime to feed the chip</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28">
        {!selected ? (
          /* ---- BOARD ---- */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 font-bold text-sm">Available Crimes</p>
                <p className="text-zinc-500 text-xs">Tap a crime to view all details and build your plan</p>
              </div>
              <button
                onClick={refresh}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                  refreshUsed
                    ? 'text-zinc-600 border-zinc-800 bg-zinc-900/40'
                    : 'text-emerald-300 border-emerald-700/50 bg-emerald-950/40 hover:bg-emerald-900/40'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {refreshUsed ? 'Refresh Used' : 'Free Refresh'}
              </button>
            </div>

            {board.map((c, idx) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => openCrime(c)}
                className="w-full text-left p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:border-red-700/60 hover:bg-red-950/20 transition-all flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-800 to-zinc-900 flex items-center justify-center border border-red-500/30 flex-shrink-0">
                  <Skull className="w-5 h-5 text-red-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-bold text-sm truncate">{c.name}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${SEVERITY_COLOR[c.severity]}`}>
                      {c.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-400 font-mono">${c.reward.toLocaleString()}</span>
                    <span className={`font-bold ${RISK_COLOR[c.risk]}`}>{c.risk.toUpperCase()}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600 flex-shrink-0" />
              </motion.button>
            ))}
          </motion.div>
        ) : (
          /* ---- DETAIL ---- */
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            {/* Back */}
            <button onClick={backToBoard} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to crimes
            </button>

            {/* Crime summary header */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-700 to-zinc-900 flex items-center justify-center border border-red-500/40 flex-shrink-0">
                  <Skull className="w-6 h-6 text-red-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-white font-black text-base">{selected.name}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${SEVERITY_COLOR[selected.severity]}`}>
                      {selected.severity}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed">{selected.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-emerald-400 font-mono font-bold">${selected.reward.toLocaleString()}</span>
                    <span className={`font-bold ${RISK_COLOR[selected.risk]}`}>RISK: {selected.risk.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Crime Type */}
            <DetailSection icon={Lock} label="Crime Type" done={!!variant}>
              <div className="grid grid-cols-1 gap-2">
                {selected.variants.map((v) => (
                  <OptionChip key={v} active={variant === v} onClick={() => setVariant(v)}>{v}</OptionChip>
                ))}
              </div>
            </DetailSection>

            {/* Location */}
            <DetailSection icon={MapPin} label="Location" done={!!location}>
              <div className="grid grid-cols-2 gap-2">
                {LOCATIONS.map((l) => (
                  <OptionChip key={l} active={location === l} onClick={() => setLocation(l)} small>{l}</OptionChip>
                ))}
              </div>
            </DetailSection>

            {/* Time */}
            <DetailSection icon={Clock} label="Time" done={!!time}>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((t) => (
                  <OptionChip key={t} active={time === t} onClick={() => setTime(t)} small mono>{t}</OptionChip>
                ))}
              </div>
            </DetailSection>

            {/* Date */}
            <DetailSection icon={Calendar} label="Date" done={!!date}>
              <div className="grid grid-cols-2 gap-2">
                {dates.map((d) => (
                  <OptionChip key={d.value} active={date === d.value} onClick={() => setDate(d.value)} small>{d.label}</OptionChip>
                ))}
              </div>
            </DetailSection>

            {/* Method */}
            <DetailSection icon={Wrench} label="Method" done={!!method}>
              <div className="grid grid-cols-1 gap-2">
                {METHODS.map((m) => (
                  <OptionChip key={m} active={method === m} onClick={() => setMethod(m)} small>{m}</OptionChip>
                ))}
              </div>
            </DetailSection>

            {/* Crime Plan */}
            <div className="bg-red-950/30 border border-red-800/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-400" />
                <p className="text-red-200 font-bold text-sm">Crime Plan</p>
              </div>
              <div className="space-y-1.5 text-xs">
                <PlanRow label="Crime" value={selected.name} />
                <PlanRow label="Type" value={variant} />
                <PlanRow label="Location" value={location} />
                <PlanRow label="Time" value={time} />
                <PlanRow label="Date" value={date} />
                <PlanRow label="Method" value={method} />
                <PlanRow label="Est. Payout" value={selected.reward ? `$${selected.reward.toLocaleString()}` : null} accent />
              </div>
            </div>

            {/* Commit */}
            {committed ? (
              <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-4 flex items-center gap-3">
                <Check className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-emerald-300 font-bold text-sm">Committed</p>
                  <p className="text-emerald-400/70 text-xs">Your plan to commit {selected.name} is locked in. The chip is satisfied — for now.</p>
                </div>
              </div>
            ) : (
              <button
                onClick={commit}
                disabled={!planComplete}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-2 transition-all"
              >
                {planComplete ? (
                  <><Flame className="w-5 h-5" /> Commit to Crime Plan</>
                ) : (
                  <><AlertTriangle className="w-4 h-4" /> Complete all details to commit</>
                )}
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function DetailSection({ icon: Icon, label, done, children }) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${done ? 'text-red-400' : 'text-zinc-500'}`} />
        <p className="text-zinc-300 font-semibold text-xs uppercase tracking-wide">{label}</p>
        {done && <Check className="w-3.5 h-3.5 text-red-400 ml-auto" />}
      </div>
      {children}
    </div>
  );
}

function OptionChip({ active, onClick, small, mono, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-lg border transition-all ${
        small ? 'p-2.5 text-xs' : 'p-3 text-sm'
      } ${mono ? 'font-mono font-bold text-center' : ''} ${
        active ? 'border-red-500 bg-red-950/50 text-white' : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700'
      }`}
    >
      {children}
    </button>
  );
}

function PlanRow({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-zinc-500 uppercase tracking-wide text-[10px]">{label}</span>
      <span className={`text-right ${accent ? 'text-emerald-400 font-bold' : value ? 'text-white' : 'text-zinc-700 italic'}`}>
        {value || '— not selected —'}
      </span>
    </div>
  );
}
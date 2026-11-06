import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Skull, Loader2, MapPin, Clock, Calendar, Wrench, Lock, DollarSign, Flame } from 'lucide-react';
import { SEVERITY_COLOR, RISK_COLOR } from '@/lib/crimeData';

export default function CrimePlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rec = await base44.entities.CrimePlan.get(id);
        if (!alive) return;
        if (!rec) { setNotFound(true); return; }
        setPlan(rec);
      } catch {
        if (alive) setNotFound(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-red-400 animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-3 px-6 text-center">
        <Skull className="w-10 h-10 text-red-500/60" />
        <p className="text-zinc-400 text-sm">Crime plan not found.</p>
        <button onClick={() => navigate('/Crime')} className="text-red-300 text-sm font-bold underline">
          Back to Crime Page
        </button>
      </div>
    );
  }

  const dateLabel = plan.date
    ? new Date(plan.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
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
            <p className="text-red-200 font-bold text-sm leading-tight">Generated Crime Plan</p>
            <p className="text-red-400/60 text-xs">Dossier for {plan.crime_name}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-700 to-zinc-900 flex items-center justify-center border border-red-500/40 flex-shrink-0">
              <Skull className="w-6 h-6 text-red-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-white font-black text-base">{plan.crime_name}</p>
                {plan.severity && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${SEVERITY_COLOR[plan.severity]}`}>
                    {plan.severity}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs flex-wrap">
                {plan.est_payout ? (
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />{plan.est_payout.toLocaleString()}
                  </span>
                ) : null}
                {plan.risk && <span className={`font-bold ${RISK_COLOR[plan.risk]}`}>RISK: {plan.risk.toUpperCase()}</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 mt-3 text-xs">
            {plan.variant && <ParamRow icon={Lock} label="Type" value={plan.variant} />}
            {plan.location && <ParamRow icon={MapPin} label="Location" value={plan.location} />}
            {plan.time && <ParamRow icon={Clock} label="Time" value={plan.time} />}
            {dateLabel && <ParamRow icon={Calendar} label="Date" value={dateLabel} />}
            {plan.method && <ParamRow icon={Wrench} label="Method" value={plan.method} />}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-950/20 border border-red-800/40 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-red-400" />
            <p className="text-red-200 font-bold text-sm">Operational Plan</p>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed">
            <ReactMarkdown>{plan.plan_text || ''}</ReactMarkdown>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ParamRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 bg-zinc-950/40 border border-zinc-800 rounded-lg px-2.5 py-2">
      <Icon className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
      <span className="text-zinc-500 uppercase tracking-wide text-[10px]">{label}</span>
      <span className="text-white ml-auto text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}
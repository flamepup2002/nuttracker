import React, { useState, useMemo } from 'react';
import {
  Skull, RefreshCw, Lock, MapPin, Clock, Calendar, Wrench,
  ChevronRight, Check, Flame, X,
} from 'lucide-react';
import { toast } from 'sonner';

// ---- Crime data pools ----
const CRIME_CATALOG = [
  {
    id: 'wire_fraud', name: 'Wire Fraud', severity: 'FEDERAL', reward: 75000, risk: 'high',
    variants: ['Business Email Compromise', 'Romance Scam Pipeline', 'Fake Invoice Scheme', 'CEO Impersonation'],
  },
  {
    id: 'identity_theft', name: 'Identity Theft', severity: 'FELONY', reward: 18000, risk: 'medium',
    variants: ['Synthetic Identity', 'Dead-Baby Certificate', 'Mailbox Harvest', 'Database Breach Pull'],
  },
  {
    id: 'embezzlement', name: 'Embezzlement', severity: 'FELONY', reward: 95000, risk: 'medium',
    variants: ['Skimming Receivables', 'Ghost Employee Payroll', 'Fictitious Vendor', 'Expense Report Mill'],
  },
  {
    id: 'burglary', name: 'Burglary', severity: 'FELONY', reward: 30000, risk: 'high',
    variants: ['Smash & Grab', 'After-Hours Entry', 'Safe Crack', 'Rooftop Access'],
  },
  {
    id: 'extortion', name: 'Extortion', severity: 'FELONY', reward: 45000, risk: 'high',
    variants: ['Blackmail Leakage', 'Protection Racket', 'Sextortion', 'Data Ransom'],
  },
  {
    id: 'cyber_intrusion', name: 'Cyber Intrusion', severity: 'FEDERAL', reward: 140000, risk: 'extreme',
    variants: ['Ransomware Deployment', 'SQL Injection', 'Credential Stuffing', 'Supply-Chain Compromise'],
  },
  {
    id: 'credit_card_fraud', name: 'Credit Card Fraud', severity: 'FELONY', reward: 14000, risk: 'low',
    variants: ['Card Skimming', 'Cloned Stripe', 'CNP Fraud Run', 'Refund Scheme'],
  },
  {
    id: 'money_laundering', name: 'Money Laundering', severity: 'FEDERAL', reward: 210000, risk: 'high',
    variants: ['Shell Company Layering', 'Crypto Tumbler', 'Casino Wash', 'Real-Estate Smurfing'],
  },
  {
    id: 'armed_robbery', name: 'Armed Robbery', severity: 'FELONY', reward: 38000, risk: 'extreme',
    variants: ['Bank Teller', 'Armored Truck', 'Pharmacy', 'High-End Jewelry Store'],
  },
  {
    id: 'bribery', name: 'Bribery of Official', severity: 'FEDERAL', reward: 60000, risk: 'high',
    variants: ['Customs Inspector', 'Building Inspector', 'Judge', 'Procurement Officer'],
  },
];

const LOCATIONS = [
  'Downtown Financial District', 'Online / Remote Access', 'Riverside Warehouse',
  'Corporate Office Tower', 'Residential Estate', 'Offshore Bank Server',
  'Crypto Exchange Hot Wallet', 'Retail Branch', 'Airport Cargo Hold',
  'Marina Pier 9', 'Industrial Park Lot B', 'Private Vault Storage',
];

const METHODS = [
  'Social engineering (spear-phishing)', 'Brute-force physical entry', 'Insider access (bribed employee)',
  'Remote network exploitation', 'Skimming device planted', 'Forged credentials & badges',
  'Dumpster diving + document reconstruction', 'Lock-pick & bypass alarm', 'Drone surveillance recon',
  'Bluetooth relay attack',
];

const TIME_SLOTS = [
  '02:00', '04:00', '06:00', '08:00', '10:00', '12:00',
  '14:00', '16:00', '18:00', '20:00', '22:00', '23:30',
];

function nextDays(n) {
  const out = [];
  const base = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push({
      value: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    });
  }
  return out;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SEVERITY_COLOR = {
  FEDERAL: 'text-red-400 border-red-700/50 bg-red-950/40',
  FELONY: 'text-amber-400 border-amber-700/50 bg-amber-950/30',
};
const RISK_COLOR = {
  extreme: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-amber-400',
  low: 'text-emerald-400',
};

const STEPS = [
  { key: 'browse', label: 'Crimes', icon: Skull },
  { key: 'type', label: 'Type', icon: Lock },
  { key: 'location', label: 'Location', icon: MapPin },
  { key: 'time', label: 'Time', icon: Clock },
  { key: 'date', label: 'Date', icon: Calendar },
  { key: 'method', label: 'Method', icon: Wrench },
];

export default function CrimeMenu() {
  const [open, setOpen] = useState(false);
  const [board, setBoard] = useState(() => shuffle(CRIME_CATALOG).slice(0, 6));
  const [refreshUsed, setRefreshUsed] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [selectedCrime, setSelectedCrime] = useState(null);
  const [variant, setVariant] = useState(null);
  const [location, setLocation] = useState(null);
  const [time, setTime] = useState(null);
  const [date, setDate] = useState(null);
  const [method, setMethod] = useState(null);
  const [committed, setCommitted] = useState(false);

  const dates = useMemo(() => nextDays(7), []);

  const refresh = () => {
    if (refreshUsed) {
      toast.error('Free refresh already used. No more free rerolls.');
      return;
    }
    setBoard(shuffle(CRIME_CATALOG).slice(0, 6));
    setRefreshUsed(true);
    toast.success('Crime board refreshed.');
  };

  const reset = () => {
    setStepIdx(0);
    setSelectedCrime(null);
    setVariant(null);
    setLocation(null);
    setTime(null);
    setDate(null);
    setMethod(null);
    setCommitted(false);
  };

  const pickCrime = (c) => {
    setSelectedCrime(c);
    setVariant(null);
    setStepIdx(1);
  };

  const next = () => setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  const back = () => setStepIdx((i) => Math.max(i - 1, 0));

  const canAdvance = () => {
    const s = STEPS[stepIdx].key;
    if (s === 'browse') return !!selectedCrime;
    if (s === 'type') return !!variant;
    if (s === 'location') return !!location;
    if (s === 'time') return !!time;
    if (s === 'date') return !!date;
    if (s === 'method') return !!method;
    return false;
  };

  const planComplete = selectedCrime && variant && location && time && date && method;

  return (
    <div className="bg-zinc-950/60 border border-red-900/40 rounded-2xl overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 flex items-center gap-3 bg-gradient-to-r from-red-950/40 to-zinc-950/40"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-700 to-zinc-900 flex items-center justify-center border border-red-500/40">
          <Skull className="w-5 h-5 text-red-300" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-red-200 font-bold text-sm">Crime Menu</p>
          <p className="text-red-400/50 text-xs">Plan a crime to feed the chip</p>
        </div>
        <span className="text-red-400 text-xs font-bold">{open ? 'CLOSE' : 'OPEN'}</span>
      </button>

      {open && (
        <div className="p-4 space-y-4">
          {/* Step indicator */}
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < stepIdx;
              const active = i === stepIdx;
              return (
                <React.Fragment key={s.key}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-[10px] ${
                    active ? 'bg-red-700 border-red-400 text-white' :
                    done ? 'bg-red-900/60 border-red-600/50 text-red-200' :
                    'bg-zinc-900 border-zinc-700 text-zinc-600'
                  }`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px ${i < stepIdx ? 'bg-red-700/60' : 'bg-zinc-800'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* STEP: BROWSE */}
          {STEPS[stepIdx].key === 'browse' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-zinc-300 text-xs font-semibold uppercase tracking-wide">Available Crimes</p>
                <button
                  onClick={refresh}
                  className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
                    refreshUsed
                      ? 'text-zinc-600 border-zinc-800 bg-zinc-900/40'
                      : 'text-emerald-300 border-emerald-700/50 bg-emerald-950/40 hover:bg-emerald-900/40'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshUsed ? '' : ''}`} />
                  {refreshUsed ? 'Refresh Used' : 'Free Refresh'}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {board.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => pickCrime(c)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      selectedCrime?.id === c.id
                        ? 'border-red-500 bg-red-950/50'
                        : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-bold text-sm">{c.name}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${SEVERITY_COLOR[c.severity]}`}>
                        {c.severity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-mono">${c.reward.toLocaleString()}</span>
                      <span className={`font-bold ${RISK_COLOR[c.risk]}`}>RISK: {c.risk.toUpperCase()}</span>
                    </div>
                  </button>
                ))}
              </div>
              {selectedCrime && (
                <button onClick={next} className="w-full py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2">
                  Continue with {selectedCrime.name} <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* STEP: TYPE */}
          {STEPS[stepIdx].key === 'type' && selectedCrime && (
            <div className="space-y-3">
              <p className="text-zinc-300 text-xs font-semibold uppercase tracking-wide">Select Type — {selectedCrime.name}</p>
              <div className="grid grid-cols-1 gap-2">
                {selectedCrime.variants.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVariant(v)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      variant === v ? 'border-red-500 bg-red-950/50' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                    }`}
                  >
                    <p className="text-white text-sm font-medium">{v}</p>
                  </button>
                ))}
              </div>
              <NavButtons onBack={back} onNext={next} can={!!variant} />
            </div>
          )}

          {/* STEP: LOCATION */}
          {STEPS[stepIdx].key === 'location' && (
            <div className="space-y-3">
              <p className="text-zinc-300 text-xs font-semibold uppercase tracking-wide">Select Location</p>
              <div className="grid grid-cols-2 gap-2">
                {LOCATIONS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLocation(l)}
                    className={`text-left p-2.5 rounded-lg border transition-all text-xs ${
                      location === l ? 'border-red-500 bg-red-950/50 text-white' : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <NavButtons onBack={back} onNext={next} can={!!location} />
            </div>
          )}

          {/* STEP: TIME */}
          {STEPS[stepIdx].key === 'time' && (
            <div className="space-y-3">
              <p className="text-zinc-300 text-xs font-semibold uppercase tracking-wide">Select Time</p>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTime(t)}
                    className={`py-2 rounded-lg border text-xs font-mono font-bold transition-all ${
                      time === t ? 'border-red-500 bg-red-950/50 text-white' : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <NavButtons onBack={back} onNext={next} can={!!time} />
            </div>
          )}

          {/* STEP: DATE */}
          {STEPS[stepIdx].key === 'date' && (
            <div className="space-y-3">
              <p className="text-zinc-300 text-xs font-semibold uppercase tracking-wide">Select Date</p>
              <div className="grid grid-cols-2 gap-2">
                {dates.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDate(d.value)}
                    className={`py-2.5 rounded-lg border text-xs font-medium transition-all ${
                      date === d.value ? 'border-red-500 bg-red-950/50 text-white' : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <NavButtons onBack={back} onNext={next} can={!!date} />
            </div>
          )}

          {/* STEP: METHOD */}
          {STEPS[stepIdx].key === 'method' && (
            <div className="space-y-3">
              <p className="text-zinc-300 text-xs font-semibold uppercase tracking-wide">How Will You Commit It?</p>
              <div className="grid grid-cols-1 gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`text-left p-3 rounded-xl border transition-all text-xs ${
                      method === m ? 'border-red-500 bg-red-950/50 text-white' : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={back} className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm">Back</button>
                <button
                  onClick={() => { if (canAdvance()) { setCommitted(true); setStepIdx(0); } }}
                  disabled={!canAdvance()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4" /> Lock In Plan
                </button>
              </div>
            </div>
          )}

          {/* CONFIRMED PLAN */}
          {committed && planComplete && (
            <div className="bg-red-950/40 border border-red-700/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-400" />
                <p className="text-red-200 font-bold text-sm">Crime Plan Locked In</p>
              </div>
              <div className="space-y-1.5 text-xs text-zinc-300">
                <Row label="Crime" value={selectedCrime.name} />
                <Row label="Type" value={variant} />
                <Row label="Location" value={location} />
                <Row label="Time" value={time} />
                <Row label="Date" value={date} />
                <Row label="Method" value={method} />
                <Row label="Est. Payout" value={`$${selectedCrime.reward.toLocaleString()}`} accent />
              </div>
              <button
                onClick={reset}
                className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2"
              >
                <X className="w-3.5 h-3.5" /> Clear & Plan Another
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-zinc-500 uppercase tracking-wide text-[10px]">{label}</span>
      <span className={`text-right ${accent ? 'text-emerald-400 font-bold' : 'text-white'}`}>{value}</span>
    </div>
  );
}

function NavButtons({ onBack, onNext, can }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onBack} className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm">Back</button>
      <button onClick={onNext} disabled={!can} className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2">
        Next <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
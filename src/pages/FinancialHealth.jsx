import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft, TrendingUp, Shield, Eye, EyeOff, Save,
  DollarSign, Briefcase, CreditCard, AlertTriangle, CheckCircle, Activity
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobileSelect from '@/components/MobileSelect';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

function calcHealthScore(contracts, payments, user) {
  let score = 100;
  const active = contracts.filter(c => c.is_accepted && !c.cancelled_at);

  // Overdue penalty (-10 each)
  const overdue = active.filter(c => c.next_payment_due && new Date(c.next_payment_due) < new Date());
  score -= overdue.length * 10;

  // Missed payments (-5 each)
  const failed = payments.filter(p => p.status === 'failed');
  score -= failed.length * 5;

  // Successful payments (+2 each, capped at +20)
  const succeeded = payments.filter(p => p.status === 'succeeded');
  score += Math.min(succeeded.length * 2, 20);

  // Debt-to-income ratio
  const monthlyObligation = active.reduce((s, c) => s + (c.monthly_payment || 0), 0);
  const monthlyIncome = user?.annual_income ? user.annual_income / 12 : 0;
  if (monthlyIncome > 0) {
    const ratio = monthlyObligation / monthlyIncome;
    if (ratio > 0.5) score -= 20;
    else if (ratio > 0.3) score -= 10;
    else if (ratio < 0.1) score += 5;
  }

  // Credit score bonus
  if (user?.credit_score >= 750) score += 10;
  else if (user?.credit_score >= 670) score += 5;
  else if (user?.credit_score < 580 && user?.credit_score > 0) score -= 10;

  // Extreme contracts penalty
  const extremeContracts = active.filter(c => c.intensity_level === 'extreme');
  score -= extremeContracts.length * 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getScoreLabel(score) {
  if (score >= 80) return { label: 'Excellent', color: 'text-green-400', bg: 'from-green-500 to-emerald-500' };
  if (score >= 60) return { label: 'Good', color: 'text-blue-400', bg: 'from-blue-500 to-cyan-500' };
  if (score >= 40) return { label: 'Fair', color: 'text-yellow-400', bg: 'from-yellow-500 to-orange-500' };
  if (score >= 20) return { label: 'Poor', color: 'text-orange-400', bg: 'from-orange-500 to-red-500' };
  return { label: 'Critical', color: 'text-red-400', bg: 'from-red-600 to-red-800' };
}

const INTENSITY_COLORS = {
  mild: '#3b82f6',
  moderate: '#f59e0b',
  intense: '#f97316',
  extreme: '#ef4444',
};

export default function FinancialHealth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSsn, setShowSsn] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [profile, setProfile] = useState({
    ssn_sin: '', annual_income: '', monthly_expenses: '',
    credit_score: '', employment_status: '', net_worth: '',
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    onSuccess: (u) => {
      setProfile({
        ssn_sin: u.ssn_sin || '',
        annual_income: u.annual_income || '',
        monthly_expenses: u.monthly_expenses || '',
        credit_score: u.credit_score || '',
        employment_status: u.employment_status || '',
        net_worth: u.net_worth || '',
      });
    },
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['fhContracts'],
    queryFn: () => base44.entities.DebtContract.list('-created_date', 100),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['fhPayments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 200),
  });

  // Sync profile from user
  React.useEffect(() => {
    if (user) {
      setProfile({
        ssn_sin: user.ssn_sin || '',
        annual_income: user.annual_income || '',
        monthly_expenses: user.monthly_expenses || '',
        credit_score: user.credit_score || '',
        employment_status: user.employment_status || '',
        net_worth: user.net_worth || '',
      });
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe({
      ssn_sin: data.ssn_sin,
      annual_income: data.annual_income ? parseFloat(data.annual_income) : null,
      monthly_expenses: data.monthly_expenses ? parseFloat(data.monthly_expenses) : null,
      credit_score: data.credit_score ? parseInt(data.credit_score) : null,
      employment_status: data.employment_status || null,
      net_worth: data.net_worth ? parseFloat(data.net_worth) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Financial profile saved!');
      setHasChanges(false);
    },
    onError: () => toast.error('Failed to save profile'),
  });

  const handleChange = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const healthScore = calcHealthScore(contracts, payments, user);
  const scoreInfo = getScoreLabel(healthScore);
  const activeContracts = contracts.filter(c => c.is_accepted && !c.cancelled_at);
  const totalDebt = activeContracts.reduce((s, c) => s + (c.total_obligation || 0) - (c.amount_paid || 0), 0);
  const monthlyObligation = activeContracts.reduce((s, c) => s + (c.monthly_payment || 0), 0);
  const totalPaid = payments.filter(p => p.status === 'succeeded').reduce((s, p) => s + (p.amount || 0), 0);

  // Payment trend — last 6 months
  const paymentTrend = (() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('default', { month: 'short' });
      const monthPayments = payments.filter(p => {
        const pd = new Date(p.created_date);
        return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      });
      months.push({
        month: label,
        paid: monthPayments.filter(p => p.status === 'succeeded').reduce((s, p) => s + (p.amount || 0), 0),
        failed: monthPayments.filter(p => p.status === 'failed').length,
      });
    }
    return months;
  })();

  // Debt over time (cumulative by contract accepted_at)
  const debtOverTime = (() => {
    const sorted = [...contracts]
      .filter(c => c.is_accepted && c.accepted_at)
      .sort((a, b) => new Date(a.accepted_at) - new Date(b.accepted_at));
    let running = 0;
    return sorted.map(c => {
      running += (c.total_obligation || 0);
      return {
        date: new Date(c.accepted_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        debt: running,
        name: c.title.slice(0, 15) + '...',
      };
    });
  })();

  // Intensity breakdown
  const intensityData = Object.entries(
    activeContracts.reduce((acc, c) => {
      acc[c.intensity_level] = (acc[c.intensity_level] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value, color: INTENSITY_COLORS[name] || '#6b7280' }));

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(createPageUrl('Home'))} className="flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" /> Financial Health
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="px-4 pb-24 space-y-6 pt-6">
        {/* Health Score */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center"
        >
          <p className="text-zinc-400 text-sm mb-4">Overall Financial Health Score</p>
          <div className="relative w-36 h-36 mx-auto mb-4">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#27272a" strokeWidth="12" />
              <circle cx="60" cy="60" r="50" fill="none" strokeWidth="12"
                stroke="url(#scoreGrad)"
                strokeDasharray={`${(healthScore / 100) * 314} 314`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={healthScore >= 60 ? '#22c55e' : healthScore >= 40 ? '#f59e0b' : '#ef4444'} />
                  <stop offset="100%" stopColor={healthScore >= 60 ? '#10b981' : healthScore >= 40 ? '#f97316' : '#dc2626'} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${scoreInfo.color}`}>{healthScore}</span>
              <span className="text-zinc-500 text-xs">/ 100</span>
            </div>
          </div>
          <p className={`text-2xl font-bold ${scoreInfo.color}`}>{scoreInfo.label}</p>
          <p className="text-zinc-500 text-xs mt-1">Based on payment history, debt load & contract intensity</p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Debt', value: `$${totalDebt.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, icon: AlertTriangle, color: 'text-red-400' },
            { label: 'Monthly Obligation', value: `$${monthlyObligation.toLocaleString()}`, icon: DollarSign, color: 'text-yellow-400' },
            { label: 'Total Paid', value: `$${totalPaid.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, icon: CheckCircle, color: 'text-green-400' },
            { label: 'Active Contracts', value: activeContracts.length, icon: Activity, color: 'text-blue-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-zinc-500 text-xs">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Payment Trend Chart */}
        {paymentTrend.some(m => m.paid > 0 || m.failed > 0) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
          >
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" /> Payment Trends (6 months)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={paymentTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
                <Bar dataKey="paid" name="Paid ($)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Debt Over Time */}
        {debtOverTime.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
          >
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Total Debt Growth
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={debtOverTime} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} labelStyle={{ color: '#fff' }} formatter={(v) => [`$${v.toLocaleString()}`, 'Cumulative Debt']} />
                <Line type="monotone" dataKey="debt" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Contract Intensity Breakdown */}
        {intensityData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
          >
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" /> Contract Intensity Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={intensityData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {intensityData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {intensityData.map(e => (
                <div key={e.name} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: e.color }} />
                  <span className="text-zinc-400 text-xs capitalize">{e.name} ({e.value})</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Debt-to-Income */}
        {user?.annual_income > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
          >
            <h3 className="text-white font-bold mb-3">Debt-to-Income Ratio</h3>
            {(() => {
              const monthly = user.annual_income / 12;
              const ratio = monthlyObligation / monthly;
              const pct = Math.min(ratio * 100, 100);
              const color = pct > 50 ? '#ef4444' : pct > 30 ? '#f97316' : '#22c55e';
              return (
                <>
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>Monthly obligations vs income</span>
                    <span style={{ color }} className="font-bold">{(ratio * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <p className="text-zinc-500 text-xs mt-2">
                    {ratio > 0.5 ? '⚠️ High risk — obligations exceed 50% of income' :
                     ratio > 0.3 ? '⚡ Moderate — consider reducing obligations' :
                     '✅ Healthy ratio'}
                  </p>
                </>
              );
            })()}
          </motion.div>
        )}

        {/* Financial Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold">Financial Profile</h2>
              <p className="text-zinc-500 text-xs">Enhances score accuracy</p>
            </div>
          </div>

          {/* SSN */}
          <div>
            <Label className="text-zinc-400 text-sm flex items-center gap-2 mb-2">
              <Shield className="w-3 h-3" /> SSN / SIN
            </Label>
            <div className="relative">
              <Input type={showSsn ? 'text' : 'password'} value={profile.ssn_sin}
                onChange={(e) => handleChange('ssn_sin', e.target.value)}
                placeholder="e.g. 123-45-6789"
                className="bg-zinc-800 border-zinc-700 text-white pr-10"
              />
              <button onClick={() => setShowSsn(!showSsn)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                {showSsn ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-400 text-sm flex items-center gap-2 mb-2"><DollarSign className="w-3 h-3" /> Annual Income ($)</Label>
              <Input type="number" inputMode="numeric" value={profile.annual_income} onChange={(e) => handleChange('annual_income', e.target.value)} placeholder="60000" className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div>
              <Label className="text-zinc-400 text-sm flex items-center gap-2 mb-2"><DollarSign className="w-3 h-3" /> Monthly Expenses ($)</Label>
              <Input type="number" inputMode="numeric" value={profile.monthly_expenses} onChange={(e) => handleChange('monthly_expenses', e.target.value)} placeholder="2500" className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div>
              <Label className="text-zinc-400 text-sm flex items-center gap-2 mb-2"><CreditCard className="w-3 h-3" /> Credit Score</Label>
              <Input type="number" inputMode="numeric" value={profile.credit_score} onChange={(e) => handleChange('credit_score', e.target.value)} placeholder="720" min={300} max={850} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div>
              <Label className="text-zinc-400 text-sm flex items-center gap-2 mb-2"><TrendingUp className="w-3 h-3" /> Net Worth ($)</Label>
              <Input type="number" inputMode="numeric" value={profile.net_worth} onChange={(e) => handleChange('net_worth', e.target.value)} placeholder="50000" className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
          </div>

          <div>
            <Label className="text-zinc-400 text-sm flex items-center gap-2 mb-2"><Briefcase className="w-3 h-3" /> Employment Status</Label>
            <MobileSelect value={profile.employment_status} onValueChange={(v) => handleChange('employment_status', v)}
              options={[
                { value: 'employed', label: 'Employed' },
                { value: 'self_employed', label: 'Self-Employed' },
                { value: 'unemployed', label: 'Unemployed' },
                { value: 'student', label: 'Student' },
                { value: 'retired', label: 'Retired' },
              ]}
              placeholder="Select status" title="Employment Status"
              triggerClassName="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          {profile.credit_score && (
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <p className="text-zinc-400 text-xs mb-2">Credit Score Rating</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 relative">
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow border-2 border-zinc-900"
                    style={{ left: `${Math.max(0, Math.min(100, ((parseInt(profile.credit_score) - 300) / 550) * 100))}%`, transform: 'translate(-50%, -50%)' }}
                  />
                </div>
                <span className={`text-sm font-bold ${profile.credit_score >= 750 ? 'text-green-400' : profile.credit_score >= 670 ? 'text-yellow-400' : profile.credit_score >= 580 ? 'text-orange-400' : 'text-red-400'}`}>
                  {profile.credit_score >= 750 ? 'Excellent' : profile.credit_score >= 670 ? 'Good' : profile.credit_score >= 580 ? 'Fair' : 'Poor'}
                </span>
              </div>
            </div>
          )}

          {hasChanges && (
            <Button onClick={() => saveMutation.mutate(profile)} disabled={saveMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Financial Profile'}
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
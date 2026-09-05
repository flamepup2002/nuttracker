import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowLeft, BarChart3, TrendingUp, Percent } from 'lucide-react';

export default function EnforcementAnalytics() {
  const { data: sessions = [] } = useQuery({ queryKey: ['eaSessions'], queryFn: () => base44.entities.Session.list('-created_date', 200) });
  const { data: contracts = [] } = useQuery({ queryKey: ['eaContracts'], queryFn: () => base44.entities.DebtContract.list('-created_date', 200) });
  const { data: records = [] } = useQuery({ queryKey: ['eaRecords'], queryFn: () => base44.entities.CriminalRecord.list('-added_at', 200) });
  const { data: warrants = [] } = useQuery({ queryKey: ['eaWarrants'], queryFn: () => base44.entities.ArrestWarrant.list('-issued_at', 200) });

  // Session frequency by day (last 14 days)
  const sessionByDay = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const count = sessions.filter(s => { const sd = new Date(s.start_time || s.created_date); return sd.toDateString() === d.toDateString(); }).length;
    return { day: label, sessions: count };
  });

  // Debt accrued over time (cumulative by month, last 12 months)
  const debtByMonth = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (11 - i));
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const monthContracts = contracts.filter(c => { const cd = new Date(c.created_date); return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear(); });
    const accrued = monthContracts.reduce((s, c) => s + (c.total_obligation || (c.monthly_payment || 0) * (c.duration_months || 0)), 0);
    return { month: label, debt: Math.round(accrued) };
  });

  // Enforcement success rate
  const resolvedWarrants = warrants.filter(w => w.status === 'resolved').length;
  const activeWarrants = warrants.filter(w => w.status === 'active').length;
  const successRate = warrants.length > 0 ? Math.round((resolvedWarrants / warrants.length) * 100) : 0;
  const pieData = [
    { name: 'Resolved', value: resolvedWarrants, color: '#22c55e' },
    { name: 'Active', value: activeWarrants, color: '#ef4444' },
  ];

  // Enforcement actions by type
  const actionData = [
    { name: 'Charges Filed', value: records.length },
    { name: 'Warrants Issued', value: warrants.length },
    { name: 'Convictions', value: records.filter(r => r.severity === 'felony' || r.severity === 'federal').length },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          Enforcement Analytics
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5 text-center">
            <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-1" />
            <p className="text-zinc-400 text-xs">Total Sessions</p>
            <p className="text-white font-bold text-2xl">{sessions.length}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5 text-center">
            <Percent className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <p className="text-zinc-400 text-xs">Enforcement Success</p>
            <p className="text-green-400 font-bold text-2xl">{successRate}%</p>
          </div>
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5 text-center">
            <BarChart3 className="w-6 h-6 text-red-400 mx-auto mb-1" />
            <p className="text-zinc-400 text-xs">Criminal Records</p>
            <p className="text-red-400 font-bold text-2xl">{records.length}</p>
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <h3 className="text-white font-bold mb-4">Session Frequency (14 days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sessionByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" stroke="#71717a" fontSize={10} />
              <YAxis stroke="#71717a" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Bar dataKey="sessions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <h3 className="text-white font-bold mb-4">Debt Accrued Over Time (12 months)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={debtByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} formatter={(v) => `$${v}`} />
              <Line type="monotone" dataKey="debt" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
            <h3 className="text-white font-bold mb-4">Warrant Resolution Rate</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
            <h3 className="text-white font-bold mb-4">Enforcement Actions</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={actionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis type="number" stroke="#71717a" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={11} width={100} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
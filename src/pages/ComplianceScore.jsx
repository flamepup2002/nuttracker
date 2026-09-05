import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck, TrendingDown, Award, AlertTriangle } from 'lucide-react';

export default function ComplianceScore() {
  const { data: user } = useQuery({ queryKey: ['complianceUser'], queryFn: () => base44.auth.me() });
  const { data: records = [] } = useQuery({ queryKey: ['complianceRecords'], queryFn: () => base44.entities.CriminalRecord.list('-added_at', 50) });
  const { data: tasks = [] } = useQuery({ queryKey: ['complianceTasks'], queryFn: () => base44.entities.BullyTask.list('-assigned_at', 50) });
  const { data: contracts = [] } = useQuery({ queryKey: ['complianceContracts'], queryFn: () => base44.entities.DebtContract.filter({ is_accepted: true }) });
  const { data: payments = [] } = useQuery({ queryKey: ['compliancePayments'], queryFn: () => base44.entities.Payment.list('-created_date', 50) });

  const repScore = user?.reputation_score ?? 100;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const taskCompliance = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 100;
  const onTimePayments = payments.filter(p => p.status === 'succeeded').length;
  const paymentCompliance = payments.length > 0 ? (onTimePayments / payments.length) * 100 : 100;
  const activeContracts = contracts.filter(c => !c.cancelled_at).length;
  const felonyCount = records.filter(r => r.severity === 'felony' || r.severity === 'federal').length;

  const complianceScore = Math.round((repScore * 0.4 + taskCompliance * 0.3 + paymentCompliance * 0.3) - felonyCount * 5);
  const grade = complianceScore >= 90 ? 'A' : complianceScore >= 75 ? 'B' : complianceScore >= 60 ? 'C' : complianceScore >= 40 ? 'D' : 'F';
  const gradeColor = grade === 'A' ? 'text-green-400' : grade === 'B' ? 'text-blue-400' : grade === 'C' ? 'text-yellow-400' : grade === 'D' ? 'text-orange-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-green-400" />
          Compliance Score
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-2 border-green-600/30 rounded-2xl p-8 text-center">
          <p className="text-zinc-400 text-sm">Overall Compliance Grade</p>
          <p className={`text-7xl font-bold ${gradeColor} my-2`}>{grade}</p>
          <p className="text-white font-bold text-2xl">{Math.max(0, complianceScore)}/100</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-3">
          <ScoreBar label="Reputation Standing" value={repScore} icon={Award} color="from-purple-500 to-pink-500" />
          <ScoreBar label="Task Compliance" value={taskCompliance} icon={ShieldCheck} color="from-blue-500 to-cyan-500" subtext={`${completedTasks}/${tasks.length} tasks completed`} />
          <ScoreBar label="Payment Compliance" value={paymentCompliance} icon={ShieldCheck} color="from-green-500 to-emerald-500" subtext={`${onTimePayments}/${payments.length} payments succeeded`} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5 text-center">
            <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-zinc-400 text-xs">Criminal Charges</p>
            <p className="text-red-400 font-bold text-2xl">{records.length}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5 text-center">
            <TrendingDown className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-zinc-400 text-xs">Active Contracts</p>
            <p className="text-orange-400 font-bold text-2xl">{activeContracts}</p>
          </div>
        </div>

        {user?.reputation_status && user.reputation_status !== 'pristine' && (
          <div className={`rounded-2xl border p-5 ${user.reputation_status === 'ruined' ? 'bg-red-950/50 border-red-700/50' : user.reputation_status === 'disgraced' ? 'bg-orange-950/50 border-orange-700/50' : 'bg-yellow-950/50 border-yellow-700/50'}`}>
            <p className="text-zinc-400 text-xs">Current Standing</p>
            <p className={`font-bold uppercase ${user.reputation_status === 'ruined' ? 'text-red-400' : user.reputation_status === 'disgraced' ? 'text-orange-400' : 'text-yellow-400'}`}>{user.reputation_status}</p>
            {user.reputation_shame && <p className="text-zinc-500 text-sm mt-2 italic">"{user.reputation_shame}"</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ label, value, icon: Icon, color, subtext }) {
  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-zinc-400" />
          <span className="text-white text-sm">{label}</span>
        </div>
        <span className="text-white font-bold">{Math.round(value)}%</span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-2">
        <div className={`bg-gradient-to-r ${color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      {subtext && <p className="text-zinc-500 text-xs mt-2">{subtext}</p>}
    </div>
  );
}
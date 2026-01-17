import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BarChart3, Users, Activity, TrendingUp, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Check admin access
  React.useEffect(() => {
    base44.auth.me().then(userData => {
      if (userData?.role !== 'admin') {
        navigate(createPageUrl('Home'));
      }
      setUser(userData);
    });
  }, [navigate]);

  const { data: allAnalytics = [] } = useQuery({
    queryKey: ['allAnalytics'],
    queryFn: () => base44.entities.UserAnalytics.list('-created_date', 5000),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['allTasks'],
    queryFn: () => base44.entities.BullyTask.list('-created_date', 5000),
  });

  // Analytics calculations
  const featureBreakdown = allAnalytics.reduce((acc, a) => {
    const existing = acc.find(x => x.name === a.feature);
    if (existing) {
      existing.sessions += 1;
      existing.totalTime += a.session_duration_seconds || 0;
    } else {
      acc.push({
        name: a.feature,
        sessions: 1,
        totalTime: a.session_duration_seconds || 0
      });
    }
    return acc;
  }, []);

  const engagementDistribution = allAnalytics.reduce((acc, a) => {
    const bucket = Math.floor(a.engagement_level / 20) * 20;
    const existing = acc.find(x => x.range === `${bucket}-${bucket + 20}`);
    if (existing) existing.count += 1;
    else acc.push({ range: `${bucket}-${bucket + 20}`, count: 1 });
    return acc;
  }, []);

  const taskStats = {
    total: allTasks.length,
    pending: allTasks.filter(t => t.status === 'pending').length,
    completed: allTasks.filter(t => t.status === 'completed').length,
    submitted: allTasks.filter(t => t.status === 'submitted').length
  };

  const totalSessionTime = allAnalytics.reduce((sum, a) => sum + (a.session_duration_seconds || 0), 0);
  const avgEngagement = allAnalytics.length > 0 
    ? (allAnalytics.reduce((sum, a) => sum + a.engagement_level, 0) / allAnalytics.length).toFixed(1)
    : 0;

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-white text-lg">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="border-b border-zinc-800 p-6">
        <button
          onClick={() => navigate(createPageUrl('Home'))}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-purple-400" />
          Analytics Dashboard
        </h1>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900 rounded-lg p-4">
            <p className="text-zinc-400 text-sm mb-2">Total Users</p>
            <p className="text-3xl font-bold text-white">{allUsers.length}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-zinc-900 rounded-lg p-4">
            <p className="text-zinc-400 text-sm mb-2">Total Sessions</p>
            <p className="text-3xl font-bold text-blue-400">{allAnalytics.length}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-zinc-900 rounded-lg p-4">
            <p className="text-zinc-400 text-sm mb-2">Avg Engagement</p>
            <p className="text-3xl font-bold text-green-400">{avgEngagement}%</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-zinc-900 rounded-lg p-4">
            <p className="text-zinc-400 text-sm mb-2">Total Tasks</p>
            <p className="text-3xl font-bold text-purple-400">{taskStats.total}</p>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feature Usage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800"
          >
            <h3 className="text-lg font-bold mb-4">Feature Usage</h3>
            <div className="w-full h-64 overflow-x-auto">
              <BarChart width={350} height={250} data={featureBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: '#27272a', border: 'none' }} />
                <Bar dataKey="sessions" fill="#8b5cf6" />
              </BarChart>
            </div>
          </motion.div>

          {/* Task Status Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800"
          >
            <h3 className="text-lg font-bold mb-4">Task Status</h3>
            <div className="flex justify-center">
              <PieChart width={300} height={250}>
                <Pie
                  data={[
                    { name: 'Pending', value: taskStats.pending },
                    { name: 'Submitted', value: taskStats.submitted },
                    { name: 'Completed', value: taskStats.completed }
                  ]}
                  cx={150}
                  cy={125}
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={index} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          </motion.div>

          {/* Engagement Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 lg:col-span-2"
          >
            <h3 className="text-lg font-bold mb-4">Engagement Levels</h3>
            <div className="w-full h-64 overflow-x-auto">
              <BarChart width={700} height={250} data={engagementDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="range" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: '#27272a', border: 'none' }} />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </div>
          </motion.div>
        </div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800"
        >
          <h3 className="text-lg font-bold mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-zinc-400 text-sm">Total Session Time</p>
              <p className="text-2xl font-bold text-blue-400">{(totalSessionTime / 3600).toFixed(1)}h</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Pending Tasks</p>
              <p className="text-2xl font-bold text-yellow-400">{taskStats.pending}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Completed Tasks</p>
              <p className="text-2xl font-bold text-green-400">{taskStats.completed}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Active Users</p>
              <p className="text-2xl font-bold text-purple-400">{new Set(allAnalytics.map(a => a.created_by)).size}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
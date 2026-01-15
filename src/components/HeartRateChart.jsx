import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';

export default function HeartRateChart({ data }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
  };

  const chartData = data?.slice(-60) || [];

  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-red-500" />
        <span className="text-zinc-400 text-sm font-medium">Heart Rate Over Time</span>
      </div>

      {chartData.length > 0 ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="heartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                stroke="#52525b"
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={['dataMin - 10', 'dataMax + 10']}
                stroke="#52525b"
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#a1a1aa' }}
                itemStyle={{ color: '#ef4444' }}
                formatter={(value) => [`${value} BPM`, 'Heart Rate']}
                labelFormatter={formatTime}
              />
              <Area
                type="monotone"
                dataKey="bpm"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#heartGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-zinc-600">
          <p>No heart rate data yet</p>
        </div>
      )}
    </div>
  );
}
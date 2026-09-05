import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Building2, Gavel, Calendar } from 'lucide-react';

export default function SentenceTracker() {
  const { data: user } = useQuery({ queryKey: ['sentenceUser'], queryFn: () => base44.auth.me() });
  const { data: records = [] } = useQuery({
    queryKey: ['sentenceRecords'],
    queryFn: () => base44.entities.CriminalRecord.list('-added_at', 50),
  });

  const felonyRecords = records.filter(r => r.severity === 'felony' || r.severity === 'federal');
  const sentenceStart = records.length > 0 ? new Date(records[records.length - 1].added_at || records[records.length - 1].created_date) : null;
  const sentenceLengthDays = felonyRecords.length > 0 ? 365 * (felonyRecords.length === 1 ? 5 : 10) : 0;
  const daysServed = sentenceStart ? Math.floor((Date.now() - sentenceStart.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const releaseDate = sentenceStart ? new Date(sentenceStart.getTime() + sentenceLengthDays * 24 * 60 * 60 * 1000) : null;
  const progress = sentenceLengthDays > 0 ? Math.min(100, (daysServed / sentenceLengthDays) * 100) : 0;

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          Sentence Tracker
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        {user?.court_ordered_address ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-zinc-400" />
              <p className="text-zinc-400 text-sm">Assigned Facility</p>
            </div>
            <p className="text-white font-bold whitespace-pre-line">{user.court_ordered_address}</p>
          </motion.div>
        ) : (
          <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <Building2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">No active sentence — you are not currently remanded to a facility.</p>
          </div>
        )}

        {sentenceLengthDays > 0 && (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-700/30 rounded-2xl p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-zinc-400 text-xs">Days Served</p>
                  <p className="text-white font-bold text-2xl">{daysServed}</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-xs">Total Sentence</p>
                  <p className="text-white font-bold text-2xl">{sentenceLengthDays}</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-xs">Days Left</p>
                  <p className="text-white font-bold text-2xl">{Math.max(0, sentenceLengthDays - daysServed)}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-zinc-800 rounded-full h-3">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-center text-zinc-400 text-xs mt-2">{progress.toFixed(1)}% served</p>
              </div>
            </motion.div>

            {releaseDate && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-zinc-400 text-xs">Projected Release Date</p>
                  <p className="text-white font-bold">{releaseDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </motion.div>
            )}
          </>
        )}

        {felonyRecords.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Gavel className="w-5 h-5 text-red-400" /> Convictions on Record</h3>
            <div className="space-y-2">
              {felonyRecords.map((r) => (
                <div key={r.id} className="flex justify-between items-center bg-zinc-800/50 rounded-lg p-3">
                  <span className="text-white text-sm">{r.charge}</span>
                  <span className="text-red-400 text-xs font-bold uppercase">{r.severity}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
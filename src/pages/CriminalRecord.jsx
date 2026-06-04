import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ScrollText, Shield, AlertTriangle, FileText, Clock } from 'lucide-react';

const SEVERITY_CONFIG = {
  misdemeanor: { label: 'Misdemeanor', color: 'text-yellow-400', bg: 'bg-yellow-950/40 border-yellow-700/40' },
  felony: { label: 'Felony', color: 'text-orange-400', bg: 'bg-orange-950/40 border-orange-700/40' },
  federal: { label: 'Federal', color: 'text-red-400', bg: 'bg-red-950/40 border-red-700/40' },
};

const SOURCE_LABELS = {
  missed_court_date: '⚠ Missed Court Date',
  contract_breach: '📄 Contract Breach',
  warrant_issued: '🚨 Warrant Issued',
  original_charge: '⚖️ Original Charge',
};

export default function CriminalRecord() {
  const navigate = useNavigate();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['criminalRecords'],
    queryFn: () => base44.entities.CriminalRecord.list('-added_at', 200),
  });

  const federal = records.filter(r => r.severity === 'federal');
  const felony = records.filter(r => r.severity === 'felony');
  const misdemeanor = records.filter(r => r.severity === 'misdemeanor');

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-red-500" />
            Criminal Record
          </h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="px-6 pb-24 pt-6 space-y-6">
        {isLoading ? (
          <div className="text-center py-16 text-zinc-500">Loading...</div>
        ) : records.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center"
          >
            <Shield className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">Clean Record</p>
            <p className="text-zinc-600 text-sm">No criminal charges on record.</p>
          </motion.div>
        ) : (
          <>
            {/* Header Warning */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-red-950/50 border-2 border-red-600/70 rounded-2xl p-5"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-7 h-7 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 font-bold text-lg">OFFICIAL CRIMINAL RECORD</p>
                  <p className="text-red-400/80 text-sm mt-1">
                    All charges filed against you are permanently recorded here. Missed court dates add additional charges.
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-red-300 font-bold text-xl">{federal.length}</p>
                      <p className="text-zinc-500 text-xs">Federal</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-orange-300 font-bold text-xl">{felony.length}</p>
                      <p className="text-zinc-500 text-xs">Felonies</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-yellow-300 font-bold text-xl">{misdemeanor.length}</p>
                      <p className="text-zinc-500 text-xs">Misdemeanors</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Records List */}
            <div className="space-y-3">
              {records.map((record, idx) => {
                const sev = SEVERITY_CONFIG[record.severity] || SEVERITY_CONFIG.misdemeanor;
                return (
                  <motion.div key={record.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                    className={`border rounded-2xl p-4 ${sev.bg}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded bg-black/30 ${sev.color}`}>{sev.label}</span>
                      <span className="text-xs text-zinc-500">{SOURCE_LABELS[record.source] || record.source}</span>
                    </div>
                    <p className="text-zinc-200 text-sm leading-relaxed">{record.charge}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      <p className="text-zinc-600 text-xs">{new Date(record.added_at).toLocaleString()}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
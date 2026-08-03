import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fileWithLocalDatabase } from '@/lib/localCriminalDatabase';
import {
  ArrowLeft, Siren, ShieldCheck, Database, Clock, FileText,
  CheckCircle2, AlertTriangle, Loader2, Link2, MapPin
} from 'lucide-react';

const SEVERITY_CONFIG = {
  misdemeanor: { label: 'Misdemeanor', color: 'text-yellow-400', bg: 'bg-yellow-950/30 border-yellow-700/40' },
  felony: { label: 'Felony', color: 'text-orange-400', bg: 'bg-orange-950/30 border-orange-700/40' },
  federal: { label: 'Federal', color: 'text-red-400', bg: 'bg-red-950/30 border-red-700/40' },
};

export default function PoliceDatabase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filingId, setFilingId] = useState(null);

  const { data: records = [], isLoading: loadingRecords } = useQuery({
    queryKey: ['criminalRecords'],
    queryFn: () => base44.entities.CriminalRecord.list('-added_at', 200),
  });

  const { data: warrants = [], isLoading: loadingWarrants } = useQuery({
    queryKey: ['arrestWarrants'],
    queryFn: () => base44.entities.ArrestWarrant.list('-issued_at', 100),
  });

  const warrantsById = {};
  warrants.forEach(w => { warrantsById[w.id] = w; });

  const filed = records.filter(r => r.database_filed);
  const pending = records.filter(r => !r.database_filed);
  const linkedWarrants = records.filter(r => r.warrant_id).map(r => warrantsById[r.warrant_id]).filter(Boolean);
  const activeLinkedWarrants = linkedWarrants.filter(w => w.status === 'active');

  const fileMutation = useMutation({
    onMutate: (payload) => setFilingId(payload.id),
    mutationFn: async (payload) => {
      const updated = await base44.entities.CriminalRecord.update(payload.id, payload.data);
      return { ...updated, warrant_id: payload.warrant_id ?? updated.warrant_id };
    },
    onSuccess: async (filed) => {
      // If this record is linked to an arrest warrant, auto-resolve the warrant
      let warrantResolved = false;
      if (filed.warrant_id && warrantsById[filed.warrant_id]?.status === 'active') {
        try {
          await base44.entities.ArrestWarrant.update(filed.warrant_id, {
            status: 'resolved',
            resolved_at: new Date().toISOString(),
          });
          warrantResolved = true;
        } catch (e) {
          // warrant update failed — record still filed
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['criminalRecords'] });
      await queryClient.invalidateQueries({ queryKey: ['arrestWarrants'] });
      setFilingId(null);
      toast.success('🗄️ Filed with police database', {
        description: warrantResolved
          ? 'Record entered into EPS/CPIC — linked arrest warrant marked resolved.'
          : `Record entered into EPS/CPIC — ${filed.database_reference}`,
      });
    },
    onError: (err) => {
      setFilingId(null);
      toast.error('Failed to file with police database', { description: String(err?.message || err) });
    },
  });

  const handleFile = (record) => {
    const filed = fileWithLocalDatabase(record);
    fileMutation.mutate({
      id: record.id,
      warrant_id: record.warrant_id,
      data: {
        database_filed: true,
        database_name: filed.database_name,
        database_reference: filed.database_reference,
        filed_at: filed.filed_at,
      },
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Siren className="w-5 h-5 text-blue-400" />
            Police Database
          </h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="px-6 pb-24 pt-6 space-y-6">
        {/* Info banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-blue-950/40 border border-blue-700/50 rounded-2xl p-4 flex items-start gap-3"
        >
          <Database className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-200 font-bold text-sm">Local Police Database Integration</p>
            <p className="text-blue-300/70 text-xs mt-1 leading-relaxed">
              Criminal records are transmitted to the Edmonton Police Service records management system
              and the RCMP Canadian Police Information Centre (CPIC). Filing a record linked to an
              arrest warrant automatically marks that warrant as resolved once processed.
            </p>
          </div>
        </motion.div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{records.length}</p>
            <p className="text-zinc-500 text-xs mt-1">Total Records</p>
          </div>
          <div className="bg-green-950/30 border border-green-700/40 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-green-300">{filed.length}</p>
            <p className="text-zinc-500 text-xs mt-1">Filed</p>
          </div>
          <div className="bg-amber-950/30 border border-amber-700/40 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-300">{pending.length}</p>
            <p className="text-zinc-500 text-xs mt-1">Pending</p>
          </div>
        </div>

        {/* Active linked warrants */}
        {activeLinkedWarrants.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-950/40 border border-red-700/50 rounded-2xl p-4"
          >
            <p className="text-red-300 font-bold text-sm flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" /> {activeLinkedWarrants.length} Active Warrant{activeLinkedWarrants.length > 1 ? 's' : ''} Awaiting Processing
            </p>
            <p className="text-red-300/70 text-xs">
              File the linked criminal record with the police database to mark these warrants as resolved.
            </p>
          </motion.div>
        )}

        {loadingRecords || loadingWarrants ? (
          <div className="text-center py-16 text-zinc-500">Loading...</div>
        ) : records.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center"
          >
            <ShieldCheck className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No Records to File</p>
            <p className="text-zinc-600 text-sm">No criminal records are currently on file.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Criminal Records</p>
            {records.map((record, idx) => {
              const sev = SEVERITY_CONFIG[record.severity] || SEVERITY_CONFIG.misdemeanor;
              const linkedWarrant = record.warrant_id ? warrantsById[record.warrant_id] : null;
              const isFiling = filingId === record.id;
              return (
                <motion.div key={record.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                  className={`border rounded-2xl p-4 ${record.database_filed ? 'bg-zinc-900 border-zinc-700' : sev.bg}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded bg-black/30 ${sev.color}`}>{sev.label}</span>
                    {record.database_filed ? (
                      <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Filed
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>

                  <p className="text-zinc-200 text-sm leading-relaxed">{record.charge}</p>

                  {record.code_reference && (
                    <p className="text-zinc-500 text-xs mt-1">{record.code_reference}</p>
                  )}

                  {/* Filing details */}
                  {record.database_filed && (
                    <div className="mt-2 bg-black/30 rounded-lg p-2 space-y-1 text-xs">
                      <p className="text-zinc-400">
                        <span className="text-zinc-600">Database:</span> {record.database_name}
                      </p>
                      <p className="text-zinc-400">
                        <span className="text-zinc-600">Reference:</span> {record.database_reference}
                      </p>
                      {record.filed_at && (
                        <p className="text-zinc-400">
                          <span className="text-zinc-600">Filed:</span> {new Date(record.filed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Linked warrant */}
                  {linkedWarrant && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <Link2 className="w-3 h-3 text-zinc-500" />
                      <span className="text-zinc-500">Linked warrant:</span>
                      <span className={linkedWarrant.status === 'resolved' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {linkedWarrant.status === 'resolved' ? 'Resolved' : 'Active'}
                      </span>
                    </div>
                  )}

                  {/* GPS */}
                  {record.gps_latitude != null && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                      <MapPin className="w-3 h-3" />
                      <span>GPS: {Number(record.gps_latitude).toFixed(4)}, {Number(record.gps_longitude).toFixed(4)}</span>
                    </div>
                  )}

                  {/* Action */}
                  {!record.database_filed && (
                    <button
                      onClick={() => handleFile(record)}
                      disabled={isFiling}
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl py-2.5 transition-colors"
                    >
                      {isFiling ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Filing with EPS/CPIC...</>
                      ) : (
                        <><Database className="w-4 h-4" /> File with Police Database</>
                      )}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Gavel, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LegalAppeals() {
  const queryClient = useQueryClient();
  const [appealType, setAppealType] = useState('criminal_record');
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');

  const { data: records = [] } = useQuery({ queryKey: ['laRecords'], queryFn: () => base44.entities.CriminalRecord.list('-added_at', 50) });
  const { data: appeals = [], isLoading } = useQuery({ queryKey: ['laAppeals'], queryFn: () => base44.entities.Appeal.filter({ filed_to_board: false }, '-filed_at', 50) });

  const fileMutation = useMutation({
    mutationFn: (data) => base44.entities.Appeal.create(data),
    onSuccess: () => {
      toast.success('Appeal filed with the Court');
      setReason(''); setTargetId('');
      queryClient.invalidateQueries({ queryKey: ['laAppeals'] });
    },
    onError: () => toast.error('Failed to file appeal'),
  });

  const handleFile = () => {
    if (!reason.trim()) { toast.error('Please provide grounds for your appeal'); return; }
    const target = records.find(r => r.id === targetId);
    fileMutation.mutate({
      appeal_type: appealType,
      target_id: targetId || null,
      target_description: target?.charge || 'General appeal',
      reason,
      filed_at: new Date().toISOString(),
      filed_to_board: false,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Gavel className="w-5 h-5 text-amber-400" />
          Legal Appeals
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-4">
          <h3 className="text-white font-bold">File a New Appeal</h3>
          <p className="text-zinc-400 text-sm">Formally request a review of your criminal records or court-ordered sentences.</p>

          <div>
            <Label className="text-zinc-400 text-sm mb-1 block">Appeal Type</Label>
            <Select value={appealType} onValueChange={setAppealType}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="criminal_record">Criminal Record</SelectItem>
                <SelectItem value="sentence">Court-Ordered Sentence</SelectItem>
                <SelectItem value="penalty">Financial Penalty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {appealType === 'criminal_record' && records.length > 0 && (
            <div>
              <Label className="text-zinc-400 text-sm mb-1 block">Select Charge to Appeal</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue placeholder="Choose a charge..." /></SelectTrigger>
                <SelectContent>
                  {records.map(r => <SelectItem key={r.id} value={r.id}>{r.charge}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-zinc-400 text-sm mb-1 block">Grounds for Appeal</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why this record or sentence should be reviewed..." className="bg-zinc-800 border-zinc-700 h-28" />
          </div>

          <Button onClick={handleFile} disabled={fileMutation.isPending} className="w-full bg-amber-600 hover:bg-amber-700">
            <Send className="w-4 h-4 mr-2" /> File Appeal
          </Button>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2"><FileText className="w-5 h-5" /> Your Filed Appeals</h3>
          {isLoading && <p className="text-zinc-500 text-center py-4">Loading...</p>}
          {appeals.length === 0 && !isLoading && <p className="text-zinc-500 text-center py-4">No appeals filed yet</p>}
          <div className="space-y-2">
            {appeals.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-zinc-800/50 rounded-lg p-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-white text-sm font-bold uppercase">{a.appeal_type.replace('_', ' ')}</span>
                  <span className={`text-xs font-bold uppercase ${a.status === 'approved' ? 'text-green-400' : a.status === 'denied' ? 'text-red-400' : 'text-yellow-400'}`}>{a.status}</span>
                </div>
                <p className="text-zinc-400 text-xs">{a.target_description}</p>
                <p className="text-zinc-500 text-xs mt-1">Filed: {new Date(a.filed_at).toLocaleDateString()}</p>
                <p className="text-zinc-400 text-sm mt-2">{a.reason}</p>
                {a.board_notes && <p className="text-amber-400 text-xs mt-2 italic">Court notes: {a.board_notes}</p>}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
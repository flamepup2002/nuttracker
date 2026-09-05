import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Gavel, FileText, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AppealsBoard() {
  const queryClient = useQueryClient();
  const [appealType, setAppealType] = useState('penalty');
  const [targetDescription, setTargetDescription] = useState('');
  const [reason, setReason] = useState('');

  const { data: appeals = [], isLoading } = useQuery({
    queryKey: ['boardAppeals'],
    queryFn: () => base44.entities.Appeal.filter({ filed_to_board: true }, '-filed_at', 50),
  });

  const fileMutation = useMutation({
    mutationFn: (data) => base44.entities.Appeal.create(data),
    onSuccess: () => {
      toast.success('Appeal filed with the Board');
      setReason(''); setTargetDescription('');
      queryClient.invalidateQueries({ queryKey: ['boardAppeals'] });
    },
    onError: () => toast.error('Failed to file appeal'),
  });

  const handleFile = () => {
    if (!reason.trim()) { toast.error('Please provide grounds for your appeal'); return; }
    fileMutation.mutate({
      appeal_type: appealType,
      target_description: targetDescription || `Appeal against ${appealType.replace('_', ' ')}`,
      reason,
      filed_at: new Date().toISOString(),
      filed_to_board: true,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Gavel className="w-5 h-5 text-purple-400" />
          Appeals Board
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-4">
          <h3 className="text-white font-bold">File a Formal Appeal</h3>
          <p className="text-zinc-400 text-sm">File an appeal against Judge-assigned penalties or reputation hits for board consideration.</p>

          <div>
            <Label className="text-zinc-400 text-sm mb-1 block">Appeal Category</Label>
            <Select value={appealType} onValueChange={setAppealType}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="penalty">Financial Penalty</SelectItem>
                <SelectItem value="reputation_hit">Reputation Hit</SelectItem>
                <SelectItem value="sentence">Sentence / Prison Assignment</SelectItem>
                <SelectItem value="criminal_record">Criminal Record</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-zinc-400 text-sm mb-1 block">What specifically are you appealing?</Label>
            <Textarea value={targetDescription} onChange={(e) => setTargetDescription(e.target.value)} placeholder="e.g. $500 late payment penalty, reputation drop to 'disgraced', prison assignment to Edmonton Institution..." className="bg-zinc-800 border-zinc-700 h-20" />
          </div>

          <div>
            <Label className="text-zinc-400 text-sm mb-1 block">Grounds for Appeal</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why the Board should overturn this penalty..." className="bg-zinc-800 border-zinc-700 h-28" />
          </div>

          <Button onClick={handleFile} disabled={fileMutation.isPending} className="w-full bg-purple-600 hover:bg-purple-700">
            <Send className="w-4 h-4 mr-2" /> Submit to Appeals Board
          </Button>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2"><FileText className="w-5 h-5" /> Your Board Appeals</h3>
          {isLoading && <p className="text-zinc-500 text-center py-4">Loading...</p>}
          {appeals.length === 0 && !isLoading && <p className="text-zinc-500 text-center py-4">No appeals filed with the Board yet</p>}
          <div className="space-y-3">
            {appeals.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-zinc-800/50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-white text-sm font-bold uppercase">{a.appeal_type.replace('_', ' ')}</span>
                    <p className="text-zinc-400 text-xs">{a.target_description}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <p className="text-zinc-300 text-sm">{a.reason}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span className="text-zinc-500 text-xs">Filed {new Date(a.filed_at).toLocaleDateString()}</span>
                </div>
                {a.board_notes && (
                  <div className="mt-2 bg-purple-950/30 rounded p-2">
                    <p className="text-purple-300 text-xs"><strong>Board:</strong> {a.board_notes}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    pending: { icon: Clock, color: 'text-yellow-400', label: 'Pending' },
    under_review: { icon: Clock, color: 'text-blue-400', label: 'Under Review' },
    approved: { icon: CheckCircle, color: 'text-green-400', label: 'Approved' },
    denied: { icon: XCircle, color: 'text-red-400', label: 'Denied' },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`flex items-center gap-1 text-xs font-bold uppercase ${c.color}`}>
      <c.icon className="w-3 h-3" /> {c.label}
    </span>
  );
}
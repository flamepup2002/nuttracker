import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, DollarSign, FileText, Gavel, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function DebtSettlementPortal() {
  const queryClient = useQueryClient();
  const [selectedContract, setSelectedContract] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [negotiationText, setNegotiationText] = useState('');

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['settlementContracts'],
    queryFn: () => base44.entities.DebtContract.filter({ is_accepted: true, cancel_status: 'active' }, '-created_date', 50),
  });

  const settleMutation = useMutation({
    mutationFn: async ({ contract, amount }) => {
      const newPaid = (contract.amount_paid || 0) + Number(amount);
      return base44.entities.DebtContract.update(contract.id, { amount_paid: newPaid });
    },
    onSuccess: () => {
      toast.success('Settlement payment applied!');
      setPaymentAmount('');
      queryClient.invalidateQueries({ queryKey: ['settlementContracts'] });
    },
    onError: () => toast.error('Failed to process payment'),
  });

  const negotiateMutation = useMutation({
    mutationFn: async (contract) => {
      return base44.entities.DebtContract.update(contract.id, {
        dispute_status: 'pending',
        dispute_reason: negotiationText,
        disputed_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success('Negotiation request submitted to the Court');
      setNegotiationText('');
      queryClient.invalidateQueries({ queryKey: ['settlementContracts'] });
    },
    onError: () => toast.error('Failed to submit negotiation'),
  });

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          Debt Settlement Portal
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        {isLoading && <div className="text-center py-8 text-zinc-500">Loading debts...</div>}
        {!isLoading && contracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">No active debts to settle</p>
          </div>
        )}
        {contracts.map((c, i) => {
          const remaining = (c.total_obligation || c.monthly_payment * c.duration_months) - (c.amount_paid || 0);
          const isSelected = selectedContract?.id === c.id;
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-white">{c.title}</p>
                  <p className="text-zinc-500 text-sm">{c.intensity_level} · {c.duration_months}mo</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${remaining > 0 ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>
                  {remaining > 0 ? `$${remaining.toFixed(0)} owed` : 'SETTLED'}
                </span>
              </div>
              <div className="text-sm text-zinc-400 mb-3">
                Paid: ${((c.amount_paid || 0)).toFixed(0)} / ${((c.total_obligation || c.monthly_payment * c.duration_months)).toFixed(0)}
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 mb-4">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((c.amount_paid || 0) / (c.total_obligation || c.monthly_payment * c.duration_months || 1)) * 100)}%` }} />
              </div>

              {isSelected && (
                <div className="space-y-3 mt-4 pt-4 border-t border-zinc-800">
                  <div>
                    <Label className="text-zinc-400 text-sm mb-1">Manual Settlement Payment</Label>
                    <div className="flex gap-2">
                      <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Amount $" className="bg-zinc-800 border-zinc-700" />
                      <Button onClick={() => settleMutation.mutate({ contract: c, amount: paymentAmount })} disabled={!paymentAmount || settleMutation.isPending} className="bg-green-600 hover:bg-green-700">
                        Pay
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-sm mb-1">Negotiate Terms with the Court</Label>
                    <Textarea value={negotiationText} onChange={(e) => setNegotiationText(e.target.value)} placeholder="Propose new terms, reduced payments, or extended deadlines..." className="bg-zinc-800 border-zinc-700 h-20" />
                    <Button onClick={() => negotiateMutation.mutate(c)} disabled={!negotiationText || negotiateMutation.isPending} variant="outline" className="mt-2 border-amber-700 text-amber-400">
                      <Gavel className="w-4 h-4 mr-2" /> Submit Negotiation
                    </Button>
                  </div>
                </div>
              )}
              {!isSelected && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedContract(c)} className="text-pink-400">
                  Settle or Negotiate →
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft, Shield, AlertTriangle, CheckCircle, XCircle,
  FileText, Clock, Ban, MessageSquare
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminContractRequests() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [tab, setTab] = useState('disputes'); // 'disputes' | 'cancel_requests'

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch disputes — contracts with dispute_status pending
  const { data: disputes = [] } = useQuery({
    queryKey: ['adminDisputes'],
    queryFn: () => base44.entities.DebtContract.filter({ dispute_status: 'pending' }, '-disputed_at', 100),
    enabled: user?.role === 'admin',
  });

  // Fetch cancel requests — using UserFeedback with type 'other' and category 'account' and page_reported='cancel_request'
  const { data: cancelRequests = [] } = useQuery({
    queryKey: ['adminCancelRequests'],
    queryFn: () => base44.entities.UserFeedback.filter(
      { feedback_type: 'other', page_reported: 'cancel_request', status: 'new' },
      '-created_date', 100
    ),
    enabled: user?.role === 'admin',
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ contractId, resolution, note }) => {
      const contract = disputes.find(c => c.id === contractId);

      const updates = {
        dispute_status: resolution,
        admin_notes: note,
      };

      // If rejected AND user has all extreme settings enabled, trigger ALL contract penalties
      if (resolution === 'rejected' && contract) {
        // Check if user's settings have all extreme flags on by looking at the contract's own extreme indicators
        // We apply penalties if contract is extreme intensity AND irrevocable (proxy for full extreme mode)
        const isFullExtremeMode = contract.cancellation_irrevocable && contract.intensity_level === 'extreme';

        if (isFullExtremeMode) {
          const latePenalty = (contract.monthly_payment || 0) * ((contract.penalty_percentage || 50) / 100);
          const cancellationPenalty = (contract.monthly_payment || 0) * 3;
          const totalNewPenalty = latePenalty + cancellationPenalty;

          updates.cancellation_penalty_triggered = true;
          updates.cancellation_penalty_amount = (contract.cancellation_penalty_amount || 0) + totalNewPenalty;
          updates.total_obligation = (contract.total_obligation || 0) + totalNewPenalty;
          updates.dispute_rejected_penalty = totalNewPenalty;
        }
      }

      return base44.entities.DebtContract.update(contractId, updates);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['adminDisputes'] });
      const contract = disputes.find(c => c.id === vars.contractId);
      const isFullExtremeMode = contract?.cancellation_irrevocable && contract?.intensity_level === 'extreme';
      if (vars.resolution === 'rejected' && isFullExtremeMode) {
        toast.warning('Dispute rejected — all contract penalties triggered on user\'s account');
      } else {
        toast.success(vars.resolution === 'resolved' ? 'Dispute resolved' : 'Dispute rejected');
      }
      setSelectedItem(null);
      setAdminNote('');
    },
  });

  const approveCancelMutation = useMutation({
    mutationFn: async ({ requestId, contractId, irrevocable, monthlyPayment, approve }) => {
      if (approve) {
        // Apply irrevocable penalty even for admin if enabled, then force cancel
        const updates = {
          is_accepted: false,
          cancelled_at: new Date().toISOString(),
          cancelled_by_admin: true,
          cancel_status: 'cancelled',
        };
        if (irrevocable) {
          // Fetch current contract to preserve existing penalty amounts
          const existing = await base44.entities.DebtContract.filter({ id: contractId }, '-created_date', 1);
          const current = existing[0] || {};
          const penalty = monthlyPayment * 3;
          updates.cancellation_penalty_triggered = true;
          updates.cancellation_penalty_amount = (current.cancellation_penalty_amount || 0) + penalty;
          updates.total_obligation = (current.total_obligation || 0) + penalty;
        }
        await base44.entities.DebtContract.update(contractId, updates);
      }
      // Update the request status
      return base44.entities.UserFeedback.update(requestId, {
        status: approve ? 'resolved' : 'rejected',
        admin_notes: adminNote,
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['adminCancelRequests'] });
      toast.success(vars.approve ? 'Contract cancelled & request approved' : 'Cancel request denied');
      setSelectedItem(null);
      setAdminNote('');
    },
  });

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <Button onClick={() => navigate(createPageUrl('Home'))} className="mt-4 bg-purple-600">Go Home</Button>
        </div>
      </div>
    );
  }

  const items = tab === 'disputes' ? disputes : cancelRequests;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(createPageUrl('Home'))} className="flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" /> Contract Admin
          </h1>
          <div className="w-12" />
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setTab('disputes')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${tab === 'disputes' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-zinc-500'}`}
        >
          <AlertTriangle className="w-4 h-4" /> Disputes ({disputes.length})
        </button>
        <button
          onClick={() => setTab('cancel_requests')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${tab === 'cancel_requests' ? 'text-red-400 border-b-2 border-red-400' : 'text-zinc-500'}`}
        >
          <Ban className="w-4 h-4" /> Cancel Requests ({cancelRequests.length})
        </button>
      </div>

      <div className="px-6 py-6 space-y-4 pb-24">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">No pending {tab === 'disputes' ? 'disputes' : 'cancel requests'}</p>
          </div>
        ) : (
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                className={`bg-zinc-900 border rounded-2xl p-5 cursor-pointer hover:border-purple-500/50 transition-colors ${
                  tab === 'disputes' ? 'border-yellow-800/40' : 'border-red-800/40'
                }`}
                onClick={() => { setSelectedItem(item); setAdminNote(''); }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {tab === 'disputes'
                      ? <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      : <Ban className="w-5 h-5 text-red-400" />
                    }
                    <h3 className="text-white font-bold">
                      {tab === 'disputes' ? item.title : `Cancel: ${item.contact_info || 'Contract'}`}
                    </h3>
                  </div>
                  <Clock className="w-4 h-4 text-zinc-500" />
                </div>
                <p className="text-zinc-400 text-sm line-clamp-2">
                  {tab === 'disputes' ? item.dispute_reason : item.message}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-zinc-600 text-xs">{item.created_by}</span>
                  <span className="text-zinc-700 text-xs">•</span>
                  <span className="text-zinc-600 text-xs">{new Date(item.created_date).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {tab === 'disputes' ? <AlertTriangle className="w-5 h-5 text-yellow-400" /> : <Ban className="w-5 h-5 text-red-400" />}
              {tab === 'disputes' ? 'Resolve Dispute' : 'Review Cancel Request'}
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              {tab === 'disputes' ? (
                <>
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-zinc-400 text-xs mb-1">Contract</p>
                    <p className="text-white font-bold">{selectedItem.title}</p>
                    <p className="text-zinc-400 text-xs mt-2 mb-1">User</p>
                    <p className="text-white text-sm">{selectedItem.created_by}</p>
                    <p className="text-zinc-400 text-xs mt-2 mb-1">Dispute Reason</p>
                    <p className="text-yellow-300 text-sm">{selectedItem.dispute_reason}</p>
                    <p className="text-zinc-400 text-xs mt-2 mb-1">Monthly Payment</p>
                    <p className="text-white font-bold">${selectedItem.monthly_payment}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-xs mb-2">Admin Note</p>
                    <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add a resolution note..." className="bg-zinc-800 border-zinc-700 text-white min-h-20" />
                  </div>
                  {selectedItem.cancellation_irrevocable && selectedItem.intensity_level === 'extreme' && (
                    <div className="bg-red-950/60 border border-red-500 rounded-lg p-3">
                      <p className="text-red-300 text-xs font-bold">
                        ⚠️ FULL EXTREME MODE — Rejecting this dispute will trigger ALL penalties: late fee ({selectedItem.penalty_percentage}%) + 3-month cancellation penalty = <span className="text-white">${(((selectedItem.monthly_payment || 0) * ((selectedItem.penalty_percentage || 50) / 100)) + (selectedItem.monthly_payment || 0) * 3).toFixed(2)}</span> added to user's debt.
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button onClick={() => resolveDisputeMutation.mutate({ contractId: selectedItem.id, resolution: 'rejected', note: adminNote })}
                      disabled={resolveDisputeMutation.isPending}
                      variant="outline" className="flex-1 border-red-700 text-red-400 hover:bg-red-900/20">
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button onClick={() => resolveDisputeMutation.mutate({ contractId: selectedItem.id, resolution: 'resolved', note: adminNote })}
                      disabled={resolveDisputeMutation.isPending}
                      className="flex-1 bg-green-700 hover:bg-green-800">
                      <CheckCircle className="w-4 h-4 mr-2" /> Resolve
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-zinc-400 text-xs mb-1">Requested by</p>
                    <p className="text-white font-bold">{selectedItem.created_by}</p>
                    <p className="text-zinc-400 text-xs mt-2 mb-1">Contract</p>
                    <p className="text-white text-sm">{selectedItem.contact_info}</p>
                    <p className="text-zinc-400 text-xs mt-2 mb-1">Reason</p>
                    <p className="text-zinc-300 text-sm">{selectedItem.message}</p>
                    {selectedItem.admin_notes?.includes('irrevocable') && (
                      <div className="mt-3 bg-red-900/30 border border-red-600/50 rounded-lg p-3">
                        <p className="text-red-300 text-xs font-bold">⚠️ IRREVOCABLE CONTRACT — Approving will still trigger the 3-month penalty</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-zinc-400 text-xs mb-2">Admin Note</p>
                    <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add a note for the user..." className="bg-zinc-800 border-zinc-700 text-white min-h-20" />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        const meta = JSON.parse(selectedItem.contact_info?.split('|')?.[1] || '{}');
                        approveCancelMutation.mutate({ requestId: selectedItem.id, contractId: meta.contractId, irrevocable: meta.irrevocable, monthlyPayment: meta.monthlyPayment, approve: false });
                      }}
                      disabled={approveCancelMutation.isPending}
                      variant="outline" className="flex-1 border-zinc-700 text-zinc-400 hover:bg-zinc-800">
                      <XCircle className="w-4 h-4 mr-2" /> Deny
                    </Button>
                    <Button
                      onClick={() => {
                        const parts = selectedItem.contact_info?.split('|') || [];
                        const meta = parts[1] ? JSON.parse(parts[1]) : {};
                        approveCancelMutation.mutate({ requestId: selectedItem.id, contractId: meta.contractId, irrevocable: meta.irrevocable, monthlyPayment: meta.monthlyPayment, approve: true });
                      }}
                      disabled={approveCancelMutation.isPending}
                      className="flex-1 bg-red-700 hover:bg-red-800">
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
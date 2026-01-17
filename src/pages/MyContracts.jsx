import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  ArrowLeft, FileText, DollarSign, Calendar, AlertTriangle, 
  CheckCircle, XCircle, Clock, CreditCard, Ban, History, Loader, 
  AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const INTENSITY_CONFIG = {
  mild: { color: 'from-blue-500 to-blue-600', icon: '📋' },
  moderate: { color: 'from-yellow-500 to-orange-500', icon: '⚠️' },
  intense: { color: 'from-orange-600 to-red-600', icon: '🔥' },
  extreme: { color: 'from-red-700 to-red-900', icon: '💀' }
};

export default function MyContracts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedContract, setSelectedContract] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['myContracts'],
    queryFn: () => base44.entities.DebtContract.filter({ is_accepted: true }, '-created_date'),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['contractPayments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 100),
  });

  const cancelMutation = useMutation({
    mutationFn: async (contractId) => {
      const contract = contracts.find(c => c.id === contractId);
      
      // If has subscription, cancel it
      if (contract.stripe_subscription_id) {
        await base44.functions.invoke('cancelContractSubscription', {
          subscriptionId: contract.stripe_subscription_id
        });
      }
      
      // Mark contract as cancelled
      return base44.entities.DebtContract.update(contractId, {
        is_accepted: false,
        cancelled_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myContracts'] });
      toast.success('Contract cancelled successfully');
      setShowCancelDialog(false);
      setSelectedContract(null);
    },
    onError: (error) => {
      toast.error('Failed to cancel contract: ' + error.message);
    },
  });

  const disputeMutation = useMutation({
    mutationFn: async ({ contractId, reason }) => {
      // Send dispute notification
      await base44.functions.invoke('submitContractDispute', {
        contractId,
        reason,
      });
      
      // Mark contract as disputed
      return base44.entities.DebtContract.update(contractId, {
        dispute_status: 'pending',
        dispute_reason: reason,
        disputed_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myContracts'] });
      toast.success('Dispute submitted for review');
      setShowDisputeDialog(false);
      setSelectedContract(null);
      setDisputeReason('');
    },
    onError: (error) => {
      toast.error('Failed to submit dispute: ' + error.message);
    },
  });

  const getContractPayments = (contractId) => {
    return payments.filter(p => p.metadata?.contract_id === contractId);
  };

  const getNextPaymentDate = (contract) => {
    if (!contract.next_payment_due) return 'N/A';
    const date = new Date(contract.next_payment_due);
    const today = new Date();
    const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return 'Overdue';
    if (daysUntil === 0) return 'Due today';
    if (daysUntil === 1) return 'Due tomorrow';
    return `${daysUntil} days`;
  };

  const getPaymentStatus = (contract) => {
    const nextDate = contract.next_payment_due ? new Date(contract.next_payment_due) : null;
    const today = new Date();
    
    if (!nextDate) return { status: 'completed', color: 'text-green-400', icon: CheckCircle, label: 'Paid' };
    if (nextDate < today) return { status: 'overdue', color: 'text-red-400', icon: AlertTriangle, label: 'Overdue' };
    if ((nextDate - today) / (1000 * 60 * 60 * 24) <= 7) return { status: 'due_soon', color: 'text-yellow-400', icon: Clock, label: 'Due Soon' };
    return { status: 'active', color: 'text-green-400', icon: CheckCircle, label: 'Active' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading contracts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
         <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-transparent" />
         <div className="relative px-6 py-4 flex items-center justify-between">
           <button
             onClick={() => navigate(createPageUrl('Home'))}
             className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
           >
             <ArrowLeft className="w-5 h-5" />
             Back
           </button>
           <h1 className="text-lg font-bold flex items-center gap-2">
             <FileText className="w-5 h-5 text-purple-500" />
             My Contracts
           </h1>
           <button
             onClick={() => navigate(createPageUrl('ContractHistory'))}
             className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
           >
             <History className="w-5 h-5" />
             History
           </button>
         </div>
       </div>

      <div className="px-6 pb-24 space-y-6 pt-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
          >
            <FileText className="w-8 h-8 text-purple-400 mb-2" />
            <p className="text-2xl font-bold text-white">{contracts.length}</p>
            <p className="text-zinc-500 text-xs">Active Contracts</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
          >
            <DollarSign className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-2xl font-bold text-white">
              ${contracts.reduce((sum, c) => sum + (c.amount_paid || 0), 0).toFixed(0)}
            </p>
            <p className="text-zinc-500 text-xs">Total Paid</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
          >
            <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
            <p className="text-2xl font-bold text-white">
              {contracts.filter(c => {
                const nextDate = c.next_payment_due ? new Date(c.next_payment_due) : null;
                return nextDate && nextDate < new Date();
              }).length}
            </p>
            <p className="text-zinc-500 text-xs">Overdue</p>
          </motion.div>
        </div>

        {/* Contracts List */}
        {contracts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center"
          >
            <FileText className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No Active Contracts</p>
            <p className="text-zinc-600 text-sm mb-6">You haven't accepted any contracts yet</p>
            <Button
              onClick={() => navigate(createPageUrl('GeneratedFindomContracts'))}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Browse Contracts
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract, idx) => {
              const config = INTENSITY_CONFIG[contract.intensity_level];
              const statusInfo = getPaymentStatus(contract);
              const StatusIcon = statusInfo.icon;
              const contractPayments = getContractPayments(contract.id);

              return (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{config.icon}</span>
                        <h3 className="text-white font-bold text-lg">{contract.title}</h3>
                      </div>
                      <p className="text-zinc-400 text-sm">{contract.description}</p>
                    </div>
                    <StatusIcon className={`w-6 h-6 ${statusInfo.color} flex-shrink-0`} />
                  </div>

                  {/* Contract Details Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-zinc-500 text-xs mb-1">Monthly Payment</p>
                      <p className="text-white font-bold">
                        {contract.monthly_payment > 0 
                          ? `$${contract.monthly_payment}` 
                          : '85% of income'}
                      </p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-zinc-500 text-xs mb-1">Duration</p>
                      <p className="text-white font-bold">
                        {contract.duration_months ? `${contract.duration_months}m` : '∞ Forever'}
                      </p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-zinc-500 text-xs mb-1">Next Payment</p>
                      <p className={`font-bold ${statusInfo.color}`}>
                        {getNextPaymentDate(contract)}
                      </p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-zinc-500 text-xs mb-1">Amount Paid</p>
                      <p className="text-green-400 font-bold">
                        ${(contract.amount_paid || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Payment History */}
                  {contractPayments.length > 0 && (
                    <div className="mb-4">
                      <p className="text-zinc-500 text-xs font-medium mb-2">Recent Payments</p>
                      <div className="space-y-2">
                        {contractPayments.slice(0, 3).map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400">
                              {new Date(payment.created_date).toLocaleDateString()}
                            </span>
                            <span className={`font-bold ${
                              payment.status === 'succeeded' ? 'text-green-400' : 
                              payment.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                              ${payment.amount.toFixed(2)} - {payment.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subscription & Payment Status Info */}
                  <div className="space-y-2 mb-4">
                    {contract.stripe_subscription_id && (
                      <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-400" />
                        <p className="text-blue-300 text-xs">
                          Recurring subscription active - automatic monthly billing
                        </p>
                      </div>
                    )}
                    {!contract.stripe_subscription_id && contract.is_accepted && (
                      <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        <p className="text-yellow-300 text-xs">
                          No subscription set up. Click "Setup Payment" to enable automatic billing.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Dispute Status */}
                  {contract.dispute_status === 'pending' && (
                    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <p className="text-yellow-300 text-xs">
                        Dispute pending review
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!contract.stripe_subscription_id && contract.is_accepted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedContract(contract);
                          // Trigger payment setup
                          base44.functions.invoke('createContractSubscription', {
                            contractId: contract.id
                          }).then(() => {
                            toast.success('Payment subscription created');
                            queryClient.invalidateQueries({ queryKey: ['myContracts'] });
                          }).catch((err) => {
                            toast.error('Failed to setup payment: ' + err.message);
                          });
                        }}
                        className="flex-1 border-green-600/50 text-green-400 hover:bg-green-900/20"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Setup Payment
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedContract(contract);
                        setShowDisputeDialog(true);
                      }}
                      className="flex-1 border-zinc-700 text-yellow-400 hover:bg-yellow-900/20"
                      disabled={contract.dispute_status === 'pending'}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Dispute
                    </Button>
                    {contract.stripe_subscription_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedContract(contract);
                          setShowCancelDialog(true);
                        }}
                        className="flex-1 border-zinc-700 text-red-400 hover:bg-red-900/20"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogTitle className="text-white flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Cancel Contract
          </AlertDialogTitle>
          {selectedContract && (
            <AlertDialogDescription className="space-y-4 text-zinc-300">
              <p>Are you sure you want to cancel "{selectedContract.title}"?</p>
              <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-3">
                <p className="text-red-400 text-xs">
                  ⚠️ This will cancel your recurring subscription and end this contract. 
                  You may still be liable for penalties according to the terms.
                </p>
              </div>
            </AlertDialogDescription>
          )}
          <div className="flex gap-3">
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
              Keep Contract
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedContract && cancelMutation.mutate(selectedContract.id)}
              disabled={cancelMutation.isPending}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dispute Dialog */}
      <AlertDialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Dispute Contract
          </AlertDialogTitle>
          {selectedContract && (
            <AlertDialogDescription className="space-y-4 text-zinc-300">
              <p>Disputing "{selectedContract.title}"</p>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain why you're disputing this contract..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                <p className="text-yellow-400 text-xs">
                  Your dispute will be reviewed. The contract remains active during review.
                </p>
              </div>
            </AlertDialogDescription>
          )}
          <div className="flex gap-3">
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedContract && disputeMutation.mutate({
                contractId: selectedContract.id,
                reason: disputeReason
              })}
              disabled={disputeMutation.isPending || !disputeReason.trim()}
              className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white"
            >
              {disputeMutation.isPending ? 'Submitting...' : 'Submit Dispute'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
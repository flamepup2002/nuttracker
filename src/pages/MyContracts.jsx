import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  ArrowLeft, FileText, DollarSign, Calendar, AlertTriangle, 
  CheckCircle, XCircle, Clock, CreditCard, Ban, History, Loader, 
  AlertCircle, Shield
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
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

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

      // If contract is irrevocable, apply penalty instead of cancelling
      if (contract.cancellation_irrevocable) {
        const penaltyAmount = contract.monthly_payment * 3; // 3-month penalty
        await base44.entities.DebtContract.update(contractId, {
          cancellation_penalty_triggered: true,
          cancellation_penalty_amount: (contract.cancellation_penalty_amount || 0) + penaltyAmount,
          total_obligation: (contract.total_obligation || 0) + penaltyAmount,
        });
        throw new Error(`IRREVOCABLE|${penaltyAmount}`);
      }
      
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
      queryClient.invalidateQueries({ queryKey: ['myContracts'] });
      if (error.message.startsWith('IRREVOCABLE|')) {
        const penalty = error.message.split('|')[1];
        setShowCancelDialog(false);
        toast.error(`🔒 Cancellation DENIED. You waived your right to cancel. A penalty of $${penalty} has been added to your debt.`, { duration: 6000 });
      } else {
        toast.error('Failed to cancel contract: ' + error.message);
      }
    },
  });

  const disputeMutation = useMutation({
    mutationFn: async ({ contractId, reason }) => {
      const contract = contracts.find(c => c.id === contractId);
      // Save dispute to UserFeedback so admin can see it
      await base44.entities.UserFeedback.create({
        feedback_type: 'other',
        category: 'account',
        rating: 1,
        message: reason,
        page_reported: 'contract_dispute',
        contact_info: `${contract?.title || contractId}|${JSON.stringify({ contractId })}`,
        status: 'new',
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
      toast.success('Dispute submitted to admin for review');
      setShowDisputeDialog(false);
      setSelectedContract(null);
      setDisputeReason('');
    },
    onError: (error) => {
      toast.error('Failed to submit dispute: ' + error.message);
    },
  });

  // User submits a cancel REQUEST (for non-admin users with irrevocable or any contract)
  const requestCancelMutation = useMutation({
    mutationFn: async (contract) => {
      return base44.entities.UserFeedback.create({
        feedback_type: 'other',
        category: 'account',
        rating: 1,
        message: `User requests admin to cancel contract: "${contract.title}". Irrevocable: ${contract.cancellation_irrevocable ? 'YES' : 'No'}.`,
        page_reported: 'cancel_request',
        contact_info: `${contract.title}|${JSON.stringify({ contractId: contract.id, irrevocable: contract.cancellation_irrevocable, monthlyPayment: contract.monthly_payment })}`,
        status: 'new',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myContracts'] });
      toast.success('Cancel request submitted to admin for review');
      setShowCancelDialog(false);
      setSelectedContract(null);
    },
    onError: (error) => toast.error('Failed to submit request: ' + error.message),
  });

  const adminCancelMutation = useMutation({
    mutationFn: async (contractId) => {
      const contract = contracts.find(c => c.id === contractId);
      // Apply irrevocable penalty even for admin cancel
      const updates = {
        is_accepted: false,
        cancelled_at: new Date().toISOString(),
        cancelled_by_admin: true,
        cancel_status: 'cancelled',
      };
      if (contract.cancellation_irrevocable) {
        const penalty = contract.monthly_payment * 3;
        updates.cancellation_penalty_triggered = true;
        updates.cancellation_penalty_amount = (contract.cancellation_penalty_amount || 0) + penalty;
        updates.total_obligation = (contract.total_obligation || 0) + penalty;
      }
      return base44.entities.DebtContract.update(contractId, updates);
    },
    onSuccess: (_, contractId) => {
      queryClient.invalidateQueries({ queryKey: ['myContracts'] });
      const contract = contracts.find(c => c.id === contractId);
      if (contract?.cancellation_irrevocable) {
        toast.warning(`Contract cancelled. Irrevocable penalty of $${(contract.monthly_payment * 3).toFixed(0)} has been applied.`);
      } else {
        toast.success('Contract marked as cancelled');
      }
      setShowCancelDialog(false);
      setSelectedContract(null);
    },
    onError: (error) => {
      toast.error('Failed to cancel contract: ' + error.message);
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
        {/* Penalties Button */}
        {(() => {
          const totalPenalties = contracts.reduce((sum, c) => sum + (c.cancellation_penalty_amount || 0), 0);
          const overdueCount = contracts.filter(c => c.next_payment_due && new Date(c.next_payment_due) < new Date() && c.penalty_percentage).length;
          const hasPenalties = totalPenalties > 0 || overdueCount > 0;
          return (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(createPageUrl('Penalties'))}
              className={`w-full flex items-center justify-between rounded-2xl p-4 border transition-colors ${
                hasPenalties
                  ? 'bg-red-950/40 border-red-500/60 hover:border-red-400'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Ban className={`w-5 h-5 ${hasPenalties ? 'text-red-400' : 'text-zinc-600'}`} />
                <div className="text-left">
                  <p className={`font-bold text-sm ${hasPenalties ? 'text-red-300' : 'text-zinc-400'}`}>Penalties</p>
                  <p className="text-zinc-500 text-xs">{hasPenalties ? `$${totalPenalties.toFixed(2)} owed${overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}` : 'No outstanding penalties'}</p>
                </div>
              </div>
              <ArrowLeft className={`w-4 h-4 rotate-180 ${hasPenalties ? 'text-red-400' : 'text-zinc-600'}`} />
            </motion.button>
          );
        })()}

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

                  {/* Irrevocable Banner */}
                  {contract.cancellation_irrevocable && (
                    <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center gap-2">
                      <Ban className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <p className="text-red-300 text-xs font-bold">
                        IRREVOCABLE — You have waived your right to cancel. Attempting to cancel will trigger a 3-month penalty charge.
                        {contract.cancellation_penalty_amount > 0 && ` ($${contract.cancellation_penalty_amount} in penalties already accumulated)`}
                      </p>
                    </div>
                  )}

                  {/* Overdue Penalty Notice */}
                  {(() => {
                    const isOverdue = contract.next_payment_due && new Date(contract.next_payment_due) < new Date();
                    if (!isOverdue || !contract.penalty_percentage) return null;
                    const penaltyAmt = ((contract.monthly_payment || 0) * (contract.penalty_percentage / 100));
                    return (
                      <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-3 mb-4 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-300 text-xs font-bold">
                          OVERDUE — A penalty of ${penaltyAmt.toFixed(2)} ({contract.penalty_percentage}%) has been added to your balance. Pay immediately to stop accruing further charges.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
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
                    {user?.role === 'admin' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedContract(contract);
                          setShowCancelDialog(true);
                        }}
                        className="flex-1 border-purple-700 text-purple-400 hover:bg-purple-900/20"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => requestCancelMutation.mutate(contract)}
                        disabled={requestCancelMutation.isPending}
                        className="flex-1 border-zinc-700 text-red-400 hover:bg-red-900/20"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Request Cancel
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" /> Admin Cancel Contract
          </AlertDialogTitle>
          {selectedContract && (
            <AlertDialogDescription className="space-y-4 text-zinc-300">
              <p>Cancelling "{selectedContract.title}" — this will be marked as <span className="text-red-400 font-bold">CANCELLED</span>.</p>
              {selectedContract.cancellation_irrevocable ? (
                <div className="bg-red-900/50 border-2 border-red-500 rounded-lg p-3">
                  <p className="text-red-300 text-xs font-bold">
                    ⚠️ IRREVOCABLE CONTRACT — Even admin cancellation triggers a {3}-month penalty of ${(selectedContract.monthly_payment * 3).toFixed(0)} on the user's balance.
                  </p>
                </div>
              ) : (
                <div className="bg-purple-900/30 border border-purple-600/50 rounded-lg p-3">
                  <p className="text-purple-400 text-xs">
                    🛡️ Contract will be permanently marked as cancelled. No further billing.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          )}
          <div className="flex gap-3">
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">Keep Contract</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedContract && adminCancelMutation.mutate(selectedContract.id)}
              disabled={adminCancelMutation.isPending}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            >
              {adminCancelMutation.isPending ? 'Cancelling...' : 'Mark as Cancelled'}
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
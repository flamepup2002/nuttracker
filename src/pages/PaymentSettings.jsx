import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import StripePaymentSetup from '@/components/StripePaymentSetup';
import PaymentMethodCard from '@/components/PaymentMethodCard';

export default function PaymentSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddPayment, setShowAddPayment] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: paymentMethod } = useQuery({
    queryKey: ['paymentMethod'],
    queryFn: async () => {
      if (!user?.stripe_payment_method_id) return null;
      const response = await base44.functions.invoke('getStripePaymentMethod', {
        paymentMethodId: user.stripe_payment_method_id
      });
      return response.data;
    },
    enabled: !!user?.stripe_payment_method_id,
  });

  const { data: failedPayments = [] } = useQuery({
    queryKey: ['failedPayments'],
    queryFn: () => base44.entities.FailedPayment.filter({ status: 'pending_retry' }),
  });

  const removePaymentMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('removeStripePaymentMethod', {
        paymentMethodId: user.stripe_payment_method_id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['paymentMethod'] });
      toast.success('Payment method removed');
    },
    onError: (error) => {
      toast.error('Failed to remove payment method: ' + error.message);
    },
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            Payment Settings
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="px-6 pb-24 space-y-6 pt-6">
        {/* Failed Payments Warning */}
        {failedPayments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/30 border-2 border-red-500/50 rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-300 font-bold">Payment Issues Detected</p>
                <p className="text-red-400/80 text-sm mt-1">
                  You have {failedPayments.length} failed payment{failedPayments.length > 1 ? 's' : ''} that will be retried automatically.
                  Please ensure your payment method is valid.
                </p>
                <div className="mt-3 space-y-2">
                  {failedPayments.map((failed) => (
                    <div key={failed.id} className="bg-red-950/50 rounded-lg p-2 text-xs">
                      <p className="text-red-300">Amount: ${failed.amount}</p>
                      <p className="text-red-400/70">Retry #{failed.retry_count + 1} on {new Date(failed.next_retry_date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Current Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
        >
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </h2>

          {paymentMethod ? (
            <div className="space-y-4">
              <PaymentMethodCard paymentMethod={paymentMethod} />
              
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Payment method verified and active</span>
              </div>

              <Button
                variant="outline"
                onClick={() => removePaymentMutation.mutate()}
                disabled={removePaymentMutation.isPending}
                className="w-full border-red-800 text-red-400 hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {removePaymentMutation.isPending ? 'Removing...' : 'Remove Payment Method'}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 mb-4">No payment method on file</p>
              <Button
                onClick={() => setShowAddPayment(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700"
              >
                Add Payment Method
              </Button>
            </div>
          )}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
        >
          <h3 className="text-white font-bold mb-3">About Payments</h3>
          <ul className="space-y-2 text-zinc-400 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Recurring contracts are charged automatically each month</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Failed payments will be retried automatically up to 3 times</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Late penalties apply to overdue payments as specified in your contract</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Update your payment method anytime to avoid failed payments</span>
            </li>
          </ul>
        </motion.div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddPayment && (
        <StripePaymentSetup
          onSuccess={() => {
            setShowAddPayment(false);
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['paymentMethod'] });
          }}
          onCancel={() => setShowAddPayment(false)}
        />
      )}
    </div>
  );
}
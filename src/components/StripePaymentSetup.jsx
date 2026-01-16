import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Lock, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Initialize Stripe
const stripePromise = loadStripe('pk_live_51SpvVjC59PRvTlS1FnlD7NrMuLmbLpb9NEZDDpRm18zGQLo25i8DstYYfDVO0N8erd9j1gE6xEsb0kMCiTVGk73G00H04ddFDh');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '16px',
      '::placeholder': {
        color: '#71717a',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

function PaymentForm({ onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Get setup intent from backend
      const response = await base44.functions.invoke('getStripeSetupIntent');
      const data = response.data;

      if (!data.clientSecret) {
        throw new Error('Failed to initialize payment setup');
      }

      // Confirm card setup
      const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Save payment method to user
      await base44.functions.invoke('setupStripeCustomer', {
        paymentMethodId: setupIntent.payment_method
      });

      toast.success('Payment method added successfully!');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
      toast.error('Failed to add payment method', {
        description: err.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <Lock className="w-4 h-4" />
        <span>Secured by Stripe. Your card details are encrypted and never stored on our servers.</span>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Add Payment Method
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default function StripePaymentSetup({ onSuccess, onCancel }) {
  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-bold">Add Payment Method</h3>
          <p className="text-zinc-500 text-sm">For automatic findom charges</p>
        </div>
      </div>

      <Elements stripe={stripePromise}>
        <PaymentForm onSuccess={onSuccess} onCancel={onCancel} />
      </Elements>
    </div>
  );
}
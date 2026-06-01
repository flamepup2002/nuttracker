import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CARD_BRANDS = {
  '4': 'Visa',
  '5': 'Mastercard',
  '3': 'Amex',
  '6': 'Discover',
};

function detectBrand(number) {
  return CARD_BRANDS[number.charAt(0)] || 'Card';
}

function formatCardNumber(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

function PaymentForm({ onSuccess, onCancel }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const digits = cardNumber.replace(/\s/g, '');
    if (digits.length < 13) { setError('Please enter a valid card number.'); return; }

    const [expM, expY] = expiry.split('/');
    if (!expM || !expY || expM > 12 || expM < 1) { setError('Please enter a valid expiry date.'); return; }
    if (cvc.length < 3) { setError('Please enter a valid CVC.'); return; }
    if (!name.trim()) { setError('Please enter the cardholder name.'); return; }

    setIsProcessing(true);

    // Simulate brief processing delay
    await new Promise(r => setTimeout(r, 800));

    const brand = detectBrand(digits);
    const last4 = digits.slice(-4);

    await base44.auth.updateMe({
      payment_method_brand: brand,
      payment_method_last4: last4,
      payment_method_exp_month: parseInt(expM),
      payment_method_exp_year: parseInt('20' + expY.slice(-2)),
      payment_method_name: name.trim(),
    });

    setIsProcessing(false);
    toast.success('Payment method added successfully!');
    if (onSuccess) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-zinc-400 text-sm">Cardholder Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          className="bg-zinc-800 border-zinc-700 text-white mt-1"
        />
      </div>

      <div>
        <Label className="text-zinc-400 text-sm">Card Number</Label>
        <Input
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          placeholder="4242 4242 4242 4242"
          inputMode="numeric"
          className="bg-zinc-800 border-zinc-700 text-white mt-1 font-mono"
          maxLength={19}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-zinc-400 text-sm">Expiry</Label>
          <Input
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/YY"
            inputMode="numeric"
            className="bg-zinc-800 border-zinc-700 text-white mt-1 font-mono"
            maxLength={5}
          />
        </div>
        <div>
          <Label className="text-zinc-400 text-sm">CVC</Label>
          <Input
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            inputMode="numeric"
            className="bg-zinc-800 border-zinc-700 text-white mt-1 font-mono"
            maxLength={4}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <Lock className="w-4 h-4" />
        <span>Card details are stored securely and never shared.</span>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}
            className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isProcessing}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
          {isProcessing ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
          ) : (
            <><CreditCard className="w-4 h-4 mr-2" />Add Payment Method</>
          )}
        </Button>
      </div>
    </form>
  );
}

export default function StripePaymentSetup({ onSuccess, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-zinc-800 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold">Add Payment Method</h3>
            <p className="text-zinc-500 text-sm">For automatic findom charges</p>
          </div>
        </div>

        <PaymentForm onSuccess={onSuccess} onCancel={onCancel} />
      </motion.div>
    </motion.div>
  );
}
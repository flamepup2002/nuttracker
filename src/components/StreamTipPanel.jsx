import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Coins, Heart, Zap, Gift, Crown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const QUICK_TIP_AMOUNTS = [
  { amount: 10, label: '10', icon: Heart, color: 'from-pink-500 to-pink-600' },
  { amount: 25, label: '25', icon: Zap, color: 'from-yellow-500 to-orange-500' },
  { amount: 50, label: '50', icon: Gift, color: 'from-purple-500 to-purple-600' },
  { amount: 100, label: '100', icon: Crown, color: 'from-yellow-600 to-amber-600' },
];

export default function StreamTipPanel({ broadcasterId, broadcasterName }) {
  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const queryClient = useQueryClient();

  const tipMutation = useMutation({
    mutationFn: async ({ amount, message }) => {
      const response = await base44.functions.invoke('sendStreamTip', {
        broadcasterId,
        amount,
        message
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success(`Sent ${data.amount} coins to ${broadcasterName}!`, {
        description: 'Your tip has been delivered'
      });
      setCustomAmount('');
      setShowCustom(false);
    },
    onError: (error) => {
      toast.error('Failed to send tip', {
        description: error.message || 'Please try again'
      });
    }
  });

  const handleQuickTip = (amount) => {
    if (confirm(`Send ${amount} coins to ${broadcasterName}?`)) {
      tipMutation.mutate({ amount, message: '' });
    }
  };

  const handleCustomTip = () => {
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount < 1) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (confirm(`Send ${amount} coins to ${broadcasterName}?`)) {
      tipMutation.mutate({ amount, message: '' });
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Coins className="w-4 h-4 text-yellow-400" />
        <h3 className="text-white font-bold text-sm">Send Tip</h3>
      </div>

      {/* Quick Tip Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_TIP_AMOUNTS.map(({ amount, label, icon: Icon, color }) => (
          <motion.button
            key={amount}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleQuickTip(amount)}
            disabled={tipMutation.isPending}
            className={`relative overflow-hidden rounded-lg p-3 bg-gradient-to-br ${color} text-white font-bold text-center`}
          >
            <Icon className="w-4 h-4 mx-auto mb-1" />
            <div className="text-xs">{label}</div>
          </motion.button>
        ))}
      </div>

      {/* Custom Amount */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCustom(!showCustom)}
          className="w-full border-zinc-700 text-zinc-300"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Custom Amount
        </Button>

        <AnimatePresence>
          {showCustom && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2"
            >
              <Input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount..."
                min="1"
                className="bg-zinc-900 border-zinc-800 text-white"
              />
              <Button
                onClick={handleCustomTip}
                disabled={tipMutation.isPending || !customAmount}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {tipMutation.isPending ? 'Sending...' : 'Send Tip'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-xs text-zinc-500 text-center pt-2 border-t border-zinc-800">
        Tips support your favorite broadcasters
      </div>
    </div>
  );
}
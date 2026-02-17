import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Coins, Sparkles, Check, CreditCard, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import StripePaymentSetup from '@/components/StripePaymentSetup';
import PaymentMethodCard from '@/components/PaymentMethodCard';

const coinPackages = [
  { coins: 100, price: 1, popular: false },
  { coins: 500, price: 5, popular: false },
  { coins: 1000, price: 10, popular: true },
  { coins: 2500, price: 25, popular: false },
  { coins: 5000, price: 50, popular: false },
  { coins: 10000, price: 100, popular: false },
];

export default function BuyCoins() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showPaymentSetup, setShowPaymentSetup] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: paymentMethodData, refetch: refetchPaymentMethod } = useQuery({
    queryKey: ['paymentMethod'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getStripePaymentMethod');
      return response.data;
    },
    initialData: { hasPaymentMethod: false },
  });

  const purchaseMutation = useMutation({
    mutationFn: async (pkg) => {
      const response = await base44.functions.invoke('purchaseCoins', {
        coinAmount: pkg.coins
      });
      return { ...response.data, coins: pkg.coins };
    },
    onMutate: async (pkg) => {
      // Optimistically update the balance
      const currentUser = user;
      setUser(prev => ({
        ...prev,
        currency_balance: (prev?.currency_balance || 0) + pkg.coins
      }));
      
      toast.loading(`Processing ${pkg.coins} coins purchase...`, { id: 'purchase' });
      
      return { currentUser };
    },
    onError: (error, pkg, context) => {
      // Rollback on error
      setUser(context.currentUser);
      toast.error(error.response?.data?.error || 'Purchase failed', { id: 'purchase' });
    },
    onSuccess: (data) => {
      toast.success(`Successfully purchased ${data.coins} coins!`, { id: 'purchase' });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const handlePurchase = (pkg) => {
    if (!user?.stripe_payment_method_id) {
      toast.error('Please add a payment method in Settings first');
      return;
    }
    purchaseMutation.mutate(pkg);
  };



  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            Buy KinkCoins
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Current Balance */}
      <div className="px-6 pt-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-500/30 rounded-2xl p-6 text-center"
        >
          <p className="text-zinc-400 text-sm mb-2">Current Balance</p>
          <div className="flex items-center justify-center gap-3">
            <Coins className="w-8 h-8 text-yellow-400" />
            <span className="text-4xl font-bold text-yellow-400">
              {user?.currency_balance || 0}
            </span>
            <span className="text-yellow-500 text-lg">coins</span>
          </div>
        </motion.div>

        {/* Payment Method Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <h2 className="text-white font-bold">Payment Method</h2>
          </div>

          <AnimatePresence mode="wait">
            {!showPaymentSetup ? (
              paymentMethodData?.hasPaymentMethod ? (
                <motion.div
                  key="has-payment"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <PaymentMethodCard 
                    paymentMethod={paymentMethodData.paymentMethod}
                    showRemove={false}
                  />
                  <Button
                    onClick={() => setShowPaymentSetup(true)}
                    variant="outline"
                    className="w-full mt-4 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Update Payment Method
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="no-payment"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-zinc-400 text-sm mb-4">Add a payment method to buy coins</p>
                  <Button
                    onClick={() => setShowPaymentSetup(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment Method
                  </Button>
                </motion.div>
              )
            ) : (
              <motion.div
                key="setup-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <StripePaymentSetup
                  onSuccess={() => {
                    setShowPaymentSetup(false);
                    refetchPaymentMethod();
                  }}
                  onCancel={() => setShowPaymentSetup(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>



      {/* Coin Packages */}
      <div className="px-6 py-6 space-y-4">
       <h2 className="text-zinc-400 text-sm font-medium mb-4">Select a package</h2>
        {coinPackages.map((pkg, idx) => (
          <motion.div
            key={pkg.coins}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative"
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Popular
                </div>
              </div>
            )}
            <button
              onClick={() => handlePurchase(pkg)}
              disabled={purchaseMutation.isPending}
              className={`w-full rounded-2xl p-5 flex items-center justify-between transition-all disabled:opacity-50 ${
                pkg.popular ? 'bg-gradient-to-r from-pink-600/30 to-purple-600/30 border border-pink-500/50 hover:from-pink-600/40 hover:to-purple-600/40' : 'bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-bold text-lg">{pkg.coins.toLocaleString()} Coins</p>
                  <p className="text-zinc-500 text-sm">${pkg.price.toFixed(2)}</p>
                </div>
              </div>
              {purchaseMutation.isPending ? (
                <div className="animate-spin w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full" />
              ) : (
                <div className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 px-4 py-2 rounded-lg font-bold text-white text-sm">
                  Buy ${pkg.price}
                </div>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Info */}
      <div className="px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5"
        >
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-400" />
            What you can do with KinkCoins
          </h3>
          <ul className="space-y-2 text-zinc-400 text-sm">
            <li>• Use in place of real money for Findom sessions</li>
            <li>• Unlock premium features (coming soon)</li>
            <li>• Reward yourself for achievements</li>
            <li>• No expiration - coins never expire</li>
          </ul>
          <p className="text-zinc-500 text-xs mt-4">
            Rate: $1 = 100 coins
          </p>
        </motion.div>
      </div>
    </div>
  );
}
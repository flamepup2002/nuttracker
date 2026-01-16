import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Coins, Sparkles, Check, ArrowRightLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

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
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showConversion, setShowConversion] = useState(false);
  const [conversionAmount, setConversionAmount] = useState('');
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handlePurchase = async (pkg) => {
    if (!user?.stripe_payment_method_id) {
      toast.error('Please add a payment method in Settings first');
      return;
    }

    setSelectedPackage(pkg);
    setPurchasing(true);

    try {
      const response = await base44.functions.invoke('purchaseCoins', {
        coinAmount: pkg.coins
      });

      if (response.data.success) {
        toast.success(`Successfully purchased ${pkg.coins} coins!`);
        setUser(prev => ({ ...prev, currency_balance: response.data.newBalance }));
        queryClient.invalidateQueries({ queryKey: ['user'] });
      } else {
        toast.error('Purchase failed. Please try again.');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Purchase failed');
    } finally {
      setPurchasing(false);
      setSelectedPackage(null);
    }
  };

  const handleConversion = async () => {
    const amount = parseInt(conversionAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid coin amount');
      return;
    }

    if (amount > (user?.currency_balance || 0)) {
      toast.error('Insufficient coins');
      return;
    }

    if (!user?.bank_account_holder) {
      toast.error('Link a bank account in Settings first');
      navigate(createPageUrl('Settings'));
      return;
    }

    setConverting(true);
    try {
      const response = await base44.functions.invoke('convertCoinsToMoneyWithETransfer', {
        coins: amount
      });

      if (response.data.success) {
        toast.success(`$${response.data.amount.toFixed(2)} e-transfer initiated to your bank!`);
        setUser(prev => ({ ...prev, currency_balance: response.data.new_balance }));
        setConversionAmount('');
        setShowConversion(false);
        queryClient.invalidateQueries({ queryKey: ['user'] });
      } else {
        toast.error(response.data.error || 'Conversion failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Conversion failed');
    } finally {
      setConverting(false);
    }
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
      <div className="px-6 pt-6">
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
      </div>

      {/* Conversion Section */}
      {!showConversion ? (
       <div className="px-6 py-4">
         <motion.button
          onClick={() => setShowConversion(true)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 hover:from-green-600/30 hover:to-emerald-600/30 rounded-2xl p-4 flex items-center justify-between transition-all"
         >
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="w-5 h-5 text-green-400" />
            <div className="text-left">
              <p className="text-white font-semibold">Convert to Cash</p>
              <p className="text-zinc-400 text-xs">100 coins = $1 via e-transfer</p>
            </div>
          </div>
          <div className="text-green-400 font-bold">
            ${((user?.currency_balance || 0) / 100).toFixed(2)}
          </div>
         </motion.button>
       </div>
      ) : (
       <div className="px-6 py-4">
         <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-green-900/20 border border-green-500/30 rounded-2xl p-5 space-y-4"
         >
           <div className="flex items-center justify-between">
             <h3 className="text-white font-semibold flex items-center gap-2">
               <ArrowRightLeft className="w-5 h-5 text-green-400" />
               Convert Coins to Cash
             </h3>
             <button
               onClick={() => {
                 setShowConversion(false);
                 setConversionAmount('');
               }}
               className="text-zinc-400 hover:text-white"
             >
               ✕
             </button>
           </div>

           <div>
             <label className="text-zinc-300 text-sm block mb-2">
               Amount to Convert
             </label>
             <div className="flex gap-2">
               <input
                 type="number"
                 value={conversionAmount}
                 onChange={(e) => setConversionAmount(e.target.value)}
                 placeholder="0"
                 max={user?.currency_balance || 0}
                 className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
               />
               <button
                 onClick={() => setConversionAmount(user?.currency_balance || '')}
                 className="text-blue-400 hover:text-blue-300 text-sm font-medium px-3"
               >
                 Max
               </button>
             </div>
           </div>

           <div className="bg-zinc-800/50 rounded-lg p-3">
             <p className="text-zinc-400 text-xs mb-1">You will receive:</p>
             <p className="text-white font-bold text-lg">
               ${(parseInt(conversionAmount || 0) / 100).toFixed(2)}
             </p>
           </div>

           <Button
             onClick={handleConversion}
             disabled={converting || !conversionAmount}
             className="w-full bg-green-600 hover:bg-green-700"
           >
             {converting ? 'Processing...' : 'Convert to Cash'}
           </Button>
         </motion.div>
       </div>
      )}

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
              disabled={purchasing}
              className={`w-full bg-zinc-900/50 border rounded-2xl p-5 flex items-center justify-between transition-all hover:bg-zinc-800/50 disabled:opacity-50 ${
                pkg.popular ? 'border-pink-500/30' : 'border-zinc-800'
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
              {purchasing && selectedPackage?.coins === pkg.coins ? (
                <div className="animate-spin w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full" />
              ) : (
                <div className="text-pink-400 font-bold text-lg">
                  ${pkg.price}
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
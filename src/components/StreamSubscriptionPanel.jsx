import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const SUBSCRIPTION_TIERS = [
  // Monthly
  {
    id: 'basic_monthly',
    name: 'Basic',
    price: 4.99,
    coins: 0,
    billing: 'monthly',
    features: ['Access to basic streams', 'Chat participation', 'Standard quality'],
    color: 'from-blue-600 to-blue-700'
  },
  {
    id: 'premium_monthly',
    name: 'Premium',
    price: 9.99,
    coins: 500,
    billing: 'monthly',
    features: ['All Basic features', 'HD quality streams', '500 bonus coins/month', 'Exclusive emotes', 'Priority chat'],
    color: 'from-purple-600 to-purple-700',
    badge: '🔥 Popular'
  },
  {
    id: 'vip_monthly',
    name: 'VIP',
    price: 19.99,
    coins: 1500,
    billing: 'monthly',
    features: ['All Premium features', '1500 bonus coins/month', 'VIP badge', 'Private streams access', 'Ad-free experience', 'Early access'],
    color: 'from-yellow-600 to-amber-600',
    badge: '👑 Best Value'
  },
  // Yearly (20% discount)
  {
    id: 'basic_yearly',
    name: 'Basic',
    price: 47.88,
    coins: 0,
    billing: 'yearly',
    originalPrice: 59.88,
    features: ['Access to basic streams', 'Chat participation', 'Standard quality'],
    color: 'from-blue-600 to-blue-700'
  },
  {
    id: 'premium_yearly',
    name: 'Premium',
    price: 95.88,
    coins: 7500,
    billing: 'yearly',
    originalPrice: 119.88,
    features: ['All Basic features', 'HD quality streams', '7500 bonus coins/year', 'Exclusive emotes', 'Priority chat'],
    color: 'from-purple-600 to-purple-700',
    badge: '💰 Save 20%'
  },
  {
    id: 'vip_yearly',
    name: 'VIP',
    price: 191.88,
    coins: 22500,
    billing: 'yearly',
    originalPrice: 239.88,
    features: ['All Premium features', '22500 bonus coins/year', 'VIP badge', 'Private streams access', 'Ad-free experience', 'Early access'],
    color: 'from-yellow-600 to-amber-600',
    badge: '👑 Best Savings'
  }
];

export default function StreamSubscriptionPanel() {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const subscribeMutation = useMutation({
    mutationFn: async (tier) => {
      const response = await base44.functions.invoke('subscribeToGoonerCamStripe', {
        tier: tier.id,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        toast.error('Failed to create checkout session');
      }
    },
    onError: (error) => {
      toast.error('Subscription failed', {
        description: error.message || 'Please try again'
      });
    }
  });

  const currentTier = user?.goonercam_subscription_tier || null;
  const filteredTiers = SUBSCRIPTION_TIERS.filter(t => t.billing === billingPeriod);

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-white font-bold text-xl mb-2">Upgrade Your Experience</h2>
        <p className="text-zinc-400 text-sm">Get exclusive perks and bonus coins</p>
      </div>

      {/* Billing Period Toggle */}
      <div className="flex gap-2 bg-zinc-900 rounded-xl p-1 mb-4">
        <button
          onClick={() => setBillingPeriod('monthly')}
          className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
            billingPeriod === 'monthly'
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingPeriod('yearly')}
          className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
            billingPeriod === 'yearly'
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Yearly
          <span className="text-xs ml-1 text-green-400">Save 20%</span>
        </button>
      </div>

      <div className="grid gap-4">
        {filteredTiers.map((tier, idx) => {
          const tierBase = tier.id.replace('_monthly', '').replace('_yearly', '');
          const isActive = currentTier?.includes(tierBase);
          const isUpgrade = !isActive;

          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative bg-zinc-900/50 border rounded-2xl p-5 ${
                isActive ? 'border-green-500/50' : 'border-zinc-800'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {tier.badge}
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    {tier.name}
                    {tier.id === 'vip' && <Crown className="w-4 h-4 text-yellow-400" />}
                  </h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-white font-bold text-2xl">${tier.price}</span>
                    <span className="text-zinc-500 text-sm">/{billingPeriod === 'yearly' ? 'year' : 'month'}</span>
                  </div>
                  {tier.originalPrice && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-zinc-500 text-xs line-through">${tier.originalPrice}</span>
                      <span className="text-green-400 text-xs font-bold">Save $${(tier.originalPrice - tier.price).toFixed(2)}</span>
                    </div>
                  )}
                  {tier.coins > 0 && (
                   <div className="flex items-center gap-1 mt-1">
                     <Sparkles className="w-3 h-3 text-yellow-400" />
                     <span className="text-yellow-400 text-xs font-bold">+{tier.coins} coins/{billingPeriod === 'yearly' ? 'year' : 'month'}</span>
                   </div>
                  )}
                </div>
              </div>

              <ul className="space-y-2 mb-4">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {isActive ? (
                <div className="bg-green-900/30 border border-green-500/30 rounded-lg py-2 text-center">
                  <span className="text-green-400 text-sm font-bold">✓ Active Plan</span>
                </div>
              ) : (
                <Button
                  onClick={() => subscribeMutation.mutate(tier)}
                  disabled={subscribeMutation.isPending}
                  className={`w-full bg-gradient-to-r ${tier.color} hover:opacity-90`}
                >
                  {subscribeMutation.isPending ? 'Processing...' : isUpgrade ? 'Upgrade' : 'Subscribe'}
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-xs text-blue-400">
        💳 All subscriptions renew monthly. Cancel anytime from your profile settings.
      </div>
    </div>
  );
}
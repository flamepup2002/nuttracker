import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingBag, Coins, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COMMISSARY_ITEMS = [
  { id: 'snack_pack', name: 'Snack Pack', price: 50, icon: '🍪', desc: 'Contraband cookies' },
  { id: 'instant_noodles', name: 'Instant Noodles', price: 80, icon: '🍜', desc: 'Cell block comfort food' },
  { id: 'energy_drink', name: 'Energy Drink', price: 120, icon: '⚡', desc: 'Stay wired in the yard' },
  { id: 'phone_card', name: 'Phone Card (30 min)', price: 200, icon: '📞', desc: 'Call outside the walls' },
  { id: 'cigarettes', name: 'Cigarette Pack', price: 150, icon: '🚬', desc: 'Yard currency' },
  { id: 'protection', name: 'Protection Service', price: 500, icon: '🛡️', desc: 'Keep safe for a week' },
  { id: 'better_meal', name: 'Better Meal Tray', price: 300, icon: '🍽️', desc: 'Upgrade from mystery meat' },
  { id: 'radio', name: 'Contraband Radio', price: 750, icon: '📻', desc: 'Hear the outside world' },
  { id: 'extra_rec_time', name: 'Extra Rec Time', price: 400, icon: '🏀', desc: '1 hour in the yard' },
  { id: 'pillow', name: 'Real Pillow', price: 250, icon: '🛏️', desc: 'Not a folded blanket' },
];

export default function PrisonCommissary() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useQuery({
    queryKey: ['commissaryUser'],
    queryFn: async () => {
      const me = await base44.auth.me();
      setUser(me);
      return me;
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async (item) => {
      const newBalance = (user.currency_balance || 0) - item.price;
      await base44.auth.updateMe({ currency_balance: newBalance });
      return base44.entities.Purchase.create({
        item_name: item.name,
        amount: item.price,
        status: 'succeeded',
      });
    },
    onSuccess: (_, item) => {
      toast.success(`Purchased ${item.name}!`);
      setUser(prev => ({ ...prev, currency_balance: (prev.currency_balance || 0) - item.price }));
      queryClient.invalidateQueries({ queryKey: ['commissaryUser'] });
    },
    onError: () => toast.error('Purchase failed'),
  });

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-400" />
            Prison Commissary
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-orange-900/30 border border-orange-600/30 rounded-lg px-3 py-1.5">
          <Coins className="w-4 h-4 text-orange-400" />
          <span className="text-orange-400 font-bold">{user?.currency_balance || 0}</span>
        </div>
      </div>

      <div className="px-6 mt-6">
        <p className="text-zinc-400 text-sm mb-4">Use your kinkcoins to buy commissary items while serving your sentence.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {COMMISSARY_ITEMS.map((item, i) => {
            const canAfford = (user?.currency_balance || 0) >= item.price;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5 text-center"
              >
                <div className="text-4xl mb-2">{item.icon}</div>
                <p className="font-bold text-white text-sm">{item.name}</p>
                <p className="text-zinc-500 text-xs mt-1">{item.desc}</p>
                <div className="flex items-center justify-center gap-1 mt-3 mb-3">
                  <Coins className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-400 font-bold">{item.price}</span>
                </div>
                <Button
                  size="sm"
                  disabled={!canAfford || purchaseMutation.isPending}
                  onClick={() => purchaseMutation.mutate(item)}
                  className={`w-full ${canAfford ? 'bg-orange-600 hover:bg-orange-700' : 'bg-zinc-800 text-zinc-600'}`}
                >
                  {canAfford ? 'Buy' : 'Not enough'}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
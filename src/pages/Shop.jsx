import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ShoppingBag, Coins, Check, Palette, Activity, Video, Sparkles, Brain, Crown, Flame, Zap, Star, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const iconMap = {
  ShoppingBag, Coins, Check, Palette, Activity, Video, Sparkles, Brain, Crown, Flame, Zap, Star, Shield,
};

const AURA_EFFECTS = [
  { id: 'glow_pink', name: 'Pink Glow Aura', icon: 'Sparkles', color: 'from-pink-500 to-rose-500', price: 250, category: 'cosmetic' },
  { id: 'inferno', name: 'Inferno Aura', icon: 'Flame', color: 'from-orange-500 to-red-600', price: 300, category: 'cosmetic' },
  { id: 'lightning', name: 'Lightning Aura', icon: 'Zap', color: 'from-yellow-400 to-amber-500', price: 300, category: 'cosmetic' },
  { id: 'regal', name: 'Regal Crown Aura', icon: 'Crown', color: 'from-yellow-600 to-amber-700', price: 350, category: 'premium' },
  { id: 'mystic', name: 'Mystic Aura', icon: 'Sparkles', color: 'from-purple-600 to-indigo-700', price: 350, category: 'premium' },
  { id: 'celestial', name: 'Celestial Aura', icon: 'Star', color: 'from-blue-400 to-purple-500', price: 400, category: 'limited' },
];

const THEMES = [
  { id: 'default', name: 'Default Pink', icon: 'Sparkles', color: 'from-purple-500 to-pink-500', price: 150, category: 'cosmetic' },
  { id: 'midnight', name: 'Midnight Blue', icon: 'Star', color: 'from-blue-600 to-indigo-700', price: 150, category: 'cosmetic' },
  { id: 'crimson', name: 'Crimson Heat', icon: 'Flame', color: 'from-red-600 to-orange-600', price: 150, category: 'cosmetic' },
  { id: 'emerald', name: 'Emerald Dark', icon: 'Sparkles', color: 'from-emerald-600 to-teal-700', price: 200, category: 'premium' },
  { id: 'gold', name: 'Golden Luxury', icon: 'Crown', color: 'from-yellow-600 to-amber-700', price: 200, category: 'premium' },
  { id: 'neon', name: 'Neon Cyber', icon: 'Zap', color: 'from-cyan-500 to-purple-500', price: 250, category: 'limited' },
];

const GOON_FUEL_PACKS = [
  { id: 'anime_pack', name: 'Anime Style Pack', icon: 'Sparkles', color: 'from-pink-500 to-purple-600', price: 200, category: 'cosmetic', description: 'Unlock anime/hentai style generation' },
  { id: 'fantasy_pack', name: 'Fantasy Style Pack', icon: 'Sparkles', color: 'from-purple-600 to-indigo-700', price: 200, category: 'cosmetic', description: 'Unlock fantasy art style generation' },
  { id: 'unlimited_gen', name: 'Unlimited Generation', icon: 'Zap', color: 'from-yellow-500 to-orange-500', price: 300, category: 'premium', description: 'Remove generation frequency limits' },
  { id: 'keyword_plus', name: 'Custom Keywords Pro', icon: 'Brain', color: 'from-blue-500 to-cyan-500', price: 150, category: 'cosmetic', description: 'Add unlimited custom keywords' },
];

export default function Shop() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: items = [] } = useQuery({
    queryKey: ['shopItems'],
    queryFn: () => base44.entities.ShopItem.filter({ is_active: true }),
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['userPurchases'],
    queryFn: () => base44.entities.Purchase.list('-created_date', 100),
  });

  const purchaseMutation = useMutation({
    mutationFn: async (item) => {
      if (!user || !user.currency_balance) {
        throw new Error('Invalid user data');
      }

      if (user.currency_balance < item.price) {
        throw new Error('Insufficient coins');
      }

      // Create purchase record
      await base44.entities.Purchase.create({
        shop_item_id: item.id,
        item_name: item.name,
        price: item.price,
      });

      // Update user balance
      await base44.auth.updateMe({
        currency_balance: (user.currency_balance || 0) - item.price,
      });

      return item;
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['userPurchases'] });
      setUser(prev => ({
        ...prev,
        currency_balance: (prev?.currency_balance || 0) - item.price,
      }));
      toast.success(`${item.name} purchased!`);
    },
    onError: (error) => {
      toast.error(error.message || 'Purchase failed');
    },
  });

  const isPurchased = (itemId) => {
    return purchases.some(p => p.shop_item_id === itemId);
  };

  const itemsByCategory = {
    cosmetic: [...items.filter(i => i.category === 'cosmetic'), ...AURA_EFFECTS.filter(a => a.category === 'cosmetic'), ...THEMES.filter(t => t.category === 'cosmetic'), ...GOON_FUEL_PACKS.filter(p => p.category === 'cosmetic')],
    feature: items.filter(i => i.category === 'feature'),
    premium: [...items.filter(i => i.category === 'premium'), ...AURA_EFFECTS.filter(a => a.category === 'premium'), ...THEMES.filter(t => t.category === 'premium'), ...GOON_FUEL_PACKS.filter(p => p.category === 'premium')],
    limited: [...items.filter(i => i.category === 'limited'), ...AURA_EFFECTS.filter(a => a.category === 'limited'), ...THEMES.filter(t => t.category === 'limited'), ...GOON_FUEL_PACKS.filter(p => p.category === 'limited')],
  };

  const handleAuraPurchase = async (aura) => {
    if (!user || !user.currency_balance) {
      toast.error('Invalid user data');
      return;
    }

    if (user.currency_balance < aura.price) {
      toast.error('Insufficient coins');
      return;
    }

    try {
      // Create purchase record for aura
      await base44.entities.Purchase.create({
        shop_item_id: aura.id,
        item_name: aura.name,
        price: aura.price,
      });

      // Update user balance
      await base44.auth.updateMe({
        currency_balance: (user.currency_balance || 0) - aura.price,
      });

      setUser(prev => ({
        ...prev,
        currency_balance: (prev?.currency_balance || 0) - aura.price,
      }));

      toast.success(`${aura.name} purchased!`);
    } catch (error) {
      toast.error('Purchase failed');
    }
  };

  const handleThemePurchase = async (theme) => {
    if (!user || !user.currency_balance) {
      toast.error('Invalid user data');
      return;
    }

    if (user.currency_balance < theme.price) {
      toast.error('Insufficient coins');
      return;
    }

    try {
      // Create purchase record for theme
      await base44.entities.Purchase.create({
        shop_item_id: theme.id,
        item_name: theme.name,
        price: theme.price,
      });

      // Update user balance and active theme
      await base44.auth.updateMe({
        currency_balance: (user.currency_balance || 0) - theme.price,
        active_theme: theme.id,
      });

      setUser(prev => ({
        ...prev,
        currency_balance: (prev?.currency_balance || 0) - theme.price,
        active_theme: theme.id,
      }));

      toast.success(`${theme.name} purchased and activated!`);
    } catch (error) {
      toast.error('Purchase failed');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative px-6 py-4 flex items-center justify-between border-b border-zinc-800">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-yellow-400" />
          Shop
        </h1>
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-500/30 rounded-lg px-3 py-1.5">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 font-bold">{user?.currency_balance || 0}</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-20 space-y-8 pt-6">
        {/* Cosmetics */}
        {itemsByCategory.cosmetic.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
              Cosmetics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {itemsByCategory.cosmetic.map(item => {
                const isAura = item.id && item.id.includes('_');
                const isTheme = THEMES.some(t => t.id === item.id);
                const isGoonPack = GOON_FUEL_PACKS.some(p => p.id === item.id);
                return (
                  <ShopCard
                    key={item.id}
                    item={item}
                    isPurchased={isPurchased(item.id)}
                    isActive={isTheme && user?.active_theme === item.id}
                    isLoading={purchaseMutation.isPending}
                    onPurchase={() => isTheme ? handleThemePurchase(item) : (isAura || isGoonPack) ? handleAuraPurchase(item) : purchaseMutation.mutate(item)}
                    canAfford={(user?.currency_balance || 0) >= item.price}
                  />
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Features */}
        {itemsByCategory.feature.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
              Features
            </h2>
            <div className="grid gap-4">
              {itemsByCategory.feature.map(item => (
                <ShopCardWide
                  key={item.id}
                  item={item}
                  isPurchased={isPurchased(item.id)}
                  isLoading={purchaseMutation.isPending}
                  onPurchase={() => purchaseMutation.mutate(item)}
                  canAfford={(user?.currency_balance || 0) >= item.price}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Premium */}
        {itemsByCategory.premium.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
              Premium
            </h2>
            <div className="grid gap-4">
              {itemsByCategory.premium.map(item => {
                const isAura = item.id && item.id.includes('_');
                const isTheme = THEMES.some(t => t.id === item.id);
                const isGoonPack = GOON_FUEL_PACKS.some(p => p.id === item.id);
                return (
                  <ShopCardWide
                    key={item.id}
                    item={item}
                    isPurchased={isPurchased(item.id)}
                    isActive={isTheme && user?.active_theme === item.id}
                    isLoading={purchaseMutation.isPending}
                    onPurchase={() => isTheme ? handleThemePurchase(item) : (isAura || isGoonPack) ? handleAuraPurchase(item) : purchaseMutation.mutate(item)}
                    canAfford={(user?.currency_balance || 0) >= item.price}
                  />
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Limited */}
        {itemsByCategory.limited.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500" />
              Limited Edition
            </h2>
            <div className="grid gap-4">
              {itemsByCategory.limited.map(item => {
                const isAura = item.id && item.id.includes('_');
                const isTheme = THEMES.some(t => t.id === item.id);
                const isGoonPack = GOON_FUEL_PACKS.some(p => p.id === item.id);
                return (
                  <ShopCardWide
                    key={item.id}
                    item={item}
                    isPurchased={isPurchased(item.id)}
                    isActive={isTheme && user?.active_theme === item.id}
                    isLoading={purchaseMutation.isPending}
                    onPurchase={() => isTheme ? handleThemePurchase(item) : (isAura || isGoonPack) ? handleAuraPurchase(item) : purchaseMutation.mutate(item)}
                    canAfford={(user?.currency_balance || 0) >= item.price}
                  />
                );
              })}
            </div>
          </motion.div>
        )}

        {items.length === 0 && (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400">No items available</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ShopCard({ item, isPurchased, isActive, isLoading, onPurchase, canAfford }) {
  const IconComponent = iconMap[item.icon] || ShoppingBag;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={(isPurchased && !isActive) || !canAfford || isLoading}
      onClick={onPurchase}
      className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all h-full border-2 ${
        isActive ? 'border-cyan-400 shadow-lg shadow-cyan-400/50' : 'border-transparent'
      } ${isPurchased && !isActive ? 'opacity-60 cursor-not-allowed' : ''} ${!canAfford && !isPurchased ? 'opacity-50' : ''}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-20`} />
      <div className="relative">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3`}>
          <IconComponent className="w-6 h-6 text-white" />
        </div>
        <p className="text-white font-semibold text-sm line-clamp-2">{item.name}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="flex items-center gap-1 text-yellow-400 font-bold">
            <Coins className="w-4 h-4" />
            {item.price}
          </span>
          {isActive ? <span className="text-cyan-400 text-xs font-bold">ACTIVE</span> : isPurchased && <Check className="w-4 h-4 text-green-400" />}
        </div>
      </div>
    </motion.button>
  );
}

function ShopCardWide({ item, isPurchased, isActive, isLoading, onPurchase, canAfford }) {
  const IconComponent = iconMap[item.icon] || ShoppingBag;

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      disabled={(isPurchased && !isActive) || !canAfford || isLoading}
      onClick={onPurchase}
      className={`relative overflow-hidden rounded-2xl p-5 text-left transition-all w-full border-2 ${
        isActive ? 'border-cyan-400 shadow-lg shadow-cyan-400/50' : 'border-transparent'
      } ${isPurchased && !isActive ? 'opacity-60 cursor-not-allowed' : ''} ${!canAfford && !isPurchased ? 'opacity-50' : ''}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-15`} />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
            <IconComponent className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold">{item.name}</p>
            <p className="text-zinc-400 text-sm mt-1">{item.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <span className="flex items-center gap-1 text-yellow-400 font-bold text-lg">
            <Coins className="w-5 h-5" />
            {item.price}
          </span>
          {isActive ? <span className="text-cyan-400 text-sm font-bold">ACTIVE</span> : isPurchased && <Check className="w-5 h-5 text-green-400" />}
        </div>
      </div>
    </motion.button>
  );
}
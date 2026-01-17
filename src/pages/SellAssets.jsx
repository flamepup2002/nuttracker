import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Car, DollarSign, AlertTriangle, Upload, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ASSET_TYPES = [
  { value: 'car', label: 'Car/Vehicle', icon: '🚗' },
  { value: 'jewelry', label: 'Jewelry', icon: '💎' },
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'crypto', label: 'Cryptocurrency', icon: '₿' },
  { value: 'savings', label: 'Savings Account', icon: '💰' },
  { value: 'retirement_accounts', label: 'Retirement Accounts', icon: '📊' },
  { value: 'other', label: 'Other', icon: '📦' }
];

export default function SellAssets() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [assetData, setAssetData] = useState({
    asset_type: 'car',
    title: '',
    description: '',
    initial_value: '',
    auction_days: 7
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: settings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || null;
    },
  });

  const { data: myListings = [] } = useQuery({
    queryKey: ['myAssetListings'],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.AssetListing.filter({ seller_email: user.email });
    },
    enabled: !!user,
  });

  const createListingMutation = useMutation({
    mutationFn: async (data) => {
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + parseInt(data.auction_days));

      return await base44.entities.AssetListing.create({
        seller_email: user.email,
        asset_type: data.asset_type,
        title: data.title,
        description: data.description,
        initial_value: parseFloat(data.initial_value),
        current_bid: parseFloat(data.initial_value),
        status: 'active',
        ends_at: endsAt.toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAssetListings'] });
      toast.success('Asset listed for auction!');
      setAssetData({
        asset_type: 'car',
        title: '',
        description: '',
        initial_value: '',
        auction_days: 7
      });
    },
    onError: (error) => {
      toast.error('Failed to list asset: ' + error.message);
    },
  });

  const cancelListingMutation = useMutation({
    mutationFn: async (listingId) => {
      return await base44.entities.AssetListing.update(listingId, {
        status: 'cancelled'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAssetListings'] });
      toast.success('Listing cancelled');
    },
  });

  if (!settings?.extreme_mode) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Extreme Mode Required</h2>
          <p className="text-zinc-400 mb-6">Enable extreme mode in settings to access this feature</p>
          <Button onClick={() => navigate(createPageUrl('Settings'))}>
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!assetData.title || !assetData.initial_value) {
      toast.error('Please fill in all required fields');
      return;
    }
    createListingMutation.mutate(assetData);
  };

  const activeListings = myListings.filter(l => l.status === 'active');

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Car className="w-5 h-5 text-orange-500" />
            Sell Assets
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="px-6 pb-24 space-y-6 pt-6">
        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/30 border-2 border-red-500/50 rounded-2xl p-4 flex items-start gap-4"
        >
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-bold">⚠️ EXTREME FINDOM MODE - ASSET LIQUIDATION</p>
            <p className="text-red-400/80 text-sm mt-1">
              You are about to list your assets for public auction. Once sold, assets are transferred to the highest bidder. This is permanent and irreversible.
            </p>
          </div>
        </motion.div>

        {/* Create Listing Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
        >
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-400" />
            List Asset for Auction
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-zinc-400">Asset Type</Label>
              <Select
                value={assetData.asset_type}
                onValueChange={(value) => setAssetData({ ...assetData, asset_type: value })}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {ASSET_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-white">
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-zinc-400">Asset Title *</Label>
              <Input
                value={assetData.title}
                onChange={(e) => setAssetData({ ...assetData, title: e.target.value })}
                placeholder="e.g., 2020 Tesla Model 3, Rolex Watch, etc."
                className="bg-zinc-800 border-zinc-700 text-white mt-2"
                required
              />
            </div>

            <div>
              <Label className="text-zinc-400">Description</Label>
              <Textarea
                value={assetData.description}
                onChange={(e) => setAssetData({ ...assetData, description: e.target.value })}
                placeholder="Describe your asset in detail..."
                className="bg-zinc-800 border-zinc-700 text-white mt-2 min-h-[100px]"
              />
            </div>

            <div>
              <Label className="text-zinc-400">Starting Price ($) *</Label>
              <Input
                type="number"
                value={assetData.initial_value}
                onChange={(e) => setAssetData({ ...assetData, initial_value: e.target.value })}
                placeholder="0.00"
                className="bg-zinc-800 border-zinc-700 text-white mt-2"
                step="0.01"
                required
              />
            </div>

            <div>
              <Label className="text-zinc-400">Auction Duration (Days)</Label>
              <Select
                value={assetData.auction_days.toString()}
                onValueChange={(value) => setAssetData({ ...assetData, auction_days: parseInt(value) })}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="3" className="text-white">3 days</SelectItem>
                  <SelectItem value="7" className="text-white">7 days</SelectItem>
                  <SelectItem value="14" className="text-white">14 days</SelectItem>
                  <SelectItem value="30" className="text-white">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={createListingMutation.isPending}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              {createListingMutation.isPending ? 'Listing...' : 'List Asset for Auction'}
            </Button>
          </form>
        </motion.div>

        {/* My Active Listings */}
        {activeListings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <h2 className="text-white font-bold text-lg mb-4">My Active Listings</h2>
            <div className="space-y-3">
              {activeListings.map((listing) => {
                const assetType = ASSET_TYPES.find(t => t.value === listing.asset_type);
                const endsAt = new Date(listing.ends_at);
                const daysLeft = Math.ceil((endsAt - new Date()) / (1000 * 60 * 60 * 24));

                return (
                  <div key={listing.id} className="bg-zinc-800/50 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{assetType?.icon}</span>
                        <div>
                          <h3 className="text-white font-bold">{listing.title}</h3>
                          <p className="text-zinc-500 text-xs">{assetType?.label}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelListingMutation.mutate(listing.id)}
                        className="border-red-800 text-red-400 hover:bg-red-900/20"
                      >
                        Cancel
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="bg-zinc-900/50 rounded p-2">
                        <p className="text-zinc-500 text-xs">Current Bid</p>
                        <p className="text-white font-bold">${listing.current_bid}</p>
                      </div>
                      <div className="bg-zinc-900/50 rounded p-2">
                        <p className="text-zinc-500 text-xs">Days Left</p>
                        <p className="text-white font-bold">{daysLeft}</p>
                      </div>
                      <div className="bg-zinc-900/50 rounded p-2">
                        <p className="text-zinc-500 text-xs">Bids</p>
                        <p className="text-white font-bold">{listing.highest_bidder_email ? '1+' : '0'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
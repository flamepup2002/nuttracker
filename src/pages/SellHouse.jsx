import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Home, AlertTriangle, DollarSign, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

export default function SellHouse() {
  const navigate = useNavigate();
  const [houseValue, setHouseValue] = useState('');
  const [auctionDays, setAuctionDays] = useState(1);

  // Check if extreme mode is enabled
  const { data: settings, isLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || null;
    },
  });

  useEffect(() => {
    if (settings && !settings.extreme_mode) {
      toast.error('Extreme Mode not enabled');
      navigate(createPageUrl('Home'));
    }
  }, [settings, navigate]);

  const createListingMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + data.auctionDays);

      return base44.entities.HouseListing.create({
        seller_email: user.email,
        initial_value: data.houseValue,
        current_bid: data.houseValue,
        ends_at: endsAt.toISOString(),
      });
    },
    onSuccess: () => {
      toast.success('House listed for auction! Buyers can now bid on your property.');
      setHouseValue('');
      setTimeout(() => navigate(createPageUrl('HouseAuction')), 1500);
    },
    onError: () => {
      toast.error('Failed to create listing');
    },
  });

  const handleSellHouse = async () => {
    const value = parseFloat(houseValue);
    
    if (!value || value <= 0) {
      toast.error('Please enter a valid house value');
      return;
    }

    createListingMutation.mutate({
      houseValue: value,
      auctionDays: auctionDays,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

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
            <Home className="w-5 h-5 text-orange-400" />
            Sell Your House
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-24 space-y-6">
        {/* Warning Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/30 border border-red-500/50 rounded-2xl p-6 flex items-start gap-4"
        >
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-bold text-lg mb-2">EXTREME MODE - House Auction</p>
            <p className="text-red-400/80 text-sm">
              This is an extreme findom feature. You are about to list your house for auction. Dominants will bid on your property. You'll be emailed once your house is sold.
            </p>
          </div>
        </motion.div>

        {/* House Sale Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-8"
        >
          <h2 className="text-white font-bold text-xl mb-6">List Your House for Auction</h2>
          
          <div className="space-y-6">
            {/* House Value Input */}
            <div>
              <Label className="text-zinc-300 mb-3 block flex items-center gap-2">
                <Home className="w-4 h-4" />
                Starting Bid Price
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                <Input
                  type="number"
                  value={houseValue}
                  onChange={(e) => setHouseValue(e.target.value)}
                  placeholder="500000"
                  className="bg-zinc-800 border-zinc-700 text-white pl-8 text-lg py-6"
                />
              </div>
              <p className="text-zinc-500 text-xs mt-2">This will be your starting bid price</p>
            </div>

            {/* Auction Duration */}
            <div>
              <Label className="text-zinc-300 mb-3 block flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Auction Duration
              </Label>
              <select
                value={auctionDays}
                onChange={(e) => setAuctionDays(parseInt(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm"
              >
                <option value={1}>1 Day</option>
                <option value={3}>3 Days</option>
                <option value={7}>7 Days</option>
              </select>
              <p className="text-zinc-500 text-xs mt-2">How long the auction will run</p>
            </div>

            {/* Preview */}
            {houseValue && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-zinc-800/50 rounded-xl p-4"
              >
                <p className="text-zinc-400 text-sm mb-3">Auction Details:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300">Starting Bid</span>
                    <span className="text-green-400 font-bold">${parseFloat(houseValue).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300">Duration</span>
                    <span className="text-yellow-400 font-bold">{auctionDays} {auctionDays === 1 ? 'day' : 'days'}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Info */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
              <p className="text-blue-400 font-medium text-sm mb-2">How it works:</p>
              <ul className="text-blue-400/70 text-xs space-y-1">
                <li>✓ Your house is listed on the House Auction page</li>
                <li>✓ Dominants can place bids on your property</li>
                <li>✓ When auction ends, you'll be emailed with the final bid</li>
                <li>✓ Coins added to your balance when sold</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 fixed bottom-6 left-6 right-6"
        >
          <Button
            onClick={handleSellHouse}
            disabled={!houseValue || createListingMutation.isPending}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 py-6 text-lg font-bold rounded-2xl"
          >
            <Home className="w-5 h-5 mr-2" />
            {createListingMutation.isPending ? 'Creating Listing...' : 'List for Auction'}
          </Button>
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            variant="outline"
            className="w-full bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 py-6 text-lg font-bold rounded-2xl"
          >
            Cancel
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
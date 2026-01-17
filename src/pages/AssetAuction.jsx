import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Gavel, DollarSign, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ASSET_TYPES = [
  { value: 'car', label: 'Car/Vehicle', icon: '🚗' },
  { value: 'jewelry', label: 'Jewelry', icon: '💎' },
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'crypto', label: 'Cryptocurrency', icon: '₿' },
  { value: 'savings', label: 'Savings Account', icon: '💰' },
  { value: 'retirement_accounts', label: 'Retirement Accounts', icon: '📊' },
  { value: 'other', label: 'Other', icon: '📦' }
];

export default function AssetAuction() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedListing, setSelectedListing] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [showBidDialog, setShowBidDialog] = useState(false);

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

  const { data: listings = [] } = useQuery({
    queryKey: ['assetListings'],
    queryFn: () => base44.entities.AssetListing.filter({ status: 'active' }),
  });

  const placeBidMutation = useMutation({
    mutationFn: async ({ listingId, amount }) => {
      return await base44.entities.AssetListing.update(listingId, {
        current_bid: amount,
        highest_bidder_email: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetListings'] });
      toast.success('Bid placed successfully!');
      setShowBidDialog(false);
      setSelectedListing(null);
      setBidAmount('');
    },
    onError: (error) => {
      toast.error('Failed to place bid: ' + error.message);
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

  const handleBid = (listing) => {
    setSelectedListing(listing);
    setBidAmount((listing.current_bid + 50).toString());
    setShowBidDialog(true);
  };

  const confirmBid = () => {
    const amount = parseFloat(bidAmount);
    if (amount <= selectedListing.current_bid) {
      toast.error('Bid must be higher than current bid');
      return;
    }
    placeBidMutation.mutate({ listingId: selectedListing.id, amount });
  };

  const availableListings = listings.filter(l => l.seller_email !== user?.email);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Gavel className="w-5 h-5 text-yellow-500" />
            Asset Auction
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="px-6 pb-24 space-y-6 pt-6">
        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-900/20 border border-yellow-600/30 rounded-2xl p-4"
        >
          <p className="text-yellow-400 text-sm">
            💰 Bid on assets from other users. Highest bidder wins when auction ends.
          </p>
        </motion.div>

        {/* Listings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
            Active Auctions ({availableListings.length})
          </h2>

          {availableListings.length === 0 ? (
            <div className="text-center py-12">
              <Gavel className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No active auctions at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableListings.map((listing) => {
                const assetType = ASSET_TYPES.find(t => t.value === listing.asset_type);
                const endsAt = new Date(listing.ends_at);
                const daysLeft = Math.ceil((endsAt - new Date()) / (1000 * 60 * 60 * 24));
                const isLeading = listing.highest_bidder_email === user?.email;

                return (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-zinc-900 border-2 ${isLeading ? 'border-green-600' : 'border-zinc-800'} rounded-2xl p-5`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <span className="text-3xl">{assetType?.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg">{listing.title}</h3>
                        <p className="text-zinc-500 text-sm">{assetType?.label}</p>
                        {listing.description && (
                          <p className="text-zinc-400 text-sm mt-2">{listing.description}</p>
                        )}
                      </div>
                      {isLeading && (
                        <span className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded-full border border-green-600">
                          Leading
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <p className="text-zinc-500 text-xs mb-1">Current Bid</p>
                        <p className="text-white font-bold text-lg">${listing.current_bid}</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <p className="text-zinc-500 text-xs mb-1">Time Left</p>
                        <p className="text-white font-bold text-lg">{daysLeft}d</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <p className="text-zinc-500 text-xs mb-1">Min Bid</p>
                        <p className="text-white font-bold text-lg">${listing.current_bid + 50}</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleBid(listing)}
                      className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Place Bid
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Bid Dialog */}
      <AlertDialog open={showBidDialog} onOpenChange={setShowBidDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogTitle className="text-white">Place Your Bid</AlertDialogTitle>
          {selectedListing && (
            <AlertDialogDescription className="space-y-4">
              <div>
                <p className="text-white font-bold mb-2">{selectedListing.title}</p>
                <p className="text-zinc-500 text-sm">
                  Current bid: ${selectedListing.current_bid}
                </p>
              </div>

              <div>
                <label className="text-zinc-400 text-sm">Your Bid ($)</label>
                <Input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  step="0.01"
                  min={selectedListing.current_bid + 0.01}
                />
              </div>

              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                <p className="text-yellow-400 text-xs">
                  ⚠️ If you win, you agree to purchase this asset at your bid price. Bids are binding.
                </p>
              </div>
            </AlertDialogDescription>
          )}
          <div className="flex gap-3">
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBid}
              disabled={placeBidMutation.isPending}
              className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
            >
              {placeBidMutation.isPending ? 'Placing...' : 'Confirm Bid'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Home, Gavel, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

export default function HouseAuction() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [bidAmount, setBidAmount] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch all active house listings
  const { data: listings = [] } = useQuery({
    queryKey: ['houseListings'],
    queryFn: async () => {
      return base44.entities.HouseListing.filter({ status: 'active' });
    },
  });

  // Real-time bidding updates
  useEffect(() => {
    const unsubscribe = base44.entities.HouseListing.subscribe((event) => {
      if (event.type === 'update' || event.type === 'create') {
        queryClient.invalidateQueries({ queryKey: ['houseListings'] });
        
        // Show toast notification for new bids from other users
        if (event.type === 'update' && event.data.highest_bidder_email !== user?.email) {
          toast.info(`New bid on ${event.data.location || 'property'}: $${event.data.current_bid.toLocaleString()}`, {
            duration: 3000
          });
        }
      }
    });

    return () => unsubscribe();
  }, [queryClient, user?.email]);

  // Place bid mutation
  const placeBidMutation = useMutation({
    mutationFn: async ({ listingId, newBid }) => {
      const amount = parseFloat(newBid);
      
      if (!amount || amount <= 0) {
        throw new Error('Invalid bid amount');
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Update the listing with new bid
      return base44.entities.HouseListing.update(listingId, {
        current_bid: amount,
        highest_bidder_email: user.email,
      });
    },
    onSuccess: (updatedListing) => {
      queryClient.invalidateQueries({ queryKey: ['houseListings'] });
      toast.success('Bid placed successfully!');
      setBidAmount('');
      setSelectedHouse(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to place bid');
    },
  });

  const handlePlaceBid = () => {
    if (!selectedHouse) {
      toast.error('Select a house first');
      return;
    }

    const amount = parseFloat(bidAmount);
    
    if (amount <= selectedHouse.current_bid) {
      toast.error(`Bid must be higher than $${selectedHouse.current_bid}`);
      return;
    }

    placeBidMutation.mutate({
      listingId: selectedHouse.id,
      newBid: amount,
    });
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
            <Gavel className="w-5 h-5 text-yellow-400" />
            House Auction
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Live
            </span>
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-24 space-y-6">
        {/* Active Listings */}
        <div>
          <h2 className="text-white font-bold text-lg mb-4">Active Listings</h2>
          
          {listings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-12 text-center"
            >
              <Home className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">No houses for sale right now</p>
              <p className="text-zinc-500 text-sm mt-1">Check back later for listings</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing, idx) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedHouse(listing)}
                  className={`rounded-2xl p-5 border cursor-pointer transition-all ${
                    selectedHouse?.id === listing.id
                      ? 'bg-pink-900/30 border-pink-500/50'
                      : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Home className="w-4 h-4 text-orange-400" />
                        <p className="text-white font-bold">{listing.location || 'Property'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-zinc-500 text-xs">Starting Price</p>
                          <p className="text-green-400 font-bold">${listing.initial_value.toLocaleString()}</p>
                        </div>
                        <div className="relative">
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <p className="text-zinc-500 text-xs">Current Bid</p>
                          <p className="text-pink-400 font-bold">${listing.current_bid.toLocaleString()}</p>
                        </div>
                      </div>
                      {(listing.bedrooms || listing.bathrooms || listing.square_footage) && (
                        <div className="flex flex-wrap gap-3 text-xs mb-2">
                          {listing.bedrooms && (
                            <div className="flex items-center gap-1 text-zinc-400">
                              <span>🛏</span>
                              <span>{listing.bedrooms} bed{listing.bedrooms !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {listing.bathrooms && (
                            <div className="flex items-center gap-1 text-zinc-400">
                              <span>🚿</span>
                              <span>{listing.bathrooms} bath{listing.bathrooms !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {listing.square_footage && (
                            <div className="flex items-center gap-1 text-zinc-400">
                              <span>📐</span>
                              <span>{listing.square_footage.toLocaleString()} sq ft</span>
                            </div>
                          )}
                        </div>
                      )}
                      {listing.highest_bidder_email && (
                        <p className="text-zinc-400 text-xs mt-2">
                          Leading bid by: {listing.highest_bidder_email === user?.email ? 'You' : listing.highest_bidder_email}
                        </p>
                      )}
                    </div>
                    <TrendingUp className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Bid Panel */}
        {selectedHouse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 fixed bottom-6 left-6 right-6"
          >
            <h3 className="text-white font-bold mb-4">Place Your Bid</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300 mb-2 block">Minimum Bid</Label>
                <div className="text-sm text-zinc-400">
                  Current highest: <span className="text-pink-400 font-bold">${selectedHouse.current_bid.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <Label className="text-zinc-300 mb-2 block">Your Bid Amount</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                  <Input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={Math.ceil(selectedHouse.current_bid + 1000).toString()}
                    className="bg-zinc-800 border-zinc-700 text-white pl-8"
                    min={selectedHouse.current_bid + 1}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setSelectedHouse(null)}
                  variant="outline"
                  className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePlaceBid}
                  disabled={placeBidMutation.isPending || !bidAmount}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                >
                  {placeBidMutation.isPending ? 'Placing...' : 'Place Bid'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
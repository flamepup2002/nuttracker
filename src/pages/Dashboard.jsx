import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, FileText, DollarSign, Calendar, TrendingUp, 
  AlertTriangle, Home as HomeIcon, Car, Gavel, CreditCard,
  Clock, CheckCircle, Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";

const StatCard = ({ icon: Icon, label, value, subValue, color, onClick }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02 }}
    onClick={onClick}
    className={`bg-gradient-to-br ${color} rounded-2xl p-5 ${onClick ? 'cursor-pointer' : ''}`}
  >
    <Icon className="w-8 h-8 text-white mb-3" />
    <p className="text-white/80 text-sm">{label}</p>
    <p className="text-white text-3xl font-bold">{value}</p>
    {subValue && <p className="text-white/60 text-xs mt-1">{subValue}</p>}
  </motion.div>
);

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['userContracts'],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.DebtContract.filter({ 
        created_by: user.email,
        is_accepted: true 
      });
    },
    enabled: !!user,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['userPayments'],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Payment.list('-created_date', 50);
    },
    enabled: !!user,
  });

  const { data: houseListings = [] } = useQuery({
    queryKey: ['userHouseListings'],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.HouseListing.filter({ seller_email: user.email });
    },
    enabled: !!user,
  });

  const { data: assetListings = [] } = useQuery({
    queryKey: ['userAssetListings'],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.AssetListing.filter({ seller_email: user.email });
    },
    enabled: !!user,
  });

  const { data: houseBids = [] } = useQuery({
    queryKey: ['userHouseBids'],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.HouseListing.filter({ highest_bidder_email: user.email });
    },
    enabled: !!user,
  });

  const { data: assetBids = [] } = useQuery({
    queryKey: ['userAssetBids'],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.AssetListing.filter({ highest_bidder_email: user.email });
    },
    enabled: !!user,
  });

  const { data: userAssets = [] } = useQuery({
    queryKey: ['userAssets'],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.UserAsset.list();
    },
    enabled: !!user,
  });

  const { data: failedPayments = [] } = useQuery({
    queryKey: ['failedPayments'],
    queryFn: () => base44.entities.FailedPayment.filter({ status: 'pending_retry' }),
  });

  // Calculate stats
  const activeContracts = contracts.filter(c => !c.cancelled_at);
  const totalOwed = activeContracts.reduce((sum, c) => sum + (c.total_obligation - (c.amount_paid || 0)), 0);
  const totalPaid = contracts.reduce((sum, c) => sum + (c.amount_paid || 0), 0);
  const overdueContracts = activeContracts.filter(c => {
    if (!c.next_payment_due) return false;
    return new Date(c.next_payment_due) < new Date();
  });

  const upcomingPayments = activeContracts
    .filter(c => c.next_payment_due)
    .sort((a, b) => new Date(a.next_payment_due) - new Date(b.next_payment_due))
    .slice(0, 5);

  const recentPayments = payments.slice(0, 5);
  const activeHouseListings = houseListings.filter(l => l.status === 'active');
  const activeAssetListings = assetListings.filter(l => l.status === 'active');
  const totalBids = houseBids.length + assetBids.length;
  const totalAssetValue = userAssets.reduce((sum, asset) => sum + asset.estimated_value, 0);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold">Dashboard</h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="px-6 pb-24 space-y-6 pt-6">
        {/* Alert for failed payments */}
        {failedPayments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/30 border-2 border-red-500/50 rounded-2xl p-4 flex items-start gap-3"
          >
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-300 font-bold">Payment Issues</p>
              <p className="text-red-400/80 text-sm mt-1">
                {failedPayments.length} failed payment{failedPayments.length > 1 ? 's' : ''} pending retry
              </p>
            </div>
            <Button
              onClick={() => navigate(createPageUrl('PaymentSettings'))}
              size="sm"
              className="bg-red-600 hover:bg-red-700"
            >
              Fix
            </Button>
          </motion.div>
        )}

        {/* Alert for overdue */}
        {overdueContracts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-900/30 border-2 border-orange-500/50 rounded-2xl p-4 flex items-start gap-3"
          >
            <Clock className="w-6 h-6 text-orange-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-orange-300 font-bold">Overdue Payments</p>
              <p className="text-orange-400/80 text-sm mt-1">
                {overdueContracts.length} contract{overdueContracts.length > 1 ? 's' : ''} overdue - penalties may apply
              </p>
            </div>
            <Button
              onClick={() => navigate(createPageUrl('MyContracts'))}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
            >
              View
            </Button>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={FileText}
            label="Active Contracts"
            value={activeContracts.length}
            color="from-purple-600 to-purple-700"
            onClick={() => navigate(createPageUrl('MyContracts'))}
          />
          <StatCard
            icon={DollarSign}
            label="Total Owed"
            value={`$${totalOwed.toFixed(0)}`}
            subValue={`$${totalPaid.toFixed(0)} paid`}
            color="from-red-600 to-red-700"
          />
          <StatCard
            icon={Gavel}
            label="Active Bids"
            value={totalBids}
            subValue={`${houseBids.length} houses, ${assetBids.length} assets`}
            color="from-yellow-600 to-orange-600"
            onClick={() => navigate(createPageUrl('HouseAuction'))}
          />
          <StatCard
            icon={TrendingUp}
            label="My Listings"
            value={activeHouseListings.length + activeAssetListings.length}
            subValue={`${activeHouseListings.length} houses, ${activeAssetListings.length} assets`}
            color="from-blue-600 to-blue-700"
            onClick={() => navigate(createPageUrl('SellHouse'))}
          />
          <StatCard
            icon={Sparkles}
            label="Total Assets"
            value={`$${totalAssetValue.toLocaleString()}`}
            subValue={`${userAssets.length} items tracked`}
            color="from-green-600 to-emerald-600"
            onClick={() => navigate(createPageUrl('MyAssets'))}
          />
        </div>

        {/* Upcoming Payments */}
        {upcomingPayments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Upcoming Payments
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(createPageUrl('MyContracts'))}
                className="text-blue-400"
              >
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {upcomingPayments.map((contract) => {
                const dueDate = new Date(contract.next_payment_due);
                const daysUntil = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
                const isOverdue = daysUntil < 0;

                return (
                  <div key={contract.id} className="bg-zinc-800/50 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{contract.title}</p>
                      <p className={`text-xs ${isOverdue ? 'text-red-400' : 'text-zinc-500'}`}>
                        {isOverdue ? `Overdue by ${Math.abs(daysUntil)} days` : `Due in ${daysUntil} days`}
                      </p>
                    </div>
                    <p className="text-white font-bold">${contract.monthly_payment}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Recent Transactions */}
        {recentPayments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
          >
            <h2 className="text-white font-bold flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-green-400" />
              Recent Transactions
            </h2>
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="bg-zinc-800/50 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {payment.status === 'succeeded' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <p className="text-white text-sm font-medium capitalize">{payment.status}</p>
                      <p className="text-zinc-500 text-xs">
                        {new Date(payment.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-white font-bold">${payment.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Active Listings */}
        {(activeHouseListings.length > 0 || activeAssetListings.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
          >
            <h2 className="text-white font-bold flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              My Active Listings
            </h2>
            <div className="space-y-3">
              {activeHouseListings.map((listing) => (
                <div key={listing.id} className="bg-zinc-800/50 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HomeIcon className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-white text-sm font-medium">House - {listing.location || 'No location'}</p>
                      <p className="text-zinc-500 text-xs">
                        Ends {new Date(listing.ends_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-white font-bold">${listing.current_bid}</p>
                </div>
              ))}
              {activeAssetListings.map((listing) => (
                <div key={listing.id} className="bg-zinc-800/50 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-white text-sm font-medium">{listing.title}</p>
                      <p className="text-zinc-500 text-xs">
                        Ends {new Date(listing.ends_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-white font-bold">${listing.current_bid}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Active Bids */}
        {totalBids > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
          >
            <h2 className="text-white font-bold flex items-center gap-2 mb-4">
              <Gavel className="w-5 h-5 text-yellow-400" />
              My Active Bids
            </h2>
            <div className="space-y-3">
              {houseBids.map((listing) => (
                <div key={listing.id} className="bg-zinc-800/50 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HomeIcon className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-white text-sm font-medium">House - {listing.location || 'No location'}</p>
                      <p className="text-green-400 text-xs">Leading Bid</p>
                    </div>
                  </div>
                  <p className="text-white font-bold">${listing.current_bid}</p>
                </div>
              ))}
              {assetBids.map((listing) => (
                <div key={listing.id} className="bg-zinc-800/50 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-white text-sm font-medium">{listing.title}</p>
                      <p className="text-green-400 text-xs">Leading Bid</p>
                    </div>
                  </div>
                  <p className="text-white font-bold">${listing.current_bid}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {activeContracts.length === 0 && totalBids === 0 && activeHouseListings.length === 0 && activeAssetListings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <FileText className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 mb-2">No activity yet</p>
            <p className="text-zinc-600 text-sm mb-6">Start by accepting a contract or listing an asset</p>
            <Button
              onClick={() => navigate(createPageUrl('GeneratedFindomContracts'))}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Browse Contracts
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
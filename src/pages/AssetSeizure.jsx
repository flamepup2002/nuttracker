import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, Building, Car, Gem, Bitcoin, AlertTriangle } from 'lucide-react';

const COLLATERAL_ICONS = {
  house: Building, car: Car, savings: Package, crypto: Bitcoin, jewelry: Gem, electronics: Package, all_assets: AlertTriangle, none: Package,
};

export default function AssetSeizure() {
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['seizureContracts'],
    queryFn: () => base44.entities.DebtContract.filter({ is_accepted: true }, '-created_date', 200),
  });
  const { data: listings = [] } = useQuery({ queryKey: ['seizureListings'], queryFn: () => base44.entities.AssetListing.list() });
  const { data: houseListings = [] } = useQuery({ queryKey: ['seizureHouses'], queryFn: () => base44.entities.HouseListing.list() });

  const seizedContracts = contracts.filter(c => c.collateral_type && c.collateral_type !== 'none');
  const inLiquidation = contracts.filter(c => c.in_liquidation);
  const defaulted = seizedContracts.filter(c => {
    const total = c.total_obligation || (c.monthly_payment || 0) * (c.duration_months || 0);
    return (c.amount_paid || 0) < total;
  });

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Package className="w-5 h-5 text-orange-400" />
          Asset Seizure
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5 text-center">
            <Package className="w-6 h-6 text-orange-400 mx-auto mb-1" />
            <p className="text-zinc-400 text-xs">Collateral Pledged</p>
            <p className="text-white font-bold text-2xl">{seizedContracts.length}</p>
          </div>
          <div className="bg-red-950/30 border border-red-700/30 rounded-2xl p-5 text-center">
            <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-1" />
            <p className="text-zinc-400 text-xs">In Default</p>
            <p className="text-red-400 font-bold text-2xl">{defaulted.length}</p>
          </div>
          <div className="bg-amber-950/30 border border-amber-700/30 rounded-2xl p-5 text-center">
            <Building className="w-6 h-6 text-amber-400 mx-auto mb-1" />
            <p className="text-zinc-400 text-xs">In Liquidation</p>
            <p className="text-amber-400 font-bold text-2xl">{inLiquidation.length}</p>
          </div>
        </div>

        {listings.length > 0 && (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
            <h3 className="text-white font-bold mb-3">Listed for Auction</h3>
            <div className="space-y-2">
              {listings.map(l => (
                <div key={l.id} className="flex justify-between items-center bg-zinc-800/50 rounded-lg p-3">
                  <span className="text-white text-sm">{l.name || l.item_name || 'Asset'}</span>
                  <span className="text-green-400 font-bold text-sm">${(l.asking_price || l.current_bid || 0).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {houseListings.length > 0 && (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
            <h3 className="text-white font-bold mb-3">Properties Listed</h3>
            <div className="space-y-2">
              {houseListings.map(h => (
                <div key={h.id} className="flex justify-between items-center bg-zinc-800/50 rounded-lg p-3">
                  <div>
                    <span className="text-white text-sm">{h.location || 'Property'}</span>
                    <p className="text-zinc-500 text-xs">{h.bedrooms}bd · {h.bathrooms}ba</p>
                  </div>
                  <span className="text-green-400 font-bold text-sm">${(h.current_bid || h.initial_value || 0).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
          <h3 className="text-white font-bold mb-3">Collateral Held Against Contracts</h3>
          {isLoading && <p className="text-zinc-500 text-center py-4">Loading...</p>}
          {!isLoading && seizedContracts.length === 0 && <p className="text-zinc-500 text-center py-4">No collateral pledged on any contract</p>}
          <div className="space-y-3">
            {seizedContracts.map((c, i) => {
              const Icon = COLLATERAL_ICONS[c.collateral_type] || Package;
              const total = c.total_obligation || (c.monthly_payment || 0) * (c.duration_months || 0);
              const remaining = total - (c.amount_paid || 0);
              const isDefaulted = remaining > 0;
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`rounded-xl border p-4 ${c.in_liquidation ? 'bg-amber-950/30 border-amber-700/40' : isDefaulted ? 'bg-red-950/20 border-red-800/30' : 'bg-zinc-800/50 border-zinc-700'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{c.title}</p>
                      <p className="text-zinc-400 text-xs capitalize">{c.collateral_type.replace('_', ' ')}</p>
                      {c.collateral_details && <p className="text-zinc-500 text-xs mt-1">{c.collateral_details}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-zinc-400 text-xs">Remaining: <span className={isDefaulted ? 'text-red-400' : 'text-green-400'}>${remaining.toFixed(0)}</span></span>
                        {c.in_liquidation && <span className="text-amber-400 text-xs font-bold uppercase animate-pulse">Liquidating</span>}
                        {isDefaulted && !c.in_liquidation && <span className="text-red-400 text-xs font-bold uppercase">At Risk</span>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
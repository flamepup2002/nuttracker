import React from 'react';
import { motion } from 'framer-motion';
import { X, FileText, DollarSign, Calendar, AlertTriangle, TrendingUp, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const INTENSITY_CONFIG = {
  mild: { color: 'from-blue-500 to-blue-600', label: 'Mild', icon: '📋' },
  moderate: { color: 'from-yellow-500 to-orange-500', label: 'Moderate', icon: '⚠️' },
  intense: { color: 'from-orange-600 to-red-600', label: 'Intense', icon: '🔥' },
  extreme: { color: 'from-red-700 to-red-900', label: 'Extreme', icon: '💀' }
};

export default function ContractDetailsModal({ contract, isOpen, onClose }) {
  if (!contract) return null;

  const config = INTENSITY_CONFIG[contract.intensity_level];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            {contract.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div>
            <p className="text-zinc-400 text-sm mb-3">{contract.description}</p>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${config.color} text-white text-xs font-bold`}>
                {config.label}
              </span>
            </div>
          </div>

          {/* Financial Terms */}
          <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              Financial Terms
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-zinc-500 text-xs mb-1">Monthly Payment</p>
                <p className="text-white font-bold">
                  {contract.monthly_payment > 0 ? `$${contract.monthly_payment}` : '85% of income'}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs mb-1">Total Obligation</p>
                <p className="text-white font-bold">${contract.total_obligation?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs mb-1">Duration</p>
                <p className="text-white font-bold">
                  {contract.duration_months ? `${contract.duration_months} months` : 'Forever'}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs mb-1">Amount Paid</p>
                <p className="text-green-400 font-bold">${(contract.amount_paid || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Interest & Penalties */}
          {(contract.interest_rate || contract.penalty_percentage) && (
            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-yellow-400" />
                Interest & Penalties
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {contract.interest_rate > 0 && (
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Interest Rate</p>
                    <p className="text-white font-bold">{contract.interest_rate}% annually</p>
                  </div>
                )}
                {contract.compound_frequency && contract.compound_frequency !== 'none' && (
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Compounds</p>
                    <p className="text-white font-bold capitalize">{contract.compound_frequency}</p>
                  </div>
                )}
                {contract.penalty_percentage > 0 && (
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Late Payment Penalty</p>
                    <p className="text-red-400 font-bold">{contract.penalty_percentage}%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collateral */}
          {contract.collateral_type && contract.collateral_type !== 'none' && (
            <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-4 space-y-3">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400" />
                Collateral
              </h3>
              <div>
                <p className="text-zinc-500 text-xs mb-1">Type</p>
                <p className="text-white font-bold capitalize">{contract.collateral_type.replace(/_/g, ' ')}</p>
              </div>
              {contract.collateral_details && (
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Details</p>
                  <p className="text-white text-sm">{contract.collateral_details}</p>
                </div>
              )}
              {contract.in_liquidation && (
                <div className="bg-red-900/40 rounded-lg p-2 mt-2">
                  <p className="text-red-300 text-xs">
                    ⚠️ Collateral is currently in liquidation process
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Contract Terms */}
          {contract.terms && contract.terms.length > 0 && (
            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Contract Terms ({contract.terms.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {contract.terms.map((term, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="text-purple-400 font-bold text-sm flex-shrink-0">{idx + 1}.</span>
                    <p className="text-zinc-300 text-sm">{term}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Penalty Clause */}
          {contract.custom_penalty_clause && (
            <div className="bg-orange-900/20 border border-orange-600/30 rounded-xl p-4 space-y-2">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Custom Penalty Clause
              </h3>
              <p className="text-orange-300 text-sm">{contract.custom_penalty_clause}</p>
            </div>
          )}

          {/* Contract Status */}
          <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
            <h3 className="text-white font-bold text-sm">Status</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-zinc-500 text-xs mb-1">Signed</p>
                <p className="text-white">
                  {contract.signed_at 
                    ? new Date(contract.signed_at).toLocaleDateString() 
                    : 'Not yet signed'}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs mb-1">Dispute Status</p>
                <p className={`font-bold capitalize ${
                  contract.dispute_status === 'none' ? 'text-green-400' :
                  contract.dispute_status === 'pending' ? 'text-yellow-400' :
                  contract.dispute_status === 'resolved' ? 'text-blue-400' :
                  'text-red-400'
                }`}>
                  {contract.dispute_status || 'None'}
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
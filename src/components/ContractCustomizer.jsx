import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, DollarSign, Home, TrendingUp, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLLATERAL_OPTIONS = [
  { value: 'none', label: 'No Collateral', icon: '🚫', risk: 'Standard' },
  { value: 'house', label: 'House/Property', icon: '🏠', risk: 'Extreme' },
  { value: 'car', label: 'Vehicle', icon: '🚗', risk: 'High' },
  { value: 'savings', label: 'Savings Account', icon: '💰', risk: 'High' },
  { value: 'retirement_accounts', label: 'Retirement Accounts', icon: '📊', risk: 'Extreme' },
  { value: 'crypto', label: 'Cryptocurrency', icon: '₿', risk: 'High' },
  { value: 'jewelry', label: 'Jewelry/Valuables', icon: '💎', risk: 'Medium' },
  { value: 'electronics', label: 'Electronics', icon: '📱', risk: 'Medium' },
  { value: 'all_assets', label: 'All Assets', icon: '⚠️', risk: 'Maximum' }
];

const COMPOUND_OPTIONS = [
  { value: 'none', label: 'No Compounding' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' }
];

const PAYMENT_FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly (Standard)', risk: 'Standard' },
  { value: 'weekly', label: 'Weekly (4x/month)', risk: 'Medium' },
  { value: 'biweekly', label: 'Bi-Weekly (2x/month)', risk: 'Medium' },
  { value: 'daily', label: 'Daily (!)', risk: 'High' },
];

export default function ContractCustomizer({ contract, onCustomize, onCancel }) {
  const [customization, setCustomization] = useState({
    penalty_percentage: contract.penalty_percentage || 50,
    custom_penalty_clause: '',
    collateral_type: 'none',
    collateral_details: '',
    interest_rate: 0,
    compound_frequency: 'none',
    payment_frequency: 'monthly',
  });

  const handleSubmit = () => {
    onCustomize({
      ...contract,
      ...customization,
    });
  };

  const selectedCollateral = COLLATERAL_OPTIONS.find(c => c.value === customization.collateral_type);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto"
    >
      <div className="min-h-screen px-6 py-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-purple-400" />
              <div>
                <h2 className="text-xl font-bold text-white">Customize Contract</h2>
                <p className="text-zinc-400 text-sm">{contract.title}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Penalty Customization */}
            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-red-400" />
                <h3 className="text-white font-semibold">Penalty Terms</h3>
              </div>

              <div>
                <Label className="text-zinc-400 text-sm">Late Payment Penalty (%)</Label>
                <Input
                  type="number"
                  value={customization.penalty_percentage}
                  onChange={(e) => setCustomization({ ...customization, penalty_percentage: parseFloat(e.target.value) || 0 })}
                  className="bg-zinc-900 border-zinc-700 text-white mt-2"
                  min="0"
                  max="200"
                />
                <p className="text-zinc-500 text-xs mt-1">Percentage added to missed payments</p>
              </div>

              <div>
                <Label className="text-zinc-400 text-sm">Custom Penalty Clause (Optional)</Label>
                <Textarea
                  value={customization.custom_penalty_clause}
                  onChange={(e) => setCustomization({ ...customization, custom_penalty_clause: e.target.value })}
                  placeholder="e.g., Three missed payments result in immediate collateral seizure..."
                  className="bg-zinc-900 border-zinc-700 text-white mt-2 min-h-[80px]"
                />
                <p className="text-zinc-500 text-xs mt-1">Define custom consequences for missed payments</p>
              </div>
            </div>

            {/* Collateral Selection */}
            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-5 h-5 text-orange-400" />
                <h3 className="text-white font-semibold">Collateral</h3>
              </div>

              <div>
                <Label className="text-zinc-400 text-sm">Collateral Type</Label>
                <Select
                  value={customization.collateral_type}
                  onValueChange={(value) => setCustomization({ ...customization, collateral_type: value })}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {COLLATERAL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-white">
                        <span className="mr-2">{option.icon}</span>
                        {option.label}
                        <span className="ml-2 text-xs text-zinc-500">({option.risk} Risk)</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCollateral && selectedCollateral.value !== 'none' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <Label className="text-zinc-400 text-sm">Collateral Details</Label>
                  <Textarea
                    value={customization.collateral_details}
                    onChange={(e) => setCustomization({ ...customization, collateral_details: e.target.value })}
                    placeholder={`Describe your ${selectedCollateral.label.toLowerCase()}...`}
                    className="bg-zinc-900 border-zinc-700 text-white mt-2 min-h-[60px]"
                  />
                  
                  <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-3 mt-3">
                    <p className="text-red-400 text-xs">
                      ⚠️ {selectedCollateral.risk} Risk: This collateral may be seized if contract terms are violated
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Interest Rate Configuration */}
            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-semibold">Interest Terms</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400 text-sm">Annual Interest Rate (%)</Label>
                  <Input
                    type="number"
                    value={customization.interest_rate}
                    onChange={(e) => setCustomization({ ...customization, interest_rate: parseFloat(e.target.value) || 0 })}
                    className="bg-zinc-900 border-zinc-700 text-white mt-2"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                <div>
                  <Label className="text-zinc-400 text-sm">Compound Frequency</Label>
                  <Select
                    value={customization.compound_frequency}
                    onValueChange={(value) => setCustomization({ ...customization, compound_frequency: value })}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      {COMPOUND_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-white">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {customization.interest_rate > 0 && customization.compound_frequency !== 'none' && (
                <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-3">
                  <p className="text-yellow-400 text-xs">
                    💡 {customization.interest_rate}% interest compounding {customization.compound_frequency} will significantly increase your debt over time
                  </p>
                </div>
              )}
            </div>

            {/* Payment Frequency */}
            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">Payment Frequency</h3>
                <span className="text-xs text-red-400 bg-red-900/30 px-2 py-0.5 rounded-full">At Your Own Risk</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_FREQUENCY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setCustomization({ ...customization, payment_frequency: opt.value })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      customization.payment_frequency === opt.value
                        ? 'border-purple-500 bg-purple-900/30 text-white'
                        : 'border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-xs text-zinc-500">{opt.risk} Risk</p>
                  </button>
                ))}
              </div>
              {customization.payment_frequency !== 'monthly' && (
                <div className="bg-orange-900/30 border border-orange-600/50 rounded-lg p-3">
                  <p className="text-orange-300 text-xs font-bold">
                    ⚠️ Non-monthly frequency increases your payment burden. Missed payments trigger immediate penalties per the contract terms. Choose carefully.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                Apply Customization
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
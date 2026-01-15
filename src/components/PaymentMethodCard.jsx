import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Check, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

const cardBrandColors = {
  visa: 'from-blue-600 to-blue-800',
  mastercard: 'from-red-600 to-orange-600',
  amex: 'from-green-600 to-teal-600',
  discover: 'from-orange-600 to-yellow-600',
  default: 'from-zinc-700 to-zinc-800'
};

const cardBrandLogos = {
  visa: '💳',
  mastercard: '💳',
  amex: '💳',
  discover: '💳',
  default: '💳'
};

export default function PaymentMethodCard({ paymentMethod, onRemove, showRemove = false }) {
  const brand = paymentMethod?.brand?.toLowerCase() || 'default';
  const gradient = cardBrandColors[brand] || cardBrandColors.default;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-lg`}>
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-sm text-white/80">Active</span>
          </div>
          <span className="text-2xl">{cardBrandLogos[brand]}</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-white/40" />
                  <div className="w-2 h-2 rounded-full bg-white/40" />
                  <div className="w-2 h-2 rounded-full bg-white/40" />
                  <div className="w-2 h-2 rounded-full bg-white/40" />
                </div>
              ))}
              <span className="text-lg font-mono ml-2">{paymentMethod?.last4}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/80 mt-4">
            <span className="uppercase">{brand}</span>
            <span>Expires {paymentMethod?.exp_month}/{paymentMethod?.exp_year}</span>
          </div>
        </div>
      </div>

      {showRemove && onRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="absolute top-2 right-2 text-white/60 hover:text-white hover:bg-white/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );
}
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import MobileSelect from '@/components/MobileSelect';

export default function BankAccountSetup({ user, onSuccess }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bank_account_holder: user?.bank_account_holder || '',
    bank_account_number: user?.bank_account_number || '',
    bank_routing_number: user?.bank_routing_number || '',
    bank_account_type: user?.bank_account_type || 'checking',
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      return base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Bank account updated successfully');
      setShowForm(false);
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast.error('Failed to save bank account');
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      return base44.auth.updateMe({
        bank_account_holder: null,
        bank_account_number: null,
        bank_routing_number: null,
        bank_account_type: null,
        stripe_bank_account_token: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Bank account removed');
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast.error('Failed to remove bank account');
    },
  });

  const handleSave = () => {
    if (!formData.bank_account_holder || !formData.bank_account_number || !formData.bank_routing_number) {
      toast.error('Please fill in all fields');
      return;
    }

    saveMutation.mutate(formData);
  };

  const handleRemove = () => {
    if (confirm('Remove this bank account? You won\'t be able to convert coins to money without a linked account.')) {
      removeMutation.mutate();
    }
  };

  const hasBankAccount = user?.bank_account_holder && user?.bank_account_number;

  return (
    <div className="space-y-4">
      {/* Warning Banner */}
      <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-400 font-medium text-sm">Secure Information</p>
          <p className="text-red-500/70 text-xs mt-1">
            Your bank details are encrypted and only you can see them. They are used solely for e-transfer payouts.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!showForm ? (
          hasBankAccount ? (
            <motion.div
              key="has-account"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-zinc-800/50 rounded-xl p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-medium text-sm">{formData.bank_account_holder}</p>
                  <p className="text-zinc-400 text-xs mt-2">
                    Account: ****{user.bank_account_number?.slice(-4)}
                  </p>
                  <p className="text-zinc-400 text-xs mt-1">
                    Type: {user.bank_account_type === 'checking' ? 'Checking' : 'Savings'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setFormData({
                        bank_account_holder: user?.bank_account_holder || '',
                        bank_account_number: user?.bank_account_number || '',
                        bank_routing_number: user?.bank_routing_number || '',
                        bank_account_type: user?.bank_account_type || 'checking',
                      });
                      setShowForm(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={handleRemove}
                    disabled={removeMutation.isPending}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="no-account"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                onClick={() => setShowForm(true)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Bank Account
              </Button>
            </motion.div>
          )
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 bg-zinc-800/50 rounded-xl p-4"
          >
            <div>
              <Label className="text-zinc-300 mb-2 block">Account Holder Name</Label>
              <Input
                value={formData.bank_account_holder}
                onChange={(e) => setFormData(prev => ({...prev, bank_account_holder: e.target.value}))}
                placeholder="John Doe"
                className="bg-zinc-700 border-zinc-600 text-white"
              />
            </div>

            <div>
              <Label className="text-zinc-300 mb-2 block">Account Number</Label>
              <Input
                type="password"
                inputMode="numeric"
                value={formData.bank_account_number}
                onChange={(e) => setFormData(prev => ({...prev, bank_account_number: e.target.value}))}
                placeholder="1234567890"
                className="bg-zinc-700 border-zinc-600 text-white"
              />
            </div>

            <div>
              <Label className="text-zinc-300 mb-2 block">Routing Number</Label>
              <Input
                type="password"
                inputMode="numeric"
                value={formData.bank_routing_number}
                onChange={(e) => setFormData(prev => ({...prev, bank_routing_number: e.target.value}))}
                placeholder="021000021"
                className="bg-zinc-700 border-zinc-600 text-white"
              />
            </div>

            <div>
              <Label className="text-zinc-300 mb-2 block">Account Type</Label>
              <MobileSelect
                value={formData.bank_account_type}
                onValueChange={(value) => setFormData(prev => ({...prev, bank_account_type: value}))}
                options={[
                  { value: 'checking', label: 'Checking' },
                  { value: 'savings', label: 'Savings' }
                ]}
                title="Select Account Type"
                className="bg-zinc-700 border-zinc-600 text-white"
                triggerClassName="bg-zinc-700 border-zinc-600 text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                className="flex-1 bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
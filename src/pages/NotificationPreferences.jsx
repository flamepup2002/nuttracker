import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

export default function NotificationPreferences() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState({
    payment_due_enabled: true,
    payment_overdue_enabled: true,
    penalty_applied_enabled: true,
    collateral_liquidation_enabled: true,
    contract_status_enabled: true,
    new_contract_offers_enabled: true
  });

  const { data: existingPreferences } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      const prefs = await base44.entities.NotificationPreferences.list();
      return prefs[0] || null;
    },
  });

  useEffect(() => {
    if (existingPreferences) {
      setPreferences(existingPreferences);
    }
  }, [existingPreferences]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (existingPreferences) {
        return base44.entities.NotificationPreferences.update(existingPreferences.id, preferences);
      } else {
        return base44.entities.NotificationPreferences.create(preferences);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
      toast.success('Preferences saved');
    },
    onError: () => {
      toast.error('Failed to save preferences');
    }
  });

  const handleToggle = (key) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  const PREFERENCE_OPTIONS = [
    {
      key: 'payment_due_enabled',
      title: '💳 Payment Due Reminders',
      description: 'Get notified 3 days before payments are due'
    },
    {
      key: 'payment_overdue_enabled',
      title: '⚠️ Overdue Payment Alerts',
      description: 'Receive alerts when payments become overdue'
    },
    {
      key: 'penalty_applied_enabled',
      title: '🚨 Penalty Notifications',
      description: 'Notify when penalties are applied to contracts'
    },
    {
      key: 'collateral_liquidation_enabled',
      title: '🔴 Collateral Liquidation',
      description: 'Critical alerts about asset liquidation processes'
    },
    {
      key: 'contract_status_enabled',
      title: '✅ Contract Status Changes',
      description: 'Updates on contract acceptances and cancellations'
    },
    {
      key: 'new_contract_offers_enabled',
      title: '📋 New Contract Offers',
      description: 'Notifications about new contract opportunities'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('Notifications'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            <h1 className="text-lg font-bold">Notification Settings</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="px-6 pb-24 pt-6 space-y-6">
        <p className="text-zinc-400 text-sm">
          Customize which notifications you want to receive. You can turn off specific types while keeping others active.
        </p>

        {/* Preferences */}
        <div className="space-y-3">
          {PREFERENCE_OPTIONS.map((option, idx) => (
            <motion.div
              key={option.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-white font-bold text-base mb-1 block">
                    {option.title}
                  </Label>
                  <p className="text-zinc-400 text-sm">{option.description}</p>
                </div>
                <Switch
                  checked={preferences[option.key]}
                  onCheckedChange={() => handleToggle(option.key)}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Save Button */}
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Preferences'}
        </Button>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-400 text-sm">
            ℹ️ Critical notifications like collateral liquidation cannot be fully disabled for your protection.
          </p>
        </div>
      </div>
    </div>
  );
}
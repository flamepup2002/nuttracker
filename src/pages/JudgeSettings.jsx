import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Gavel, Settings as SettingsIcon, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function JudgeSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(null);

  const { data: existing } = useQuery({
    queryKey: ['judgeSettings'],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || null;
    },
  });

  useEffect(() => {
    if (existing) setSettings(existing);
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existing?.id) return base44.entities.UserSettings.update(existing.id, data);
      return base44.entities.UserSettings.create(data);
    },
    onSuccess: () => {
      toast.success('Judge AI settings saved');
      queryClient.invalidateQueries({ queryKey: ['judgeSettings'] });
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  if (!settings) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Gavel className="w-5 h-5 text-amber-400" />
          Judge AI Settings
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-4">
          <h3 className="text-white font-bold flex items-center gap-2"><SettingsIcon className="w-5 h-5" /> Enforcement Severity</h3>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Extreme Mode</Label>
              <p className="text-zinc-500 text-xs">Unlocks ruthless, unfair rulings and maximum penalties</p>
            </div>
            <Switch checked={!!settings.extreme_mode} onCheckedChange={(v) => update('extreme_mode', v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Irrevocable Contracts</Label>
              <p className="text-zinc-500 text-xs">Signed contracts cannot be cancelled or disputed</p>
            </div>
            <Switch checked={!!settings.irrevocable_contracts} onCheckedChange={(v) => update('irrevocable_contracts', v)} />
          </div>

          <div>
            <Label className="text-white mb-2 block">AI Mood (Horny Jail & Enforcement)</Label>
            <Select value={settings.horny_jail_ai_mood || 'cruel'} onValueChange={(v) => update('horny_jail_ai_mood', v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="merciless">Merciless</SelectItem>
                <SelectItem value="cruel">Cruel</SelectItem>
                <SelectItem value="sadistic">Sadistic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white mb-2 block">Auction Risk Tolerance</Label>
            <Select value={settings.ai_auction_risk_tolerance || 'aggressive'} onValueChange={(v) => update('ai_auction_risk_tolerance', v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
                <SelectItem value="ruthless">Ruthless</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-amber-900/20 border border-amber-700/30 rounded-2xl p-6">
          <h3 className="text-amber-400 font-bold mb-2">Personality Traits</h3>
          <p className="text-zinc-400 text-sm">
            When extreme mode is ON, the Judge adopts a tough-on-crime persona, references strong leadership,
            and shows zero leniency. When OFF, the Judge is a fair, impartial, politically neutral magistrate.
          </p>
        </motion.div>

        <Button onClick={() => saveMutation.mutate(settings)} disabled={saveMutation.isPending} className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 py-6 text-lg font-bold rounded-2xl">
          <Save className="w-5 h-5 mr-2" /> {saveMutation.isPending ? 'Saving...' : 'Save Judge Settings'}
        </Button>
      </div>
    </div>
  );
}
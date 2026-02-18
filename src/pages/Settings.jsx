import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, DollarSign, Settings2, CreditCard, 
  Bluetooth, Save, Info, AlertTriangle, Plus, Video, Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import StripePaymentSetup from '@/components/StripePaymentSetup';
import PaymentMethodCard from '@/components/PaymentMethodCard';
import BluetoothToyConnect from '@/components/BluetoothToyConnect';


export default function Settings() {
        const navigate = useNavigate();
        const queryClient = useQueryClient();
        const [hasChanges, setHasChanges] = useState(false);
        const [showPaymentSetup, setShowPaymentSetup] = useState(false);
        const [user, setUser] = useState(null);

        // Detect iOS (Web Bluetooth not supported)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        useEffect(() => {
          base44.auth.me().then(setUser).catch(() => {});
        }, []);

        const { data: existingSettings, isLoading } = useQuery({
          queryKey: ['userSettings'],
          queryFn: async () => {
            const list = await base44.entities.UserSettings.list();
            return list[0] || null;
          },
        });

  const { data: paymentMethodData, refetch: refetchPaymentMethod } = useQuery({
    queryKey: ['paymentMethod'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getStripePaymentMethod');
      return response.data;
    },
    initialData: { hasPaymentMethod: false },
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-created_date', 100),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 100),
  });

  // Calculate current debt
  const calculateCurrentDebt = () => {
    if (!sessions || !existingSettings) return 0;
    
    let totalDebt = 0;
    const now = new Date();
    const dailyInterestRate = existingSettings.interest_rate / 100;

    sessions.forEach(session => {
      if (session.is_findom && session.total_cost) {
        const createdDate = new Date(session.created_date);
        const daysElapsed = (now - createdDate) / (1000 * 60 * 60 * 24);
        const debtWithInterest = session.total_cost * Math.pow(1 + dailyInterestRate, daysElapsed);
        totalDebt += debtWithInterest;
      }
    });

    payments.forEach(payment => {
      if (payment.status === 'succeeded') {
        totalDebt -= (payment.amount || 0);
      }
    });

    return Math.max(0, totalDebt);
  };

  const currentDebt = calculateCurrentDebt();
  const hasOutstandingDebt = currentDebt > 0;

  const [settings, setSettings] = useState({
    findom_enabled: false,
    extreme_mode: false,
    base_cost: 5,
    escalation_rate: 10,
    interest_rate: 0,
    interest_frequency: 'daily',
    heart_monitor_connected: false,
    goonercam_enabled: false,
    broadcast_enabled: false,
    ai_dangerous_encouragements: false,
    goon_captions_enabled: false,
    active_aura: null,
    });

  useEffect(() => {
   if (existingSettings) {
     setSettings({
       findom_enabled: existingSettings.findom_enabled ?? false,
       extreme_mode: existingSettings.extreme_mode ?? false,
       base_cost: existingSettings.base_cost ?? 5,
       escalation_rate: existingSettings.escalation_rate ?? 10,
       interest_rate: existingSettings.interest_rate ?? 0,
       interest_frequency: existingSettings.interest_frequency ?? 'daily',
       heart_monitor_connected: existingSettings.heart_monitor_connected ?? false,
       goonercam_enabled: existingSettings.goonercam_enabled ?? false,
       broadcast_enabled: existingSettings.broadcast_enabled ?? false,
       ai_dangerous_encouragements: existingSettings.ai_dangerous_encouragements ?? false,
       goon_captions_enabled: existingSettings.goon_captions_enabled ?? false,
       active_aura: existingSettings.active_aura ?? null,
       });
   }
  }, [existingSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingSettings?.id) {
        return base44.entities.UserSettings.update(existingSettings.id, data);
      } else {
        return base44.entities.UserSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      toast.success('Settings saved!');
      setHasChanges(false);
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  const removePaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('removeStripePaymentMethod');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethod'] });
      refetchPaymentMethod();
      toast.success('Payment method removed');
    },
    onError: () => {
      toast.error('Failed to remove payment method');
    },
  });

  const handleRemovePayment = () => {
    if (confirm('Remove payment method? You will need to add a new one to use Findom mode.')) {
      removePaymentMutation.mutate();
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

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
            <Settings2 className="w-5 h-5 text-zinc-400" />
            Settings
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-24 space-y-6">
        {/* Findom Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold">Findom Mode</h2>
              <p className="text-zinc-500 text-sm">Financial domination settings</p>
            </div>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl mb-4">
            <div>
              <p className="text-white font-medium">Enable Findom Mode</p>
              <p className="text-zinc-500 text-xs mt-1">Orgasms will have escalating costs</p>
            </div>
            <Switch
              checked={settings.findom_enabled}
              onCheckedChange={(checked) => handleChange('findom_enabled', checked)}
            />
          </div>

          {settings.findom_enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-6"
            >
                {/* Extreme Mode Toggle */}
                <div className="flex items-center justify-between p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
                  <div>
                    <p className="text-white font-medium">Extreme Mode</p>
                    <p className="text-zinc-500 text-xs mt-1">Unlock extreme findom features (house sale, etc.)</p>
                  </div>
                  <Switch
                    checked={settings.extreme_mode}
                    onCheckedChange={(checked) => handleChange('extreme_mode', checked)}
                  />
                </div>
              {/* Warning */}
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-medium text-sm">Financial Risk Warning</p>
                  <p className="text-yellow-500/70 text-xs mt-1">
                    Findom mode will charge your linked payment method. Set responsible limits.
                  </p>
                </div>
              </div>

              {/* Base Cost */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    Base Cost per Orgasm
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-zinc-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Starting cost at the beginning of a session</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={settings.base_cost}
                    onChange={(e) => handleChange('base_cost', parseInt(e.target.value) || 1)}
                    min={1}
                    max={50}
                    className="w-20 text-right bg-zinc-800 border-zinc-700 text-green-400 font-bold"
                  />
                </div>
                <Slider
                  value={[settings.base_cost]}
                  onValueChange={([value]) => handleChange('base_cost', value)}
                  min={1}
                  max={50}
                  step={1}
                  className="py-4"
                />
              </div>

              {/* Escalation Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    Escalation Rate
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-zinc-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Percentage increase per minute of session</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <span className="text-green-400 font-bold">{settings.escalation_rate}%/min</span>
                </div>
                <Slider
                  value={[settings.escalation_rate]}
                  onValueChange={([value]) => handleChange('escalation_rate', value)}
                  min={1}
                  max={100}
                  step={1}
                  className="py-4"
                />
              </div>

              {/* Interest Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className={`text-zinc-300 flex items-center gap-2 ${hasOutstandingDebt ? 'opacity-50' : ''}`}>
                    Interest Rate (Daily)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-zinc-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Daily compound interest on unpaid balances</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <span className={`font-bold ${hasOutstandingDebt ? 'text-red-400' : 'text-green-400'}`}>
                    {settings.interest_rate}%/day
                  </span>
                </div>
                {hasOutstandingDebt && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-3 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-xs">
                      Interest rate is locked due to outstanding debt. Pay your balance to unlock.
                    </p>
                  </motion.div>
                )}
                <Slider
                  value={[settings.interest_rate * 10]}
                  onValueChange={([value]) => handleChange('interest_rate', value / 10)}
                  min={0}
                  max={100}
                  step={1}
                  className="py-4"
                  disabled={hasOutstandingDebt}
                />
              </div>

              {/* Cost Preview */}
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <p className="text-zinc-400 text-sm mb-3">Cost Preview (example)</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-zinc-500 text-xs">5 min</p>
                    <p className="text-white font-bold">
                      ${(settings.base_cost * Math.pow(1 + settings.escalation_rate / 100, 5) * Math.pow(1 + settings.interest_rate / 100, 5)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">15 min</p>
                    <p className="text-white font-bold">
                      ${(settings.base_cost * Math.pow(1 + settings.escalation_rate / 100, 15) * Math.pow(1 + settings.interest_rate / 100, 15)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">30 min</p>
                    <p className="text-white font-bold">
                      ${(settings.base_cost * Math.pow(1 + settings.escalation_rate / 100, 30) * Math.pow(1 + settings.interest_rate / 100, 30)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              </motion.div>
              )}

              </motion.div>
              )}

              {/* Payment Method */}
        {settings.findom_enabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold">Payment Method</h2>
                <p className="text-zinc-500 text-sm">For automatic findom charges</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!showPaymentSetup ? (
                paymentMethodData?.hasPaymentMethod ? (
                  <motion.div
                    key="has-payment"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <PaymentMethodCard 
                      paymentMethod={paymentMethodData.paymentMethod}
                      onRemove={handleRemovePayment}
                      showRemove={false}
                    />
                    <Button
                      onClick={() => setShowPaymentSetup(true)}
                      variant="outline"
                      className="w-full mt-4 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Update Payment Method
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-payment"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-yellow-400 font-medium text-sm">No payment method added</p>
                          <p className="text-yellow-500/70 text-xs mt-1">
                            Add a payment method to enable automatic findom charges
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowPaymentSetup(true)}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </motion.div>
                )
              ) : (
                <motion.div
                  key="setup-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <StripePaymentSetup
                    onSuccess={() => {
                      setShowPaymentSetup(false);
                      refetchPaymentMethod();
                    }}
                    onCancel={() => setShowPaymentSetup(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            </motion.div>
            )}



            {/* GoonerCam Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold">GoonerCam</h2>
              <p className="text-zinc-500 text-sm">View and broadcast sessions</p>
            </div>
          </div>

          {/* Enable GoonerCam */}
          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl mb-4">
            <div>
              <p className="text-white font-medium">Enable GoonerCam</p>
              <p className="text-zinc-500 text-xs mt-1">Access to view live sessions</p>
            </div>
            <Switch
              checked={settings.goonercam_enabled}
              onCheckedChange={(checked) => handleChange('goonercam_enabled', checked)}
            />
          </div>

          {/* Enable Broadcasting */}
          {settings.goonercam_enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                <div>
                  <p className="text-white font-medium">Enable Broadcasting</p>
                  <p className="text-zinc-500 text-xs mt-1">Allow others to watch your sessions</p>
                </div>
                <Switch
                  checked={settings.broadcast_enabled}
                  onCheckedChange={(checked) => handleChange('broadcast_enabled', checked)}
                />
              </div>

              {settings.broadcast_enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 bg-purple-900/20 border border-purple-500/30 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-purple-400 font-medium text-sm">Broadcasting Active</p>
                      <p className="text-purple-500/70 text-xs mt-1">
                        Your sessions will be visible on GoonerCam when you start broadcasting
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Goon Captions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold">Goon Captions</h2>
              <p className="text-zinc-500 text-sm">On-screen messages during sessions</p>
            </div>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
            <div>
              <p className="text-white font-medium">Enable Goon Captions</p>
              <p className="text-zinc-500 text-xs mt-1">Show motivational messages</p>
            </div>
            <Switch
              checked={settings.goon_captions_enabled}
              onCheckedChange={(checked) => handleChange('goon_captions_enabled', checked)}
            />
          </div>

          {settings.goon_captions_enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 bg-purple-900/20 border border-purple-500/30 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-purple-400 font-medium text-sm">Captions Active</p>
                  <p className="text-purple-500/70 text-xs mt-1">
                    Random messages will appear on screen during goon sessions
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* AI Dangerous Encouragements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold">AI Dangerous Mode</h2>
              <p className="text-zinc-500 text-sm">Unhinged AI encouragements</p>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-orange-900/30 border border-orange-500/50 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-orange-400 font-bold text-sm">WARNING - DANGEROUS CONTENT</p>
                <p className="text-orange-400/80 text-xs mt-1">
                  Enabling this allows the AI to give dangerous encouragements including:
                  cheating on partners, cranking heat/AC to dangerous levels, ignoring safety warnings,
                  and other potentially harmful suggestions. Use at your own risk.
                </p>
              </div>
            </div>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
            <div>
              <p className="text-white font-medium">Enable Dangerous AI</p>
              <p className="text-zinc-500 text-xs mt-1">Let AI give risky suggestions</p>
            </div>
            <Switch
              checked={settings.ai_dangerous_encouragements}
              onCheckedChange={(checked) => handleChange('ai_dangerous_encouragements', checked)}
            />
          </div>

          {settings.ai_dangerous_encouragements && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 bg-orange-900/20 border border-orange-500/30 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-orange-400 font-medium text-sm">Dangerous AI Active</p>
                  <p className="text-orange-500/70 text-xs mt-1">
                    AI will now give unhinged and potentially dangerous suggestions.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>




        {/* Bluetooth Sex Toy Connection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Bluetooth className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold">Bluetooth Toys</h2>
              <p className="text-zinc-500 text-sm">Connect smart toys for control</p>
            </div>
          </div>

          <BluetoothToyConnect />
        </motion.div>

        {/* Heart Monitor Info */}
        {!isIOS && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                <Bluetooth className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold">Heart Rate Monitor</h2>
                <p className="text-zinc-500 text-sm">Cospo H808S compatibility</p>
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <p className="text-zinc-400 text-sm mb-2">Supported devices:</p>
              <ul className="text-zinc-300 text-sm space-y-1">
                <li>• Cospo H808S</li>
                <li>• Any Bluetooth heart rate monitor with standard HR service</li>
              </ul>
              <p className="text-zinc-500 text-xs mt-3">
                Connect during a session using the Heart Rate Monitor panel
              </p>
            </div>
          </motion.div>
        )}

        {/* Save Button */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-6 right-6"
          >
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white py-6 text-lg font-bold rounded-2xl shadow-lg shadow-pink-500/30"
            >
              <Save className="w-5 h-5 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </motion.div>
        )}
      </div>


      </div>
      );
      }
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Play, Square, ArrowLeft, DollarSign, AlertTriangle,
  Flame, TrendingUp, Zap, CreditCard, Lock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SessionTimer from '@/components/SessionTimer';
import HeartRateMonitor from '@/components/HeartRateMonitor';
import HeartRateChart from '@/components/HeartRateChart';
import FindomCostDisplay from '@/components/FindomCostDisplay';
import OrgasmQuickLog from '@/components/OrgasmQuickLog';

export default function FindomSession() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentCost, setCurrentCost] = useState(0);
  const [heartRate, setHeartRate] = useState(null);
  const [heartRateData, setHeartRateData] = useState([]);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionOrgasms, setSessionOrgasms] = useState([]);
  
  // Detect iOS (Web Bluetooth not supported)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const { data: settings, isLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || { base_cost: 5, escalation_rate: 0.5, max_cost_cap: 100, findom_enabled: false };
    },
  });

  // Calculate escalating cost based on duration
  useEffect(() => {
    if (isActive && settings) {
      const minutes = duration / 60;
      const escalatedCost = Math.min(
        settings.base_cost + (settings.escalation_rate * minutes),
        settings.max_cost_cap
      );
      setCurrentCost(escalatedCost);
    }
  }, [duration, isActive, settings]);

  const startSession = async () => {
    if (!settings?.findom_enabled) {
      toast.error('Findom mode not enabled', {
        description: 'Enable it in Settings first'
      });
      return;
    }

    try {
      const newSession = await base44.entities.Session.create({
        start_time: new Date().toISOString(),
        is_findom: true,
        status: 'active',
        total_cost: 0,
        heart_rate_data: [],
      });
      setSession(newSession);
      setIsActive(true);
      setHeartRateData([]);
      setSessionOrgasms([]);
      setCurrentCost(settings.base_cost);
      toast.success('Findom session started!', {
        description: 'Costs will escalate over time'
      });
    } catch (error) {
      toast.error('Failed to start session');
    }
  };

  const endSession = async () => {
    if (!session) return;
    setShowEndDialog(true);
  };

  const confirmEndSession = async () => {
    try {
      const peakHR = heartRateData.length > 0 
        ? Math.max(...heartRateData.map(d => d.bpm))
        : null;
      const avgHR = heartRateData.length > 0
        ? Math.round(heartRateData.reduce((sum, d) => sum + d.bpm, 0) / heartRateData.length)
        : null;

      const totalCost = sessionOrgasms.reduce((sum, o) => sum + (o.cost || 0), 0);

      await base44.entities.Session.update(session.id, {
        end_time: new Date().toISOString(),
        duration_seconds: duration,
        status: 'completed',
        total_cost: totalCost,
        heart_rate_data: heartRateData,
        peak_heart_rate: peakHR,
        avg_heart_rate: avgHR,
      });

      // Process payment if there's a cost
      if (totalCost > 0) {
        try {
          const user = await base44.auth.me();
          
          if (!user.stripe_payment_method_id) {
            toast.error('No payment method on file', {
              description: 'Please add a payment method in Settings'
            });
            setIsActive(false);
            setShowEndDialog(false);
            setShowSummary(true);
            return;
          }

          toast.loading('Processing payment...', { id: 'payment' });

          const result = await base44.functions.processFindomPayment({
            sessionId: session.id,
            amount: totalCost,
            stripeCustomerId: user.stripe_customer_id,
            paymentMethodId: user.stripe_payment_method_id
          });

          toast.dismiss('payment');

          if (result.success) {
            toast.success(`Payment processed: $${totalCost.toFixed(2)}`, {
              description: 'Thank you for your submission'
            });
          } else {
            toast.error('Payment failed', {
              description: result.error || 'Please check your payment method'
            });
          }
        } catch (paymentError) {
          toast.dismiss('payment');
          toast.error('Payment processing failed', {
            description: paymentError.message
          });
        }
      } else {
        toast.success('Session complete!');
      }
      
      setIsActive(false);
      setShowEndDialog(false);
      setShowSummary(true);
    } catch (error) {
      toast.error('Failed to end session');
    }
  };

  const handleOrgasmLog = (orgasm) => {
    setSessionOrgasms(prev => [...prev, orgasm]);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stats = {
    peak: heartRateData.length > 0 ? Math.max(...heartRateData.map(d => d.bpm)) : '--',
    avg: heartRateData.length > 0 
      ? Math.round(heartRateData.reduce((sum, d) => sum + d.bpm, 0) / heartRateData.length)
      : '--',
  };

  const totalSessionCost = sessionOrgasms.reduce((sum, o) => sum + (o.cost || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!settings?.findom_enabled) {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-12">
        <button 
          onClick={() => navigate(createPageUrl('Home'))}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-zinc-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Findom Mode Locked</h2>
          <p className="text-zinc-400 mb-6">Enable Findom mode in Settings to access this feature</p>
          <Button
            onClick={() => navigate(createPageUrl('Settings'))}
            className="bg-gradient-to-r from-green-600 to-emerald-600"
          >
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/30 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Findom Session
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-24 space-y-6">
        {/* Timer */}
        <SessionTimer 
          isActive={isActive} 
          startTime={session?.start_time}
          onDurationChange={setDuration}
        />

        {/* Cost Display */}
        {isActive && (
          <FindomCostDisplay
            currentCost={currentCost}
            baseCost={settings.base_cost}
            escalationRate={settings.escalation_rate}
            duration={duration}
            maxCap={settings.max_cost_cap}
          />
        )}

        {/* Session Running Stats */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Orgasms this session</p>
                <p className="text-2xl font-bold text-white">{sessionOrgasms.length}</p>
              </div>
              <div className="text-right">
                <p className="text-zinc-400 text-sm">Session Total</p>
                <p className="text-2xl font-bold text-green-400">${totalSessionCost.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Control Buttons */}
        <div className="flex justify-center gap-4">
          {!isActive ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startSession}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg flex items-center gap-3 shadow-lg shadow-green-500/30"
            >
              <Play className="w-6 h-6" />
              Start Findom Session
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={endSession}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-lg flex items-center gap-3 shadow-lg shadow-red-500/30"
            >
              <Square className="w-6 h-6" />
              End Session
            </motion.button>
          )}
        </div>

        {/* Warning Banner */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-medium text-sm">Escalating Costs Active</p>
              <p className="text-yellow-500/70 text-xs mt-1">
                Cost per orgasm increases by ${settings.escalation_rate}/min. Max cap: ${settings.max_cost_cap}
              </p>
            </div>
          </motion.div>
        )}

        {/* Heart Rate Monitor */}
        {!isIOS && (
          <>
            <HeartRateMonitor 
              onHeartRateChange={setHeartRate}
              onDataPoint={(dp) => setHeartRateData(prev => [...prev, dp])}
            />

            {/* Heart Rate Chart */}
            {heartRateData.length > 0 && (
              <HeartRateChart data={heartRateData} />
            )}
          </>
        )}

        {/* Session Summary */}
        <AnimatePresence>
          {showSummary && !isActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-3xl border border-green-500/30 p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Session Complete
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-black/30 rounded-xl p-4">
                  <p className="text-zinc-400 text-sm">Duration</p>
                  <p className="text-2xl font-bold text-white">{formatDuration(duration)}</p>
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <p className="text-zinc-400 text-sm">Orgasms</p>
                  <p className="text-2xl font-bold text-white">{sessionOrgasms.length}</p>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-4 mb-4">
                <p className="text-zinc-400 text-sm">Total Charged</p>
                <p className="text-4xl font-bold text-green-400">${totalSessionCost.toFixed(2)}</p>
                <p className="text-zinc-500 text-xs mt-2 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  PAD charge will be processed automatically
                </p>
              </div>

              <Button
                onClick={() => {
                  setShowSummary(false);
                  setSession(null);
                  setHeartRateData([]);
                  setDuration(0);
                  setSessionOrgasms([]);
                }}
                className="w-full bg-white/10 hover:bg-white/20 text-white"
              >
                Start New Session
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isActive && (
        <OrgasmQuickLog 
          sessionId={session?.id}
          isFindom={true}
          currentCost={currentCost}
          heartRate={heartRate}
          onLog={handleOrgasmLog}
        />
      )}

      {/* End Session Confirmation */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">End Findom Session?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {totalSessionCost > 0 ? (
                <>
                  You've logged {sessionOrgasms.length} orgasm(s) totaling <span className="text-green-400 font-bold">${totalSessionCost.toFixed(2)}</span>.
                  This amount will be charged as a PAD to your linked payment method.
                </>
              ) : (
                <>No orgasms were logged this session. No charges will be made.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-700">
              Keep Going
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmEndSession}
              className="bg-green-600 hover:bg-green-700"
            >
              {totalSessionCost > 0 ? `Charge $${totalSessionCost.toFixed(2)}` : 'End Session'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
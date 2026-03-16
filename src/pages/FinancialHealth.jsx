import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, TrendingUp, Shield, Eye, EyeOff, Save, DollarSign, Briefcase, CreditCard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FinancialHealthScore from '@/components/FinancialHealthScore';
import MobileSelect from '@/components/MobileSelect';

export default function FinancialHealth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSsn, setShowSsn] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [profile, setProfile] = useState({
    ssn_sin: '',
    annual_income: '',
    monthly_expenses: '',
    credit_score: '',
    employment_status: '',
    net_worth: '',
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user) {
      setProfile({
        ssn_sin: user.ssn_sin || '',
        annual_income: user.annual_income || '',
        monthly_expenses: user.monthly_expenses || '',
        credit_score: user.credit_score || '',
        employment_status: user.employment_status || '',
        net_worth: user.net_worth || '',
      });
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      return base44.auth.updateMe({
        ssn_sin: data.ssn_sin,
        annual_income: data.annual_income ? parseFloat(data.annual_income) : null,
        monthly_expenses: data.monthly_expenses ? parseFloat(data.monthly_expenses) : null,
        credit_score: data.credit_score ? parseInt(data.credit_score) : null,
        employment_status: data.employment_status || null,
        net_worth: data.net_worth ? parseFloat(data.net_worth) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['financialHealthScore'] });
      toast.success('Financial profile saved!');
      setHasChanges(false);
    },
    onError: () => toast.error('Failed to save profile'),
  });

  const handleChange = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const maskedSsn = profile.ssn_sin
    ? profile.ssn_sin.replace(/\d(?=\d{4})/g, '•')
    : '';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Financial Health
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="px-6 pb-24 space-y-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-zinc-400 text-sm">
            Your financial health score is calculated based on payment history,
            debt-to-asset ratio, contract performance, and your financial profile.
          </p>
        </motion.div>

        <FinancialHealthScore />

        {/* Financial Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold">Financial Profile</h2>
              <p className="text-zinc-500 text-xs">Enhances your health score accuracy</p>
            </div>
          </div>

          {/* SSN/SIN */}
          <div>
            <Label className="text-zinc-400 text-sm flex items-center gap-2 mb-2">
              <Shield className="w-3 h-3" />
              SSN / SIN (Social Security / Insurance Number)
            </Label>
            <div className="relative">
              <Input
                type={showSsn ? 'text' : 'password'}
                value={profile.ssn_sin}
                onChange={(e) => handleChange('ssn_sin', e.target.value)}
                placeholder="e.g. 123-45-6789"
                className="bg-zinc-800 border-zinc-700 text-white pr-10"
              />
              <button
                onClick={() => setShowSsn(!showSsn)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                {showSsn ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-zinc-600 text-xs mt-1">
              🔒 Stored securely. Used to enhance financial health scoring.
            </p>
          </div>

          {/* Annual Income */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-400 text-sm flex items-center gap-2 mb-2">
                <DollarSign className="w-3 h-3" />
                Annual Income ($)
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                value={profile.annual_income}
                onChange={(e) => handleChange('annual_income', e.target.value)}
                placeholder="e.g. 60000"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div>
              <Label className="text-zinc-400 text-sm flex items-center gap-2 mb-2">
                <DollarSign className="w-3 h-3" />
                Monthly Expenses ($)
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                value={profile.monthly_expenses}
                onChange={(e) => handleChange('monthly_expenses', e.target.value)}
                placeholder="e.g. 2500"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          {/* Credit Score & Net Worth */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-400 text-sm flex items-center gap-2 mb-2">
                <CreditCard className="w-3 h-3" />
                Credit Score (300–850)
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                value={profile.credit_score}
                onChange={(e) => handleChange('credit_score', e.target.value)}
                placeholder="e.g. 720"
                min={300}
                max={850}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div>
              <Label className="text-zinc-400 text-sm flex items-center gap-2 mb-2">
                <TrendingUp className="w-3 h-3" />
                Net Worth ($)
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                value={profile.net_worth}
                onChange={(e) => handleChange('net_worth', e.target.value)}
                placeholder="e.g. 50000"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          {/* Employment Status */}
          <div>
            <Label className="text-zinc-400 text-sm flex items-center gap-2 mb-2">
              <Briefcase className="w-3 h-3" />
              Employment Status
            </Label>
            <MobileSelect
              value={profile.employment_status}
              onValueChange={(val) => handleChange('employment_status', val)}
              options={[
                { value: 'employed', label: 'Employed' },
                { value: 'self_employed', label: 'Self-Employed' },
                { value: 'unemployed', label: 'Unemployed' },
                { value: 'student', label: 'Student' },
                { value: 'retired', label: 'Retired' },
              ]}
              placeholder="Select status"
              title="Employment Status"
              triggerClassName="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          {/* Credit Score Meter */}
          {profile.credit_score && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-zinc-800/50 rounded-xl p-4"
            >
              <p className="text-zinc-400 text-xs mb-2">Credit Score Rating</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 relative">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow border-2 border-zinc-900"
                    style={{ left: `${Math.max(0, Math.min(100, ((parseInt(profile.credit_score) - 300) / 550) * 100))}%`, transform: 'translate(-50%, -50%)' }}
                  />
                </div>
                <span className={`text-sm font-bold ${
                  profile.credit_score >= 750 ? 'text-green-400' :
                  profile.credit_score >= 670 ? 'text-yellow-400' :
                  profile.credit_score >= 580 ? 'text-orange-400' : 'text-red-400'
                }`}>
                  {profile.credit_score >= 750 ? 'Excellent' :
                   profile.credit_score >= 670 ? 'Good' :
                   profile.credit_score >= 580 ? 'Fair' : 'Poor'}
                </span>
              </div>
            </motion.div>
          )}

          {hasChanges && (
            <Button
              onClick={() => saveMutation.mutate(profile)}
              disabled={saveMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Financial Profile'}
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
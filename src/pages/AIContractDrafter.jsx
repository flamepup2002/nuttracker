import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, FileText, Loader2, Edit, Save, Plus, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import MobileSelect from '@/components/MobileSelect';

const EXAMPLE_PROMPTS = [
  "Create a 6-month contract with $200 monthly payments, moderate intensity, focused on financial discipline",
  "I want an extreme permanent contract with exponential payment increases and severe penalties",
  "Design a mild 3-month starter contract for $100/month with basic terms",
  "Generate an intense 12-month contract with house collateral and 10% interest rate"
];

function buildContractLocally(prompt, intensityLevel, kws) {
  const lower = prompt.toLowerCase();

  // Extract monthly payment
  const paymentMatch = prompt.match(/\$\s*(\d+(?:,\d+)?(?:\.\d+)?)/i)
    || prompt.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:a month|per month|\/month|monthly)/i);
  const rawPayment = paymentMatch ? paymentMatch[1].replace(/,/g, '') : null;
  const defaultPayments = { mild: 50, moderate: 150, intense: 400, extreme: 1000 };
  const monthlyPayment = rawPayment ? parseFloat(rawPayment) : defaultPayments[intensityLevel];

  // Extract duration
  const durationMatch = prompt.match(/(\d+)\s*-?\s*month/i);
  const isPermanent = lower.includes('permanent') || lower.includes('indefinite');
  const defaultDurations = { mild: 3, moderate: 6, intense: 12, extreme: 0 };
  const duration = durationMatch ? parseInt(durationMatch[1]) : (isPermanent ? 0 : defaultDurations[intensityLevel]);

  // Extract interest rate
  const interestMatch = prompt.match(/(\d+(?:\.\d+)?)\s*%\s*interest/i);
  const defaultInterest = { mild: 0, moderate: 0, intense: 8, extreme: 15 };
  const interestRate = interestMatch ? parseFloat(interestMatch[1]) : defaultInterest[intensityLevel];

  // Extract penalty
  const penaltyMatch = prompt.match(/(\d+(?:\.\d+)?)\s*%\s*(?:penalty|late|fee)/i);
  const defaultPenalty = { mild: 5, moderate: 10, intense: 20, extreme: 35 };
  const penaltyPct = penaltyMatch ? parseFloat(penaltyMatch[1]) : defaultPenalty[intensityLevel];

  // Collateral
  const collateralMap = {
    house: 'house', home: 'house', car: 'car', vehicle: 'car',
    savings: 'savings', retirement: 'retirement_accounts', crypto: 'crypto',
    jewelry: 'jewelry', electronics: 'electronics',
    'all assets': 'all_assets', everything: 'all_assets'
  };
  let collateral = 'none';
  for (const [key, val] of Object.entries(collateralMap)) {
    if (lower.includes(key)) { collateral = val; break; }
  }

  // Compound frequency
  const compoundFreq = lower.includes('daily') ? 'daily'
    : lower.includes('weekly') ? 'weekly'
    : lower.includes('quarterly') ? 'quarterly'
    : interestRate > 0 ? 'monthly' : 'none';

  // Title
  const intensityLabels = {
    mild: 'Financial Discipline', moderate: 'Debt Submission',
    intense: 'Strict Obligation', extreme: 'Total Financial Surrender'
  };
  const keywordTag = kws.length > 0 ? ` — ${kws[0].charAt(0).toUpperCase() + kws[0].slice(1)}` : '';
  const title = `${intensityLabels[intensityLevel]} Contract${keywordTag}`;

  // Description
  const descriptions = {
    mild: 'A beginner-friendly financial commitment establishing basic payment obligations and discipline.',
    moderate: 'A balanced contract enforcing regular financial submission with meaningful consequences for non-compliance.',
    intense: 'A strict, enforceable financial agreement with significant penalties and ongoing obligations designed to maintain control.',
    extreme: 'A total financial surrender agreement with maximum penalties, indefinite obligations, and severe consequences for any breach.'
  };

  // Base terms
  const baseTerms = [
    `The submissive party agrees to make monthly payments of $${monthlyPayment.toFixed(2)}${duration > 0 ? ` for ${duration} months` : ' indefinitely'}.`,
    `Any missed or late payment incurs a ${penaltyPct}% penalty automatically added to the outstanding balance.`,
    interestRate > 0
      ? `An interest rate of ${interestRate}% compounded ${compoundFreq} applies to all unpaid balances.`
      : 'No interest applies when payments are made on time.',
    collateral !== 'none'
      ? `The submissive pledges their ${collateral.replace(/_/g, ' ')} as collateral against the total obligation.`
      : 'No physical collateral is required; the obligation is financial only.',
    'This contract is binding from the moment of acceptance and cannot be revoked unilaterally.',
    'All disputes must be submitted in writing and are subject to the dominant party\'s discretion.',
  ];

  const intensityTerms = {
    mild: ['The submissive may request a payment review after 30 days of compliance.'],
    moderate: [
      'Failure to pay for two consecutive months results in an automatic 50% penalty surcharge.',
      'The dominant retains the right to increase monthly payments by up to 10% per quarter.'
    ],
    intense: [
      'Three consecutive missed payments trigger immediate collateral liquidation procedures.',
      'The dominant may assign additional financial tasks or tribute demands at any time.',
      'All financial accounts must be reported monthly to demonstrate compliance.'
    ],
    extreme: [
      'Any cancellation attempt results in a 3-month lump sum penalty due immediately.',
      'The dominant has full authority to restructure terms at will with 24-hour notice.',
      'Non-payment triggers public disclosure procedures and full asset seizure protocols.',
      'The submissive waives all cancellation rights permanently upon signing.'
    ]
  };

  const kwTerms = kws.map(kw => `The contract incorporates ${kw} as a core theme and obligation.`);
  const extraFromPrompt = prompt.trim().length > 20
    ? [`Custom terms as specified: ${prompt.substring(0, 150)}${prompt.length > 150 ? '...' : ''}`]
    : [];

  return {
    title,
    description: descriptions[intensityLevel],
    intensity_level: intensityLevel,
    monthly_payment: monthlyPayment,
    duration_months: duration,
    penalty_percentage: penaltyPct,
    interest_rate: interestRate,
    compound_frequency: compoundFreq,
    collateral_type: collateral,
    terms: [...baseTerms, ...intensityTerms[intensityLevel], ...kwTerms, ...extraFromPrompt]
  };
}

export default function AIContractDrafter() {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState('');
  const [intensity, setIntensity] = useState('moderate');
  const [customKeywords, setCustomKeywords] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [generatedContract, setGeneratedContract] = useState(null);
  const [editedContract, setEditedContract] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const addKeyword = () => {
    if (customKeywords.trim() && !keywords.includes(customKeywords.trim())) {
      setKeywords([...keywords, customKeywords.trim()]);
      setCustomKeywords('');
    }
  };

  const removeKeyword = (index) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const generateMutation = useMutation({
    mutationFn: async (reqs) => {
      await new Promise(r => setTimeout(r, 600));
      return buildContractLocally(reqs, intensity, keywords);
    },
    onSuccess: (contract) => {
      setGeneratedContract(contract);
      setEditedContract(contract);
      toast.success('Contract generated!');
    },
    onError: (error) => {
      toast.error('Error generating contract: ' + error.message);
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (contract) => {
      const now = new Date();
      const nextPaymentDue = new Date(now);
      nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);

      await base44.entities.DebtContract.create({
        title: contract.title,
        description: contract.description,
        intensity_level: contract.intensity_level,
        monthly_payment: contract.monthly_payment,
        duration_months: contract.duration_months || 0,
        total_obligation: contract.monthly_payment * (contract.duration_months || 0),
        penalty_percentage: contract.penalty_percentage || 10,
        interest_rate: contract.interest_rate || 0,
        compound_frequency: contract.compound_frequency || 'none',
        collateral_type: contract.collateral_type || 'none',
        terms: contract.terms || [],
        is_accepted: true,
        accepted_at: now.toISOString(),
        next_payment_due: nextPaymentDue.toISOString(),
        amount_paid: 0,
        dispute_status: 'none',
      });
    },
    onSuccess: () => {
      toast.success('Contract accepted!');
      navigate(createPageUrl('MyContracts'));
    },
    onError: (error) => {
      toast.error('Failed to accept contract: ' + error.message);
    },
  });

  const handleGenerate = () => {
    if (!intensity) {
      toast.error('Please select an intensity level');
      return;
    }
    const prompt = [
      requirements.trim(),
      keywords.length > 0 ? `Include these themes: ${keywords.join(', ')}` : ''
    ].filter(Boolean).join('. ');
    generateMutation.mutate(prompt || `Generate a ${intensity} intensity findom contract`);
  };

  const handleAccept = () => {
    acceptMutation.mutate(editedContract || generatedContract);
  };

  const handleEditToggle = () => setIsEditing(!isEditing);

  const updateEditedField = (field, value) => {
    setEditedContract({ ...editedContract, [field]: value });
  };

  const updateTerm = (index, value) => {
    const newTerms = [...editedContract.terms];
    newTerms[index] = value;
    setEditedContract({ ...editedContract, terms: newTerms });
  };

  const addTerm = () => {
    setEditedContract({ ...editedContract, terms: [...editedContract.terms, 'New term'] });
  };

  const removeTerm = (index) => {
    setEditedContract({ ...editedContract, terms: editedContract.terms.filter((_, i) => i !== index) });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Contract Drafter
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="px-6 pb-24 space-y-6 pt-6">
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
        >
          <h2 className="text-white font-bold text-lg mb-4">Design Your Contract</h2>

          <div className="space-y-4">
            {/* Intensity Level */}
            <div>
              <Label className="text-zinc-400 text-sm">Intensity Level</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['mild', 'moderate', 'intense', 'extreme'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setIntensity(level)}
                    className={`py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
                      intensity === level
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-zinc-500 text-xs mt-2">
                {intensity === 'mild' && 'Light, beginner-friendly terms'}
                {intensity === 'moderate' && 'Balanced mix of pleasure and control'}
                {intensity === 'intense' && 'Strict terms with significant consequences'}
                {intensity === 'extreme' && 'Maximum control and severe penalties'}
              </p>
            </div>

            {/* Custom Keywords */}
            <div>
              <Label className="text-zinc-400 text-sm">Custom Keywords & Themes</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={customKeywords}
                  onChange={(e) => setCustomKeywords(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                  placeholder="e.g., humiliation, wealth transfer, chastity..."
                  className="bg-zinc-800 border-zinc-700 text-white flex-1"
                />
                <Button onClick={addKeyword} variant="outline" className="border-purple-500/50 text-purple-400">
                  Add
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {keywords.map((keyword, idx) => (
                    <div key={idx} className="bg-purple-900/30 border border-purple-600/50 rounded-full px-3 py-1 flex items-center gap-2">
                      <span className="text-sm text-purple-300">{keyword}</span>
                      <button onClick={() => removeKeyword(idx)} className="text-purple-400 hover:text-purple-300">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Requirements */}
            <div>
              <Label className="text-zinc-400 text-sm">Additional Requirements (optional)</Label>
              <Textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Describe specific terms: duration, payment amount, special conditions, collateral, penalties, etc."
                className="bg-zinc-800 border-zinc-700 text-white mt-2 min-h-[100px]"
              />
            </div>

            {/* Warning */}
            <div className="bg-red-950/50 border-2 border-red-500/60 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-bold text-sm">⚠️ ALL CONTRACTS ARE LEGALLY BINDING</p>
                <p className="text-red-400/80 text-xs mt-1">
                  Any contract you generate and accept is fully enforceable. By accepting, you agree to all obligations unconditionally.
                </p>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Generate Contract</>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Example Prompts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
        >
          <h3 className="text-white font-bold mb-3">Example Prompts</h3>
          <div className="space-y-2">
            {EXAMPLE_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => setRequirements(prompt)}
                className="w-full text-left bg-zinc-800/50 hover:bg-zinc-800 rounded-lg p-3 text-sm text-zinc-300 transition-colors"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </motion.div>

        {/* Generated Contract */}
        {generatedContract && editedContract && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-400" />
                <h2 className="text-white font-bold text-lg">Generated Contract</h2>
              </div>
              <Button variant="outline" size="sm" onClick={handleEditToggle} className="border-purple-500/50 text-purple-400">
                {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                {isEditing ? 'Save' : 'Edit'}
              </Button>
            </div>

            <div className="space-y-4">
              {!isEditing ? (
                <>
                  <div>
                    <h3 className="text-white font-bold text-xl mb-2">{editedContract.title}</h3>
                    <p className="text-zinc-300 text-sm">{editedContract.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-900/50 rounded-lg p-3">
                      <p className="text-zinc-500 text-xs">Monthly Payment</p>
                      <p className="text-white font-bold">${editedContract.monthly_payment}</p>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-3">
                      <p className="text-zinc-500 text-xs">Duration</p>
                      <p className="text-white font-bold">{editedContract.duration_months ? `${editedContract.duration_months}m` : 'Permanent'}</p>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-3">
                      <p className="text-zinc-500 text-xs">Intensity</p>
                      <p className="text-white font-bold capitalize">{editedContract.intensity_level}</p>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-3">
                      <p className="text-zinc-500 text-xs">Penalty</p>
                      <p className="text-white font-bold">{editedContract.penalty_percentage}%</p>
                    </div>
                  </div>

                  {editedContract.interest_rate > 0 && (
                    <div className="bg-orange-900/30 border border-orange-600/30 rounded-lg p-3">
                      <p className="text-orange-400 text-sm font-bold">
                        {editedContract.interest_rate}% Interest Rate ({editedContract.compound_frequency} compounding)
                      </p>
                    </div>
                  )}

                  {editedContract.collateral_type && editedContract.collateral_type !== 'none' && (
                    <div className="bg-red-900/30 border border-red-600/30 rounded-lg p-3">
                      <p className="text-red-400 text-sm font-bold">
                        Collateral Required: {editedContract.collateral_type.replace(/_/g, ' ')}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-zinc-400 text-sm font-medium mb-2">Contract Terms:</p>
                    <ul className="space-y-1">
                      {editedContract.terms.map((term, idx) => (
                        <li key={idx} className="text-zinc-300 text-sm flex items-start gap-2">
                          <span className="text-purple-400">•</span>
                          <span>{term}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-zinc-400 text-xs">Title</Label>
                      <Input value={editedContract.title} onChange={(e) => updateEditedField('title', e.target.value)} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Description</Label>
                      <Textarea value={editedContract.description} onChange={(e) => updateEditedField('description', e.target.value)} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-zinc-400 text-xs">Monthly Payment ($)</Label>
                      <Input type="number" inputMode="decimal" value={editedContract.monthly_payment} onChange={(e) => updateEditedField('monthly_payment', parseFloat(e.target.value))} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Duration (months, 0=permanent)</Label>
                      <Input type="number" inputMode="numeric" value={editedContract.duration_months} onChange={(e) => updateEditedField('duration_months', parseInt(e.target.value))} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Intensity Level</Label>
                      <div className="mt-1">
                        <MobileSelect value={editedContract.intensity_level} onValueChange={(val) => updateEditedField('intensity_level', val)} options={[{value:'mild',label:'Mild'},{value:'moderate',label:'Moderate'},{value:'intense',label:'Intense'},{value:'extreme',label:'Extreme'}]} title="Select Intensity" className="bg-zinc-800 border-zinc-700 text-white" triggerClassName="bg-zinc-800 border-zinc-700 text-white capitalize" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Penalty (%)</Label>
                      <Input type="number" inputMode="decimal" value={editedContract.penalty_percentage} onChange={(e) => updateEditedField('penalty_percentage', parseFloat(e.target.value))} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Interest Rate (%)</Label>
                      <Input type="number" inputMode="decimal" value={editedContract.interest_rate} onChange={(e) => updateEditedField('interest_rate', parseFloat(e.target.value))} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Compound Frequency</Label>
                      <div className="mt-1">
                        <MobileSelect value={editedContract.compound_frequency} onValueChange={(val) => updateEditedField('compound_frequency', val)} options={[{value:'none',label:'None'},{value:'daily',label:'Daily'},{value:'weekly',label:'Weekly'},{value:'monthly',label:'Monthly'},{value:'quarterly',label:'Quarterly'}]} title="Select Compound Frequency" className="bg-zinc-800 border-zinc-700 text-white" triggerClassName="bg-zinc-800 border-zinc-700 text-white capitalize" />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-zinc-400 text-xs">Collateral Type</Label>
                      <div className="mt-1">
                        <MobileSelect value={editedContract.collateral_type} onValueChange={(val) => updateEditedField('collateral_type', val)} options={[{value:'none',label:'None'},{value:'house',label:'House'},{value:'car',label:'Car'},{value:'savings',label:'Savings'},{value:'retirement_accounts',label:'Retirement Accounts'},{value:'crypto',label:'Crypto'},{value:'jewelry',label:'Jewelry'},{value:'electronics',label:'Electronics'},{value:'all_assets',label:'All Assets'}]} title="Select Collateral" className="bg-zinc-800 border-zinc-700 text-white" triggerClassName="bg-zinc-800 border-zinc-700 text-white capitalize" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-zinc-400 text-xs">Contract Terms</Label>
                      <Button type="button" size="sm" variant="outline" onClick={addTerm} className="border-purple-500/50 text-purple-400">
                        <Plus className="w-3 h-3 mr-1" />Add Term
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {editedContract.terms.map((term, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input value={term} onChange={(e) => updateTerm(idx, e.target.value)} className="bg-zinc-800 border-zinc-700 text-white flex-1" />
                          <Button type="button" size="icon" variant="ghost" onClick={() => removeTerm(idx)} className="text-red-400 hover:text-red-300">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => { setGeneratedContract(null); setEditedContract(null); setIsEditing(false); }}
                  className="flex-1 border-zinc-700"
                >
                  Generate New
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={acceptMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {acceptMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-2" />Accept Contract</>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
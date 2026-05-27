import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
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

  // ── Payment extraction ──────────────────────────────────────────────────
  let monthlyPayment = null;

  const weeklyMatch = prompt.match(/\$\s*(\d+(?:[,.]\d+)?)\s*(?:per\s*week|\/week|a\s*week)/i);
  if (weeklyMatch) monthlyPayment = parseFloat(weeklyMatch[1].replace(/,/g, '')) * 4.33;

  if (!monthlyPayment) {
    const dailyMatch = prompt.match(/\$\s*(\d+(?:[,.]\d+)?)\s*(?:per\s*day|\/day|a\s*day)/i);
    if (dailyMatch) monthlyPayment = parseFloat(dailyMatch[1].replace(/,/g, '')) * 30;
  }

  if (!monthlyPayment) {
    const m = prompt.match(/\$\s*(\d+(?:[,.]\d+)?)\s*(?:a\s*month|per\s*month|\/month|monthly)/i)
      || prompt.match(/(?:a\s*month|per\s*month|\/month|monthly)\s*(?:of\s*)?\$?\s*(\d+(?:[,.]\d+)?)/i);
    if (m) monthlyPayment = parseFloat((m[1] || m[2]).replace(/,/g, ''));
  }

  if (!monthlyPayment) {
    const all = prompt.match(/\$\s*(\d+(?:[,.]\d+)?(?:k)?)/gi);
    if (all) {
      const raw = all[all.length - 1].replace(/[\$,\s]/g, '');
      monthlyPayment = raw.toLowerCase().endsWith('k') ? parseFloat(raw) * 1000 : parseFloat(raw);
    }
  }

  if (!monthlyPayment) {
    monthlyPayment = { mild: 50, moderate: 150, intense: 500, extreme: 1500 }[intensityLevel];
  }
  monthlyPayment = Math.round(monthlyPayment * 100) / 100;

  // ── Duration extraction ──────────────────────────────────────────────────
  let duration = null;
  const isPermanent = /permanent|indefinite|forever|lifetime|never\s*end/i.test(prompt);

  if (!isPermanent) {
    const yearMatch = prompt.match(/(\d+)\s*-?\s*year/i);
    const monthMatch = prompt.match(/(\d+)\s*-?\s*month/i);
    if (yearMatch) duration = parseInt(yearMatch[1]) * 12;
    else if (monthMatch) duration = parseInt(monthMatch[1]);
  }

  if (duration === null) {
    duration = isPermanent ? 0 : { mild: 3, moderate: 6, intense: 12, extreme: 0 }[intensityLevel];
  }

  // ── Interest rate ────────────────────────────────────────────────────────
  let interestRate = 0;
  const noInterest = /no\s*interest|zero\s*interest|0%\s*interest/i.test(prompt);
  if (!noInterest) {
    const im = prompt.match(/(\d+(?:\.\d+)?)\s*%\s*(?:interest|apr|rate)/i)
      || prompt.match(/interest\s*(?:of|at|rate)?\s*(\d+(?:\.\d+)?)\s*%/i);
    if (im) interestRate = parseFloat(im[1]);
    else interestRate = { mild: 0, moderate: 0, intense: 8, extreme: 18 }[intensityLevel];
  }

  // ── Penalty ──────────────────────────────────────────────────────────────
  const pm = prompt.match(/(\d+(?:\.\d+)?)\s*%\s*(?:penalty|late\s*fee|late\s*charge)/i)
    || prompt.match(/penalty\s*(?:of)?\s*(\d+(?:\.\d+)?)\s*%/i);
  const penaltyPct = pm ? parseFloat(pm[1])
    : { mild: 5, moderate: 10, intense: 25, extreme: 40 }[intensityLevel];

  // ── Collateral ───────────────────────────────────────────────────────────
  const collateralMap = [
    [/\ball\s*assets|everything\b/i, 'all_assets'],
    [/\bhouse|\bhome|\bproperty|\bmortgage/i, 'house'],
    [/\bcar|\bvehicle|\bauto/i, 'car'],
    [/\bretirement|\b401k|\bpension/i, 'retirement_accounts'],
    [/\bcrypto|\bbitcoin|\bethereum/i, 'crypto'],
    [/\bjewelry|\bjewellery/i, 'jewelry'],
    [/\belectronics|\blaptop|\bcomputer/i, 'electronics'],
    [/\bsavings|\bbank\s*account/i, 'savings'],
  ];
  let collateral = 'none';
  for (const [rx, val] of collateralMap) {
    if (rx.test(prompt)) { collateral = val; break; }
  }
  if (collateral === 'none' && intensityLevel === 'extreme') collateral = 'all_assets';

  // ── Compound frequency ───────────────────────────────────────────────────
  const compoundFreq = /daily\s*compound/i.test(prompt) ? 'daily'
    : /weekly\s*compound/i.test(prompt) ? 'weekly'
    : /quarterly\s*compound/i.test(prompt) ? 'quarterly'
    : interestRate > 0 ? 'monthly' : 'none';

  // ── Escalation ───────────────────────────────────────────────────────────
  const hasEscalation = /escalat|increas|doubl|triple|grow/i.test(prompt);
  const escalationPct = intensityLevel === 'extreme' ? 25 : intensityLevel === 'intense' ? 15 : 10;

  // ── Title ─────────────────────────────────────────────────────────────────
  const kwTag = kws.length > 0 ? ` — ${kws.slice(0, 2).map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(' & ')}` : '';
  const titleThemes = {
    mild: ['Financial Discipline Agreement', 'Gentle Submission Contract', 'Training Debt Contract'],
    moderate: ['Financial Submission Contract', 'Debt Obligation Agreement', 'Fiscal Control Contract'],
    intense: ['Strict Debt Enforcement Contract', 'Total Financial Obligation', 'Ironclad Payment Agreement'],
    extreme: ['Total Financial Surrender Contract', 'Absolute Debt Domination Agreement', 'Permanent Financial Slavery Contract'],
  };
  const titlePool = titleThemes[intensityLevel];
  const title = titlePool[Math.floor(prompt.length % titlePool.length)] + kwTag;

  // ── Description ──────────────────────────────────────────────────────────
  const durationDesc = duration === 0 ? 'an indefinite, permanent obligation'
    : duration < 6 ? `a ${duration}-month introductory commitment`
    : duration < 13 ? `a ${duration}-month binding obligation`
    : `a ${duration}-month long-term financial servitude`;
  const collateralDesc = collateral !== 'none' ? ` backed by pledged ${collateral.replace(/_/g, ' ')} as collateral` : '';
  const description = `A ${intensityLevel}-intensity financial domination contract establishing ${durationDesc}${collateralDesc}, ` +
    `with $${monthlyPayment.toFixed(2)} monthly payments and ${penaltyPct}% late-payment penalties` +
    (interestRate > 0 ? `, compounded at ${interestRate}% interest` : '') + '.';

  // ── Terms ─────────────────────────────────────────────────────────────────
  const terms = [];

  terms.push(`The submissive party ("Sub") shall make unconditional monthly tribute payments of $${monthlyPayment.toFixed(2)} USD${duration > 0 ? `, every month for ${duration} consecutive months` : ' every month indefinitely until released'}.`);
  terms.push('All payments are due on the 1st of each calendar month. Payments received after the 5th are considered late regardless of circumstance.');
  terms.push(`Any late or missed payment automatically incurs a ${penaltyPct}% penalty charge added to the outstanding balance immediately, without notice or grace period.`);

  if (interestRate > 0) {
    terms.push(`An annual interest rate of ${interestRate}% (compounded ${compoundFreq}) applies to all outstanding unpaid balances. Interest accrues from the date of first missed payment.`);
  }

  if (collateral !== 'none') {
    terms.push(`The Sub irrevocably pledges their ${collateral.replace(/_/g, ' ')} as collateral. In the event of default, the Dominant reserves full rights to initiate liquidation of said collateral to recover outstanding debt.`);
  }

  if (hasEscalation) {
    terms.push(`Monthly payment amounts shall escalate by ${escalationPct}% every 3 months automatically. The Sub acknowledges and accepts all future increased payment amounts at the time of signing.`);
  }

  if (intensityLevel === 'mild') {
    terms.push('The Sub may request a single payment deferral per contract period with 14 days advance written notice. Such deferral does not eliminate the obligation, merely postpones it.');
    terms.push('The contract may be reviewed at the halfway point. Any modification requires written agreement from both parties.');
  }

  if (intensityLevel === 'moderate') {
    terms.push('Two consecutive missed payments trigger an automatic penalty surcharge of 50% of the monthly amount, added immediately to total debt.');
    terms.push('The Dominant retains the right to increase monthly payments by up to 15% quarterly with 48 hours written notice. Sub waives right to dispute such increases.');
    terms.push('The Sub must provide monthly financial status reports confirming ability to pay.');
  }

  if (intensityLevel === 'intense') {
    terms.push('Three consecutive missed payments constitute a material breach, triggering immediate collateral seizure proceedings and the total remaining contract balance becoming due within 30 days.');
    terms.push('The Dominant may impose additional tribute demands, tasks, or financial penalties at any time. Sub is obligated to comply within 72 hours.');
    terms.push('Sub waives all rights to dispute, negotiate, or modify payment amounts once the contract is signed.');
    terms.push('The total remaining balance of the contract becomes immediately payable in full upon any cancellation attempt.');
  }

  if (intensityLevel === 'extreme') {
    terms.push('This contract is IRREVOCABLE. Any attempt to cancel, dispute, or escape obligations results in a 6-month lump-sum penalty (6x monthly payment) becoming due within 24 hours.');
    terms.push('The Dominant has absolute and unilateral authority to restructure, increase, or extend all terms at will with 24 hours notice. Sub has no recourse.');
    terms.push('Non-compliance triggers the immediate initiation of public disclosure protocols, asset seizure, and forwarding of debt records to designated enforcement parties.');
    terms.push('The Sub permanently and irrevocably waives all cancellation rights, dispute rights, and consumer protections applicable to this agreement at the moment of signature.');
    terms.push('Sub agrees to provide unrestricted access to financial account statements monthly as proof of compliance and solvency.');
  }

  const kwTermMap = {
    humiliation: 'The Sub acknowledges that all financial obligations herein are a reflection of their inherent inferiority and accepts public documentation of all defaults as humiliation.',
    'wealth transfer': 'The fundamental purpose of this contract is the systematic and ongoing transfer of wealth from the Sub to the Dominant, accepted unconditionally.',
    chastity: 'Payment compliance is directly tied to chastity protocol compliance. Any chastity violation incurs an additional $50 tribute due within 24 hours.',
    blackmail: "The Sub agrees that evidence of this contract and all payment records may be disclosed at the Dominant's discretion upon breach of any term.",
    worship: 'Each payment is an act of devotion and worship. The Sub affirms their dedication through every tribute made.',
    slavery: "The Sub enters this contract as a financial slave, surrendering all financial autonomy for the contract's duration.",
    tribute: 'All payments herein are tributes, given freely and joyfully as expressions of submission. The Sub renounces all future claims to refunds.',
    debt: 'The Sub acknowledges that their natural state is one of financial debt and obligation to the Dominant, accepting this as a core identity.',
  };
  for (const kw of kws) {
    const match = Object.entries(kwTermMap).find(([k]) => kw.toLowerCase().includes(k));
    if (match) terms.push(match[1]);
    else terms.push(`The Sub accepts all obligations related to "${kw}" as a binding term of this contract.`);
  }

  if (prompt.trim().length > 30) {
    terms.push(`Additional custom terms as specified by the parties: "${prompt.substring(0, 180)}${prompt.length > 180 ? '...' : '"'}`);
  }

  terms.push('This contract becomes legally binding upon electronic acceptance, signature, or verbal agreement. No wet signature is required.');
  terms.push("This contract supersedes all prior agreements between the parties. All disputes are subject exclusively to the Dominant's final judgment.");

  return {
    title,
    description,
    intensity_level: intensityLevel,
    monthly_payment: monthlyPayment,
    duration_months: duration,
    penalty_percentage: penaltyPct,
    interest_rate: interestRate,
    compound_frequency: compoundFreq,
    collateral_type: collateral,
    terms,
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

  const handleAccept = () => acceptMutation.mutate(editedContract || generatedContract);
  const handleEditToggle = () => setIsEditing(!isEditing);
  const updateEditedField = (field, value) => setEditedContract({ ...editedContract, [field]: value });

  const updateTerm = (index, value) => {
    const newTerms = [...editedContract.terms];
    newTerms[index] = value;
    setEditedContract({ ...editedContract, terms: newTerms });
  };

  const addTerm = () => setEditedContract({ ...editedContract, terms: [...editedContract.terms, 'New term'] });
  const removeTerm = (index) => setEditedContract({ ...editedContract, terms: editedContract.terms.filter((_, i) => i !== index) });

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(createPageUrl('Home'))} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />AI Contract Drafter
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="px-6 pb-24 space-y-6 pt-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-4">Design Your Contract</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400 text-sm">Intensity Level</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['mild', 'moderate', 'intense', 'extreme'].map((level) => (
                  <button key={level} onClick={() => setIntensity(level)}
                    className={`py-2 px-3 rounded-lg font-semibold text-sm transition-all ${intensity === level ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
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

            <div>
              <Label className="text-zinc-400 text-sm">Custom Keywords & Themes</Label>
              <div className="flex gap-2 mt-2">
                <Input value={customKeywords} onChange={(e) => setCustomKeywords(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                  placeholder="e.g., humiliation, wealth transfer, chastity..."
                  className="bg-zinc-800 border-zinc-700 text-white flex-1" />
                <Button onClick={addKeyword} variant="outline" className="border-purple-500/50 text-purple-400">Add</Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {keywords.map((keyword, idx) => (
                    <div key={idx} className="bg-purple-900/30 border border-purple-600/50 rounded-full px-3 py-1 flex items-center gap-2">
                      <span className="text-sm text-purple-300">{keyword}</span>
                      <button onClick={() => removeKeyword(idx)} className="text-purple-400 hover:text-purple-300"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="text-zinc-400 text-sm">Additional Requirements (optional)</Label>
              <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)}
                placeholder="Describe specific terms: duration, payment amount, special conditions, collateral, penalties, etc."
                className="bg-zinc-800 border-zinc-700 text-white mt-2 min-h-[100px]" />
            </div>

            <div className="bg-red-950/50 border-2 border-red-500/60 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-bold text-sm">⚠️ ALL CONTRACTS ARE LEGALLY BINDING</p>
                <p className="text-red-400/80 text-xs mt-1">Any contract you generate and accept is fully enforceable. By accepting, you agree to all obligations unconditionally.</p>
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={generateMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              {generateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Contract</>}
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-3">Example Prompts</h3>
          <div className="space-y-2">
            {EXAMPLE_PROMPTS.map((prompt, idx) => (
              <button key={idx} onClick={() => setRequirements(prompt)}
                className="w-full text-left bg-zinc-800/50 hover:bg-zinc-800 rounded-lg p-3 text-sm text-zinc-300 transition-colors">
                "{prompt}"
              </button>
            ))}
          </div>
        </motion.div>

        {generatedContract && editedContract && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-2xl p-6">
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
                    <div className="bg-zinc-900/50 rounded-lg p-3"><p className="text-zinc-500 text-xs">Monthly Payment</p><p className="text-white font-bold">${editedContract.monthly_payment}</p></div>
                    <div className="bg-zinc-900/50 rounded-lg p-3"><p className="text-zinc-500 text-xs">Duration</p><p className="text-white font-bold">{editedContract.duration_months ? `${editedContract.duration_months}m` : 'Permanent'}</p></div>
                    <div className="bg-zinc-900/50 rounded-lg p-3"><p className="text-zinc-500 text-xs">Intensity</p><p className="text-white font-bold capitalize">{editedContract.intensity_level}</p></div>
                    <div className="bg-zinc-900/50 rounded-lg p-3"><p className="text-zinc-500 text-xs">Penalty</p><p className="text-white font-bold">{editedContract.penalty_percentage}%</p></div>
                  </div>
                  {editedContract.interest_rate > 0 && (
                    <div className="bg-orange-900/30 border border-orange-600/30 rounded-lg p-3">
                      <p className="text-orange-400 text-sm font-bold">{editedContract.interest_rate}% Interest Rate ({editedContract.compound_frequency} compounding)</p>
                    </div>
                  )}
                  {editedContract.collateral_type && editedContract.collateral_type !== 'none' && (
                    <div className="bg-red-900/30 border border-red-600/30 rounded-lg p-3">
                      <p className="text-red-400 text-sm font-bold">Collateral Required: {editedContract.collateral_type.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-zinc-400 text-sm font-medium mb-2">Contract Terms:</p>
                    <ul className="space-y-1">
                      {editedContract.terms.map((term, idx) => (
                        <li key={idx} className="text-zinc-300 text-sm flex items-start gap-2">
                          <span className="text-purple-400">•</span><span>{term}</span>
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
                          <Button type="button" size="icon" variant="ghost" onClick={() => removeTerm(idx)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => { setGeneratedContract(null); setEditedContract(null); setIsEditing(false); }} className="flex-1 border-zinc-700">
                  Generate New
                </Button>
                <Button onClick={handleAccept} disabled={acceptMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  {acceptMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><CheckCircle className="w-4 h-4 mr-2" />Accept Contract</>}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
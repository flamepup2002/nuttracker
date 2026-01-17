import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, FileText, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const EXAMPLE_PROMPTS = [
  "Create a 6-month contract with $200 monthly payments, moderate intensity, focused on financial discipline",
  "I want an extreme permanent contract with exponential payment increases and severe penalties",
  "Design a mild 3-month starter contract for $100/month with basic terms",
  "Generate an intense 12-month contract with house collateral and 10% interest rate"
];

export default function AIContractDrafter() {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState('');
  const [generatedContract, setGeneratedContract] = useState(null);

  const generateMutation = useMutation({
    mutationFn: async (reqs) => {
      const response = await base44.functions.invoke('generateCustomContract', {
        requirements: reqs
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setGeneratedContract(data.contract);
        toast.success('Contract generated!');
      } else {
        toast.error('Failed to generate contract');
      }
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });

  const handleGenerate = () => {
    if (!requirements.trim()) {
      toast.error('Please describe your contract requirements');
      return;
    }
    generateMutation.mutate(requirements);
  };

  const handleAccept = () => {
    navigate(createPageUrl('GeneratedFindomContracts'), {
      state: { customContract: generatedContract }
    });
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
          <h2 className="text-white font-bold text-lg mb-4">Describe Your Contract</h2>
          
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400">Contract Requirements</Label>
              <Textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Describe what you want in your contract: duration, payment amount, intensity level, special terms, collateral, penalties, etc."
                className="bg-zinc-800 border-zinc-700 text-white mt-2 min-h-[120px]"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Contract
                </>
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
        {generatedContract && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-purple-400" />
              <h2 className="text-white font-bold text-lg">Generated Contract</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-white font-bold text-xl mb-2">{generatedContract.title}</h3>
                <p className="text-zinc-300 text-sm">{generatedContract.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/50 rounded-lg p-3">
                  <p className="text-zinc-500 text-xs">Monthly Payment</p>
                  <p className="text-white font-bold">${generatedContract.monthly_payment}</p>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-3">
                  <p className="text-zinc-500 text-xs">Duration</p>
                  <p className="text-white font-bold">
                    {generatedContract.duration_months ? `${generatedContract.duration_months}m` : 'Permanent'}
                  </p>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-3">
                  <p className="text-zinc-500 text-xs">Intensity</p>
                  <p className="text-white font-bold capitalize">{generatedContract.intensity_level}</p>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-3">
                  <p className="text-zinc-500 text-xs">Penalty</p>
                  <p className="text-white font-bold">{generatedContract.penalty_percentage}%</p>
                </div>
              </div>

              {generatedContract.interest_rate > 0 && (
                <div className="bg-orange-900/30 border border-orange-600/30 rounded-lg p-3">
                  <p className="text-orange-400 text-sm font-bold">
                    {generatedContract.interest_rate}% Interest Rate ({generatedContract.compound_frequency} compounding)
                  </p>
                </div>
              )}

              {generatedContract.collateral_type && generatedContract.collateral_type !== 'none' && (
                <div className="bg-red-900/30 border border-red-600/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm font-bold">
                    Collateral Required: {generatedContract.collateral_type.replace('_', ' ')}
                  </p>
                </div>
              )}

              <div>
                <p className="text-zinc-400 text-sm font-medium mb-2">Contract Terms:</p>
                <ul className="space-y-1">
                  {generatedContract.terms.map((term, idx) => (
                    <li key={idx} className="text-zinc-300 text-sm flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      <span>{term}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setGeneratedContract(null)}
                  className="flex-1 border-zinc-700"
                >
                  Generate New
                </Button>
                <Button
                  onClick={handleAccept}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Review & Accept
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
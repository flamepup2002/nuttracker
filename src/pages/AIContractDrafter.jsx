import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, FileText, Loader2, Edit, Save, Plus, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [editedContract, setEditedContract] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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
        setEditedContract(data.contract);
        if (data.financialScore) {
          toast.success(`Contract generated! Terms based on your score: ${data.financialScore}`);
        } else {
          toast.success('Contract generated!');
        }
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
      state: { customContract: editedContract || generatedContract }
    });
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedContract(editedContract);
    }
    setIsEditing(!isEditing);
  };

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
    const newTerms = editedContract.terms.filter((_, i) => i !== index);
    setEditedContract({ ...editedContract, terms: newTerms });
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditToggle}
                className="border-purple-500/50 text-purple-400"
              >
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
                      <p className="text-white font-bold">
                        {editedContract.duration_months ? `${editedContract.duration_months}m` : 'Permanent'}
                      </p>
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
                        Collateral Required: {editedContract.collateral_type.replace('_', ' ')}
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
                      <Input
                        value={editedContract.title}
                        onChange={(e) => updateEditedField('title', e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Description</Label>
                      <Textarea
                        value={editedContract.description}
                        onChange={(e) => updateEditedField('description', e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-zinc-400 text-xs">Monthly Payment ($)</Label>
                      <Input
                        type="number"
                        value={editedContract.monthly_payment}
                        onChange={(e) => updateEditedField('monthly_payment', parseFloat(e.target.value))}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Duration (months, 0 = permanent)</Label>
                      <Input
                        type="number"
                        value={editedContract.duration_months}
                        onChange={(e) => updateEditedField('duration_months', parseInt(e.target.value))}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Intensity Level</Label>
                      <Select
                        value={editedContract.intensity_level}
                        onValueChange={(val) => updateEditedField('intensity_level', val)}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem value="mild">Mild</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="intense">Intense</SelectItem>
                          <SelectItem value="extreme">Extreme</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Penalty (%)</Label>
                      <Input
                        type="number"
                        value={editedContract.penalty_percentage}
                        onChange={(e) => updateEditedField('penalty_percentage', parseFloat(e.target.value))}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Interest Rate (%)</Label>
                      <Input
                        type="number"
                        value={editedContract.interest_rate}
                        onChange={(e) => updateEditedField('interest_rate', parseFloat(e.target.value))}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Compound Frequency</Label>
                      <Select
                        value={editedContract.compound_frequency}
                        onValueChange={(val) => updateEditedField('compound_frequency', val)}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Collateral Type</Label>
                      <Select
                        value={editedContract.collateral_type}
                        onValueChange={(val) => updateEditedField('collateral_type', val)}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="car">Car</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                          <SelectItem value="retirement_accounts">Retirement</SelectItem>
                          <SelectItem value="crypto">Crypto</SelectItem>
                          <SelectItem value="jewelry">Jewelry</SelectItem>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="all_assets">All Assets</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-zinc-400 text-xs">Contract Terms</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addTerm}
                        className="border-purple-500/50 text-purple-400"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Term
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {editedContract.terms.map((term, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            value={term}
                            onChange={(e) => updateTerm(idx, e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white flex-1"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeTerm(idx)}
                            className="text-red-400 hover:text-red-300"
                          >
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
                  onClick={() => {
                    setGeneratedContract(null);
                    setEditedContract(null);
                    setIsEditing(false);
                  }}
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
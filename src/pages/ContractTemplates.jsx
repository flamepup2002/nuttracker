import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Plus, Trash2, Star, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ContractTemplates() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', intensity_level: 'moderate', monthly_payment: 0, duration_months: 12, terms: [], category: 'debt' });
  const [termInput, setTermInput] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['contractTemplates'],
    queryFn: () => base44.entities.ContractTemplate.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ContractTemplate.create(data),
    onSuccess: () => {
      toast.success('Template created');
      setShowForm(false);
      setForm({ title: '', description: '', intensity_level: 'moderate', monthly_payment: 0, duration_months: 12, terms: [], category: 'debt' });
      queryClient.invalidateQueries({ queryKey: ['contractTemplates'] });
    },
    onError: () => toast.error('Failed to create template'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ContractTemplate.delete(id),
    onSuccess: () => { toast.success('Template deleted'); queryClient.invalidateQueries({ queryKey: ['contractTemplates'] }); },
  });

  const toggleFavorite = useMutation({
    mutationFn: (t) => base44.entities.ContractTemplate.update(t.id, { is_favorite: !t.is_favorite }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contractTemplates'] }),
  });

  const addTerm = () => {
    if (termInput.trim()) { setForm(p => ({ ...p, terms: [...p.terms, termInput.trim()] })); setTermInput(''); }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Contract Templates
          </h1>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-1" /> New
        </Button>
      </div>

      <div className="px-6 mt-6 space-y-4">
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-4">
            <div>
              <Label className="text-zinc-400 text-sm">Template Title</Label>
              <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className="bg-zinc-800 border-zinc-700 mt-1" placeholder="e.g. Standard Debt Repayment" />
            </div>
            <div>
              <Label className="text-zinc-400 text-sm">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="bg-zinc-800 border-zinc-700 mt-1" placeholder="Contract terms and conditions..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400 text-sm">Monthly Payment</Label>
                <Input type="number" value={form.monthly_payment} onChange={(e) => setForm(p => ({ ...p, monthly_payment: Number(e.target.value) }))} className="bg-zinc-800 border-zinc-700 mt-1" />
              </div>
              <div>
                <Label className="text-zinc-400 text-sm">Duration (months)</Label>
                <Input type="number" value={form.duration_months} onChange={(e) => setForm(p => ({ ...p, duration_months: Number(e.target.value) }))} className="bg-zinc-800 border-zinc-700 mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400 text-sm">Intensity</Label>
                <Select value={form.intensity_level} onValueChange={(v) => setForm(p => ({ ...p, intensity_level: v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="mild">Mild</SelectItem><SelectItem value="moderate">Moderate</SelectItem><SelectItem value="intense">Intense</SelectItem><SelectItem value="extreme">Extreme</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400 text-sm">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="debt">Debt</SelectItem><SelectItem value="behavioral">Behavioral</SelectItem><SelectItem value="findom">Findom</SelectItem><SelectItem value="punishment">Punishment</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-zinc-400 text-sm">Terms</Label>
              <div className="flex gap-2 mt-1">
                <Input value={termInput} onChange={(e) => setTermInput(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="Add a term..." onKeyDown={(e) => e.key === 'Enter' && addTerm()} />
                <Button onClick={addTerm} variant="outline">Add</Button>
              </div>
              {form.terms.length > 0 && (
                <ul className="mt-2 space-y-1">{form.terms.map((t, i) => <li key={i} className="text-zinc-300 text-sm bg-zinc-800/50 rounded px-3 py-1">• {t}</li>)}</ul>
              )}
            </div>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || createMutation.isPending} className="w-full bg-purple-600 hover:bg-purple-700">
              <Save className="w-4 h-4 mr-2" /> Save Template
            </Button>
          </motion.div>
        )}

        {isLoading && <div className="text-center py-8 text-zinc-500">Loading templates...</div>}

        {templates.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white">{t.title}</p>
                  {t.is_favorite && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                </div>
                <p className="text-zinc-500 text-xs mt-1 uppercase">{t.category} · {t.intensity_level}</p>
                {t.description && <p className="text-zinc-400 text-sm mt-2">{t.description}</p>}
                {t.monthly_payment > 0 && <p className="text-green-400 text-sm mt-2">${t.monthly_payment}/mo for {t.duration_months} months</p>}
                {t.terms?.length > 0 && (
                  <ul className="mt-2 space-y-1">{t.terms.map((term, j) => <li key={j} className="text-zinc-400 text-xs">• {term}</li>)}</ul>
                )}
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => toggleFavorite.mutate(t)} className="text-yellow-400"><Star className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(t.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </motion.div>
        ))}

        {!isLoading && templates.length === 0 && !showForm && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">No templates yet — create one for quick assignment by the Judge</p>
          </div>
        )}
      </div>
    </div>
  );
}
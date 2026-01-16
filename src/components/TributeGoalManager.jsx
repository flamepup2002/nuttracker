import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Target, Trash2, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

export default function TributeGoalManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    currency: 'usd',
    description: '',
    priority_level: 'medium',
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['tributeGoals'],
    queryFn: () => base44.entities.TributeGoal.filter({ is_active: true }, '-created_date'),
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.TributeGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tributeGoals'] });
      toast.success('Goal created!');
      setFormData({ name: '', target_amount: '', currency: 'usd', description: '', priority_level: 'medium' });
      setShowForm(false);
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.TributeGoal.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tributeGoals'] });
      toast.success('Goal archived');
    },
  });

  const handleCreateGoal = () => {
    if (!formData.name || !formData.target_amount) {
      toast.error('Fill in all fields');
      return;
    }
    createGoalMutation.mutate(formData);
  };

  const progressPercent = (goal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Tribute Goals
        </h3>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Goal
        </Button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-zinc-800/50 rounded-xl p-4 space-y-3"
        >
          <Input
            placeholder="Goal name (e.g., 'Tribute to Goddess')"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-zinc-900 border-zinc-700 text-white"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              placeholder="Target amount"
              value={formData.target_amount}
              onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
              className="bg-zinc-900 border-zinc-700 text-white"
            />
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2"
            >
              <option value="usd">USD</option>
              <option value="coins">Coins</option>
            </select>
          </div>
          <Input
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="bg-zinc-900 border-zinc-700 text-white"
          />
          <select
            value={formData.priority_level}
            onChange={(e) => setFormData({ ...formData, priority_level: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="extreme">Extreme Priority</option>
          </select>
          <div className="flex gap-2">
            <Button
              onClick={handleCreateGoal}
              disabled={createGoalMutation.isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Create Goal
            </Button>
            <Button
              onClick={() => setShowForm(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {goals.length > 0 ? (
        <div className="space-y-3">
          {goals.map((goal) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-800/50 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-white font-bold">{goal.name}</h4>
                  <p className="text-zinc-400 text-xs">{goal.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteGoalMutation.mutate(goal.id)}
                  disabled={deleteGoalMutation.isPending}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">
                    {goal.currency === 'usd' ? '$' : ''}{goal.current_amount}{goal.currency === 'coins' ? ' coins' : ''}
                  </span>
                  <span className="text-zinc-500">
                    of {goal.currency === 'usd' ? '$' : ''}{goal.target_amount}{goal.currency === 'coins' ? ' coins' : ''}
                  </span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent(goal)}%` }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  {Math.round(progressPercent(goal))}% complete
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <Target className="w-12 h-12 text-zinc-700 mx-auto mb-2" />
          <p className="text-zinc-500 text-sm">No active goals. Create one to start!</p>
        </div>
      )}
    </div>
  );
}
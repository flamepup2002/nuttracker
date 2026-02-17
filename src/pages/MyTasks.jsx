import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Upload, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DIFFICULTY_COLORS = {
  easy: 'from-blue-500 to-cyan-500',
  medium: 'from-yellow-500 to-orange-500',
  hard: 'from-orange-600 to-red-600',
  extreme: 'from-red-700 to-purple-700'
};

export default function MyTasks() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState(null);
  const [reportText, setReportText] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);

  const { data: tasks = [] } = useQuery({
    queryKey: ['bullyTasks'],
    queryFn: () => base44.entities.BullyTask.list('-created_date', 100),
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['taskCompletions'],
    queryFn: () => base44.entities.TaskCompletion.list('-created_date', 100),
  });

  const submitMutation = useMutation({
    mutationFn: async (taskId) => {
      const response = await base44.functions.invoke('submitTaskCompletion', {
        taskId,
        userReport: reportText,
        proofImages: uploadedImages
      });
      return response.data;
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['bullyTasks'] });
      const previousTasks = queryClient.getQueryData(['bullyTasks']);
      
      // Optimistically mark as submitted
      queryClient.setQueryData(['bullyTasks'], (old = []) =>
        old.map(task => 
          task.id === taskId 
            ? { ...task, status: 'submitted' }
            : task
        )
      );
      
      toast.loading('Submitting to Bully AI...', { id: 'submit-task' });
      
      return { previousTasks };
    },
    onError: (error, taskId, context) => {
      queryClient.setQueryData(['bullyTasks'], context.previousTasks);
      toast.error('Failed to submit task: ' + error.message, { id: 'submit-task' });
    },
    onSuccess: (data) => {
      toast.success('Task submitted! AI feedback: ' + data.feedback, { id: 'submit-task' });
      
      if (data.coinsAwarded > 0) {
        toast.success(`Earned ${data.coinsAwarded} coins!`);
      }
      
      setSelectedTask(null);
      setReportText('');
      setUploadedImages([]);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bullyTasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskCompletions'] });
    }
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const response = await base44.integrations.Core.UploadFile({ file });
      setUploadedImages(prev => [...prev, response.file_url]);
    }
  };

  const activeTasks = tasks.filter(t => t.status === 'pending');
  const submittedTasks = tasks.filter(t => t.status === 'submitted' || t.status === 'completed');

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="border-b border-zinc-800 p-6">
        <button
          onClick={() => navigate(createPageUrl('Home'))}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <p className="text-zinc-400 mt-1">Complete Bully AI assignments and earn rewards</p>
      </div>

      <div className="px-6 space-y-6 pt-6">
        {/* Active Tasks */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            Pending Tasks ({activeTasks.length})
          </h2>
          {activeTasks.length === 0 ? (
            <div className="bg-zinc-900 rounded-2xl p-6 text-center">
              <p className="text-zinc-400">No active tasks. Ask Bully AI for assignments!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-gradient-to-r ${DIFFICULTY_COLORS[task.difficulty]} p-1 rounded-2xl`}
                >
                  <div className="bg-zinc-900 rounded-[14px] p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-white font-bold text-lg">{task.task_description}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-zinc-800 px-2 py-1 rounded-lg text-zinc-300">
                            {task.difficulty}
                          </span>
                          <span className="text-xs bg-green-900/30 px-2 py-1 rounded-lg text-green-400">
                            +{task.reward_coins} coins
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-zinc-400">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      onClick={() => setSelectedTask(task)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      Report Completion
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Submitted Tasks */}
        {submittedTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Completed Tasks ({submittedTasks.length})
            </h2>
            <div className="space-y-4">
              {submittedTasks.map((task) => {
                const completion = completions.find(c => c.task_id === task.id);
                return (
                  <motion.div
                    key={task.id}
                    className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-white font-bold">{task.task_description}</p>
                        {completion?.ai_feedback && (
                          <p className="text-green-400 text-sm mt-2">✓ {completion.ai_feedback}</p>
                        )}
                      </div>
                      <span className="text-green-400 font-bold">+{task.reward_coins} coins</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Completion Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedTask(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-lg p-6"
            >
              <h3 className="text-xl font-bold mb-2">{selectedTask.task_description}</h3>
              <p className="text-zinc-400 text-sm mb-4">Show proof of completion</p>

              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Describe how you completed this task..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white text-sm mb-4 min-h-[100px]"
              />

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Upload proof (optional)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-zinc-400"
                />
                {uploadedImages.length > 0 && (
                  <p className="text-green-400 text-xs mt-2">{uploadedImages.length} image(s) uploaded</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setSelectedTask(null)}
                  variant="outline"
                  className="flex-1 border-zinc-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => submitMutation.mutate(selectedTask.id)}
                  disabled={!reportText.trim() || submitMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Proof'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Star, Filter, ChevronDown, Mail, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';

export default function AdminFeedback() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [filterStatus, setFilterStatus] = useState('new');
  const [filterType, setFilterType] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['adminFeedback', filterStatus, filterType],
    queryFn: async () => {
      if (!user?.role !== 'admin') return [];
      
      let query = {};
      if (filterStatus !== 'all') query.status = filterStatus;
      if (filterType !== 'all') query.feedback_type = filterType;
      
      const result = await base44.asServiceRole.entities.UserFeedback.filter(
        query,
        '-created_date',
        100
      );
      return result;
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ feedbackId, status, notes }) => {
      const response = await base44.asServiceRole.entities.UserFeedback.update(
        feedbackId,
        {
          status,
          admin_notes: notes
        }
      );
      return response;
    },
    onSuccess: () => {
      toast.success('Feedback updated');
      queryClient.invalidateQueries({ queryKey: ['adminFeedback'] });
      setSelectedFeedback(null);
      setAdminNotes('');
    },
  });

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-zinc-400">You need admin access to view this page.</p>
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            className="mt-4 bg-purple-600 hover:bg-purple-700"
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const stats = {
    total: feedbacks.length,
    new: feedbacks.filter(f => f.status === 'new').length,
    reviewed: feedbacks.filter(f => f.status === 'reviewed').length,
    inProgress: feedbacks.filter(f => f.status === 'in_progress').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length,
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'reviewed':
        return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-orange-400" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return null;
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-400';
    if (rating >= 3) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-pink-900/10" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold">Feedback Dashboard</h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center"
          >
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-zinc-500 text-xs">Total</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-4 text-center"
          >
            <p className="text-2xl font-bold text-yellow-400">{stats.new}</p>
            <p className="text-yellow-300/70 text-xs">New</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4 text-center"
          >
            <p className="text-2xl font-bold text-blue-400">{stats.reviewed}</p>
            <p className="text-blue-300/70 text-xs">Reviewed</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-orange-900/20 border border-orange-800/30 rounded-lg p-4 text-center"
          >
            <p className="text-2xl font-bold text-orange-400">{stats.inProgress}</p>
            <p className="text-orange-300/70 text-xs">In Progress</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-green-900/20 border border-green-800/30 rounded-lg p-4 text-center"
          >
            <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
            <p className="text-green-300/70 text-xs">Resolved</p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 bg-zinc-900 border-zinc-800 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="bug">Bug Reports</SelectItem>
              <SelectItem value="feature_request">Features</SelectItem>
              <SelectItem value="suggestion">Suggestions</SelectItem>
              <SelectItem value="compliment">Compliments</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Feedbacks List */}
        <div className="space-y-3">
          <AnimatePresence>
            {feedbacks.map((feedback, idx) => (
              <motion.div
                key={feedback.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  setSelectedFeedback(feedback);
                  setAdminNotes(feedback.admin_notes || '');
                }}
                className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-purple-500/50 cursor-pointer transition-all hover:bg-zinc-900/70"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(feedback.status)}
                      <span className="text-xs uppercase tracking-wider text-zinc-500">
                        {feedback.feedback_type.replace('_', ' ')}
                      </span>
                      <span className={`text-xs font-bold ${getRatingColor(feedback.rating)}`}>
                        {'★'.repeat(feedback.rating)}
                      </span>
                    </div>
                    <p className="text-white line-clamp-2 text-sm mb-2">{feedback.message}</p>
                    <div className="flex gap-2 flex-wrap">
                      {feedback.page_reported && (
                        <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">
                          {feedback.page_reported}
                        </span>
                      )}
                      {feedback.contact_info && (
                        <span className="text-xs bg-purple-900/30 px-2 py-1 rounded text-purple-300 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {feedback.contact_info}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-zinc-500">
                      {new Date(feedback.created_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Feedback Details</DialogTitle>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Type</p>
                  <p className="text-white font-bold capitalize">
                    {selectedFeedback.feedback_type.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Category</p>
                  <p className="text-white font-bold capitalize">
                    {selectedFeedback.category.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Rating</p>
                  <p className={`font-bold text-lg ${getRatingColor(selectedFeedback.rating)}`}>
                    {selectedFeedback.rating} / 5
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Status</p>
                  <Select 
                    value={selectedFeedback.status}
                    onValueChange={(status) => setSelectedFeedback({...selectedFeedback, status})}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <p className="text-zinc-500 text-xs mb-1">User Email</p>
                <p className="text-white">{selectedFeedback.created_by}</p>
              </div>

              {selectedFeedback.contact_info && (
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Contact Info</p>
                  <p className="text-white">{selectedFeedback.contact_info}</p>
                </div>
              )}

              {selectedFeedback.page_reported && (
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Related To</p>
                  <p className="text-white">{selectedFeedback.page_reported}</p>
                </div>
              )}

              <div>
                <p className="text-zinc-500 text-xs mb-1">Feedback</p>
                <p className="text-white bg-zinc-800/50 p-3 rounded text-sm">
                  {selectedFeedback.message}
                </p>
              </div>

              <div>
                <p className="text-zinc-500 text-xs mb-1">Admin Notes</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add your notes here..."
                  className="bg-zinc-800 border-zinc-700 text-white min-h-24"
                />
              </div>

              <Button
                onClick={() => updateMutation.mutate({
                  feedbackId: selectedFeedback.id,
                  status: selectedFeedback.status,
                  notes: adminNotes
                })}
                disabled={updateMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
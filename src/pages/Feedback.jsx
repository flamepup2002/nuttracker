import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Send, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

export default function Feedback() {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [category, setCategory] = useState('features');
  const [message, setMessage] = useState('');
  const [pageReported, setPageReported] = useState('');

  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('submitUserFeedback', {
        feedbackType,
        category,
        rating,
        message,
        pageReported
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Thank you! Your feedback has been submitted.');
      setTimeout(() => navigate(createPageUrl('Home')), 1500);
    },
    onError: (error) => {
      toast.error('Failed to submit feedback');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || rating === 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    submitMutation.mutate();
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
          <h1 className="text-lg font-bold">Send Feedback</h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="px-6 py-8 max-w-2xl mx-auto">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-zinc-400 text-sm">
            Your feedback helps us improve. Tell us what you think about the app.
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Rating */}
          <div>
            <label className="text-white font-bold text-sm mb-3 block">
              Rate Your Experience *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-all hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-zinc-700'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Type */}
          <div>
            <label className="text-white font-bold text-sm mb-2 block">
              Feedback Type *
            </label>
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="suggestion">Suggestion</SelectItem>
                <SelectItem value="compliment">Compliment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div>
            <label className="text-white font-bold text-sm mb-2 block">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ui_ux">UI/UX</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="features">Features</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Page/Feature */}
          <div>
            <label className="text-white font-bold text-sm mb-2 block">
              Related To (optional)
            </label>
            <Input
              value={pageReported}
              onChange={(e) => setPageReported(e.target.value)}
              placeholder="e.g., GoonerCam, Settings, Home..."
              className="bg-zinc-900 border-zinc-800 text-white"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-white font-bold text-sm mb-2 block">
              Your Feedback *
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind..."
              className="bg-zinc-900 border-zinc-800 text-white min-h-32 resize-none"
            />
            <p className="text-zinc-500 text-xs mt-2">
              {message.length} / 1000 characters
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </motion.form>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg"
        >
          <p className="text-zinc-400 text-xs">
            💡 <strong>Tip:</strong> Be as specific as possible. Include details about what you're experiencing or suggesting. This helps us improve faster!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
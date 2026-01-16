import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Play, Lock, DollarSign, AlertTriangle, Zap, Music, Film, BookOpen } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function PremiumFindom() {
  const navigate = useNavigate();
  const [selectedContent, setSelectedContent] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: contentList = [] } = useQuery({
    queryKey: ['premiumContent'],
    queryFn: () => base44.entities.PremiumFindomContent.list('-created_date'),
  });

  const { data: userPurchases = [] } = useQuery({
    queryKey: ['premiumPurchases'],
    queryFn: () => base44.entities.PremiumPurchase.list(),
  });

  const { data: paymentMethod } = useQuery({
    queryKey: ['paymentMethod'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getStripePaymentMethod');
      return response.data;
    },
    initialData: { hasPaymentMethod: false },
  });

  const purchaseMutation = useMutation({
    mutationFn: async (content) => {
      if (!paymentMethod?.hasPaymentMethod) {
        toast.error('Please add a payment method first');
        return;
      }

      const response = await base44.functions.invoke('processPremiumFindomPayment', {
        contentId: content.id,
        contentTitle: content.title,
        price: content.price,
        stripePaymentMethodId: paymentMethod.paymentMethod.id,
      });

      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Purchase successful!');
      setShowPaymentModal(false);
      setSelectedContent(null);
    },
    onError: (error) => {
      toast.error('Payment failed: ' + error.message);
    },
  });

  const contentTypeConfig = {
    audio: { icon: Music, label: 'Audio' },
    video: { icon: Film, label: 'Video' },
    guide: { icon: BookOpen, label: 'Guide' },
    custom_session: { icon: Zap, label: 'Session' },
  };

  const intensityColor = {
    mild: 'from-blue-500 to-cyan-500',
    moderate: 'from-purple-500 to-pink-500',
    intense: 'from-orange-500 to-red-500',
    extreme: 'from-red-600 to-black',
  };

  const isPurchased = (contentId) => {
    return userPurchases.some(p => p.content_id === contentId);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-900/20 via-purple-900/10 to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold">Premium Findom</h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pt-6 space-y-4">
        {/* Warning Banner */}
        <div className="bg-orange-900/30 border border-orange-500/50 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-orange-400 font-bold text-sm">Premium Content</p>
            <p className="text-orange-400/80 text-xs mt-1">
              High-quality exclusive findom content. One-time purchases with lifetime access.
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="space-y-3">
          {contentList.length === 0 ? (
            <div className="text-center py-12">
              <Lock className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No premium content available yet</p>
            </div>
          ) : (
            contentList.map((content) => {
              const TypeIcon = contentTypeConfig[content.content_type]?.icon || Zap;
              const isPurchasedContent = isPurchased(content.id);

              return (
                <motion.div
                  key={content.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative overflow-hidden rounded-2xl border p-5 cursor-pointer transition-all ${
                    isPurchasedContent
                      ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/20 border-green-500/30'
                      : 'bg-zinc-900/50 border-zinc-800 hover:border-pink-500/50'
                  }`}
                  onClick={() => !isPurchasedContent && setSelectedContent(content)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${
                      intensityColor[content.intensity_level]
                    } flex items-center justify-center flex-shrink-0`}>
                      <TypeIcon className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-white font-bold">{content.title}</h3>
                          <p className="text-zinc-400 text-sm mt-1">{content.description}</p>
                        </div>
                        {isPurchasedContent && (
                          <span className="text-green-400 text-xs font-bold px-2 py-1 bg-green-500/20 rounded-lg flex-shrink-0">
                            Purchased
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400">
                        <span>{contentTypeConfig[content.content_type]?.label}</span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {content.intensity_level}
                        </span>
                        {content.duration_minutes && (
                          <span>{content.duration_minutes} min</span>
                        )}
                      </div>

                      {!isPurchasedContent && (
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-green-400 font-bold text-lg">${content.price}</span>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContent(content);
                              setShowPaymentModal(true);
                            }}
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Purchase
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedContent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 z-50 p-6"
            >
              <div className="max-w-md mx-auto bg-zinc-900/95 rounded-3xl border border-zinc-800 p-6 backdrop-blur-xl">
                <h3 className="text-xl font-bold text-white mb-2">{selectedContent.title}</h3>
                <p className="text-zinc-400 text-sm mb-4">{selectedContent.description}</p>

                <div className="bg-zinc-800/50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-zinc-400">Price</span>
                    <span className="text-green-400 font-bold text-lg">${selectedContent.price}</span>
                  </div>

                  {!paymentMethod?.hasPaymentMethod && (
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
                      <p className="text-yellow-400 text-xs font-bold">Payment method required</p>
                      <p className="text-yellow-500/70 text-xs mt-1">Add a payment method in Settings first</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    disabled={!paymentMethod?.hasPaymentMethod || purchaseMutation.isPending}
                    onClick={() => purchaseMutation.mutate(selectedContent)}
                  >
                    {purchaseMutation.isPending ? 'Processing...' : 'Confirm Purchase'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
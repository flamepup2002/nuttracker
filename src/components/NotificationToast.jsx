import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const NOTIFICATION_CONFIG = {
  payment_due: { icon: '💳', color: 'from-blue-500 to-blue-600' },
  payment_overdue: { icon: '⚠️', color: 'from-yellow-500 to-orange-500' },
  penalty_applied: { icon: '🚨', color: 'from-red-500 to-red-600' },
  collateral_liquidation: { icon: '🔴', color: 'from-red-700 to-red-900' },
  contract_accepted: { icon: '✅', color: 'from-green-500 to-green-600' },
  contract_cancelled: { icon: '🚫', color: 'from-gray-500 to-gray-600' },
  new_contract_offer: { icon: '📋', color: 'from-purple-500 to-purple-600' }
};

export default function NotificationToast() {
  const navigate = useNavigate();
  const [displayedNotifications, setDisplayedNotifications] = useState(new Set());
  const [currentToast, setCurrentToast] = useState(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date', 20),
    refetchInterval: 10000, // Poll every 10 seconds
  });

  useEffect(() => {
    // Find the newest unread notification that hasn't been displayed
    const newNotification = notifications.find(
      n => !n.is_read && !displayedNotifications.has(n.id)
    );

    if (newNotification) {
      setCurrentToast(newNotification);
      setDisplayedNotifications(prev => new Set([...prev, newNotification.id]));

      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        setCurrentToast(null);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [notifications, displayedNotifications]);

  const handleClick = () => {
    if (currentToast) {
      base44.entities.Notification.update(currentToast.id, { is_read: true });
      if (currentToast.action_url) {
        navigate(createPageUrl(currentToast.action_url));
      } else {
        navigate(createPageUrl('Notifications'));
      }
      setCurrentToast(null);
    }
  };

  const handleDismiss = () => {
    setCurrentToast(null);
  };

  return (
    <AnimatePresence>
      {currentToast && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div
              className={`h-1 bg-gradient-to-r ${
                NOTIFICATION_CONFIG[currentToast.type]?.color || 'from-purple-500 to-purple-600'
              }`}
            />
            <div className="p-4 flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                  NOTIFICATION_CONFIG[currentToast.type]?.color || 'from-purple-500 to-purple-600'
                } flex items-center justify-center flex-shrink-0`}
              >
                <span className="text-xl">
                  {NOTIFICATION_CONFIG[currentToast.type]?.icon || '📋'}
                </span>
              </div>
              
              <button
                onClick={handleClick}
                className="flex-1 text-left"
              >
                <h4 className="text-white font-bold text-sm mb-1">{currentToast.title}</h4>
                <p className="text-zinc-300 text-xs">{currentToast.message}</p>
              </button>

              <button
                onClick={handleDismiss}
                className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
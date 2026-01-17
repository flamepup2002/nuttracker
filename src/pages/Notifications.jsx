import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, Check, Trash2, Filter, Settings, Archive } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const NOTIFICATION_CONFIG = {
  payment_due: { icon: '💳', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-900/20', borderColor: 'border-blue-500/30' },
  payment_overdue: { icon: '⚠️', color: 'from-yellow-500 to-orange-500', bgColor: 'bg-orange-900/20', borderColor: 'border-orange-500/30' },
  penalty_applied: { icon: '🚨', color: 'from-red-500 to-red-600', bgColor: 'bg-red-900/20', borderColor: 'border-red-500/30' },
  collateral_liquidation: { icon: '🔴', color: 'from-red-700 to-red-900', bgColor: 'bg-red-900/30', borderColor: 'border-red-600/50' },
  contract_accepted: { icon: '✅', color: 'from-green-500 to-green-600', bgColor: 'bg-green-900/20', borderColor: 'border-green-500/30' },
  contract_cancelled: { icon: '🚫', color: 'from-gray-500 to-gray-600', bgColor: 'bg-gray-900/20', borderColor: 'border-gray-500/30' },
  new_contract_offer: { icon: '📋', color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-900/20', borderColor: 'border-purple-500/30' }
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-zinc-500' },
  medium: { label: 'Medium', color: 'text-blue-400' },
  high: { label: 'High', color: 'text-orange-400' },
  urgent: { label: 'Urgent', color: 'text-red-400' }
};

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all'); // all, unread, read

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date', 100),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(unreadNotifications.map(n => 
        base44.entities.Notification.update(n.id, { is_read: true })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    },
  });

  const deleteAllReadMutation = useMutation({
    mutationFn: async () => {
      const readNotifications = notifications.filter(n => n.is_read);
      await Promise.all(readNotifications.map(n => 
        base44.entities.Notification.delete(n.id)
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All read notifications deleted');
    },
  });

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.action_url) {
      navigate(createPageUrl(notification.action_url));
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            <h1 className="text-lg font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={() => navigate(createPageUrl('NotificationPreferences'))}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-6 pb-24 pt-6 space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-purple-600' : 'border-zinc-700'}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
              className={filter === 'unread' ? 'bg-purple-600' : 'border-zinc-700'}
            >
              Unread ({unreadCount})
            </Button>
            <Button
              variant={filter === 'read' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('read')}
              className={filter === 'read' ? 'bg-purple-600' : 'border-zinc-700'}
            >
              Read
            </Button>
          </div>

          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-purple-400"
              >
                <Check className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.some(n => n.is_read) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteAllReadMutation.mutate()}
                disabled={deleteAllReadMutation.isPending}
                className="text-red-400"
              >
                <Archive className="w-4 h-4 mr-1" />
                Clear read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="text-center py-12 text-zinc-500">Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-12 text-center"
          >
            <Bell className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No notifications</p>
            <p className="text-zinc-500 text-sm mt-1">
              {filter === 'unread' ? "You're all caught up!" : 'Notifications will appear here'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification, idx) => {
              const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.new_contract_offer;
              const priorityConfig = PRIORITY_CONFIG[notification.priority];

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`relative rounded-2xl p-4 border ${config.bgColor} ${config.borderColor} ${
                    !notification.is_read ? 'border-l-4' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-xl">{config.icon}</span>
                    </div>
                    
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-white font-bold">{notification.title}</h3>
                        <span className={`text-xs ${priorityConfig.color} font-medium`}>
                          {priorityConfig.label}
                        </span>
                      </div>
                      <p className="text-zinc-300 text-sm mb-2">{notification.message}</p>
                      <p className="text-zinc-500 text-xs">
                        {new Date(notification.created_date).toLocaleString()}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotificationMutation.mutate(notification.id);
                      }}
                      className="text-zinc-500 hover:text-red-400 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {!notification.is_read && (
                    <div className="absolute top-4 right-12 w-2 h-2 bg-purple-500 rounded-full" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
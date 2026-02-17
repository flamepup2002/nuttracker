import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import PullToRefresh from '@/components/PullToRefresh';
import { 
  ArrowLeft, Droplet, X, Ban, DollarSign, 
  Calendar, Activity, Clock, Filter, ChevronDown, Trash2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const orgasmTypeConfig = {
  cumshot: { icon: Droplet, color: 'from-blue-500 to-cyan-400', label: 'Cumshot', bg: 'bg-blue-500/20' },
  ruined: { icon: X, color: 'from-orange-500 to-red-500', label: 'Ruined', bg: 'bg-orange-500/20' },
  denied: { icon: Ban, color: 'from-purple-500 to-pink-500', label: 'Denied', bg: 'bg-purple-500/20' },
  cashgasm: { icon: DollarSign, color: 'from-green-400 to-emerald-500', label: 'Cashgasm', bg: 'bg-green-500/20' },
};

export default function History() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('all');

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['orgasms'] }),
      queryClient.invalidateQueries({ queryKey: ['sessions'] }),
    ]);
  };

  const { data: orgasms = [], isLoading } = useQuery({
    queryKey: ['orgasms'],
    queryFn: () => base44.entities.Orgasm.list('-created_date', 200),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-created_date', 50),
  });

  const filteredOrgasms = orgasms.filter(o => {
    const typeMatch = filter === 'all' || o.type === filter;
    
    let timeMatch = true;
    if (timeRange !== 'all') {
      const created = new Date(o.created_date);
      const now = new Date();
      if (timeRange === 'today') {
        timeMatch = created.toDateString() === now.toDateString();
      } else if (timeRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        timeMatch = created > weekAgo;
      } else if (timeRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        timeMatch = created > monthAgo;
      }
    }
    
    return typeMatch && timeMatch;
  });

  const groupedByDate = filteredOrgasms.reduce((groups, orgasm) => {
    const date = new Date(orgasm.created_date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(orgasm);
    return groups;
  }, {});

  const stats = {
    total: filteredOrgasms.length,
    totalCost: filteredOrgasms.reduce((sum, o) => sum + (o.cost || 0), 0),
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Orgasm.delete(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['orgasms'] });
      const previousOrgasms = queryClient.getQueryData(['orgasms']);
      
      // Optimistically remove from UI
      queryClient.setQueryData(['orgasms'], (old = []) => 
        old.filter(o => o.id !== deletedId)
      );
      
      return { previousOrgasms };
    },
    onError: (err, deletedId, context) => {
      queryClient.setQueryData(['orgasms'], context.previousOrgasms);
      toast.error('Failed to delete');
    },
    onSuccess: () => {
      toast.success('Orgasm deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orgasms'] });
    },
  });

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirm('Delete this entry?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-pink-400" />
            History
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 space-y-4">
        <Tabs defaultValue="all" onValueChange={setFilter}>
          <TabsList className="w-full bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="cumshot" className="flex-1">
              <Droplet className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="ruined" className="flex-1">
              <X className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="denied" className="flex-1">
              <Ban className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="cashgasm" className="flex-1">
              <DollarSign className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1 flex items-center justify-end gap-4 text-sm">
            <span className="text-zinc-400">{stats.total} total</span>
            {stats.totalCost > 0 && (
              <span className="text-green-400 font-bold">${stats.totalCost.toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="px-6 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
          </div>
        ) : Object.keys(groupedByDate).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedByDate).map(([date, dateOrgasms]) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full bg-pink-500" />
                  <span className="text-zinc-400 text-sm font-medium">
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <span className="text-zinc-600 text-xs">
                    {dateOrgasms.length} {dateOrgasms.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                <div className="space-y-2">
                  {dateOrgasms.map((orgasm, idx) => {
                    const config = orgasmTypeConfig[orgasm.type];
                    return (
                      <motion.div
                        key={orgasm.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                            <config.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium">{config.label}</p>
                              {orgasm.is_findom && (
                                <Badge variant="outline" className="text-green-400 border-green-500/30 text-xs">
                                  Findom
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-zinc-500 text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(orgasm.created_date).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                              {orgasm.heart_rate_at_time && (
                                <span className="text-red-400 text-xs flex items-center gap-1">
                                  <Activity className="w-3 h-3" />
                                  {orgasm.heart_rate_at_time} BPM
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {orgasm.cost > 0 && (
                              <span className="text-green-400 font-bold text-lg">
                                ${orgasm.cost.toFixed(2)}
                              </span>
                            )}
                            <button
                              onClick={(e) => handleDelete(e, orgasm.id)}
                              className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {orgasm.notes && (
                          <p className="text-zinc-400 text-sm mt-3 pl-13">{orgasm.notes}</p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-400">No entries found</p>
            <p className="text-zinc-600 text-sm mt-1">
              {filter !== 'all' || timeRange !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Start tracking to see your history'}
            </p>
          </div>
        )}
      </div>
      </div>
    </PullToRefresh>
  );
}
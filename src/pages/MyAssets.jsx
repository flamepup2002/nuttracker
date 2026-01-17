import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  ArrowLeft, Plus, Car, Home as HomeIcon, Sparkles, DollarSign, 
  Trash2, Edit, Upload, X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ASSET_TYPES = [
  { value: 'car', label: 'Car/Vehicle', icon: '🚗' },
  { value: 'house', label: 'House/Property', icon: '🏠' },
  { value: 'jewelry', label: 'Jewelry', icon: '💎' },
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'crypto', label: 'Cryptocurrency', icon: '₿' },
  { value: 'savings', label: 'Savings Account', icon: '💰' },
  { value: 'retirement_accounts', label: 'Retirement Accounts', icon: '📊' },
  { value: 'other', label: 'Other', icon: '📦' }
];

export default function MyAssets() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({
    asset_type: 'car',
    name: '',
    description: '',
    estimated_value: '',
    purchase_date: ''
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['userAssets'],
    queryFn: () => base44.entities.UserAsset.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.UserAsset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAssets'] });
      toast.success('Asset added!');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserAsset.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAssets'] });
      toast.success('Asset updated!');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UserAsset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAssets'] });
      toast.success('Asset deleted');
    },
  });

  const resetForm = () => {
    setFormData({
      asset_type: 'car',
      name: '',
      description: '',
      estimated_value: '',
      purchase_date: ''
    });
    setShowForm(false);
    setEditingAsset(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      estimated_value: parseFloat(formData.estimated_value)
    };

    if (editingAsset) {
      updateMutation.mutate({ id: editingAsset.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      asset_type: asset.asset_type,
      name: asset.name,
      description: asset.description || '',
      estimated_value: asset.estimated_value.toString(),
      purchase_date: asset.purchase_date || ''
    });
    setShowForm(true);
  };

  const totalValue = assets.reduce((sum, asset) => sum + asset.estimated_value, 0);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            My Assets
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="px-6 pb-24 space-y-6 pt-6">
        {/* Total Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6"
        >
          <p className="text-white/80 text-sm mb-1">Total Asset Value</p>
          <p className="text-white text-4xl font-bold">${totalValue.toLocaleString()}</p>
          <p className="text-white/60 text-xs mt-2">{assets.length} assets tracked</p>
        </motion.div>

        {/* Add Button */}
        <Button
          onClick={() => setShowForm(!showForm)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Asset
        </Button>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-white font-bold">{editingAsset ? 'Edit Asset' : 'Add Asset'}</h3>
                
                <div>
                  <Label className="text-zinc-400">Asset Type</Label>
                  <Select
                    value={formData.asset_type}
                    onValueChange={(value) => setFormData({ ...formData, asset_type: value })}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      {ASSET_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-white">
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-zinc-400">Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., 2020 Tesla Model 3"
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    required
                  />
                </div>

                <div>
                  <Label className="text-zinc-400">Estimated Value ($) *</Label>
                  <Input
                    type="number"
                    value={formData.estimated_value}
                    onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                    placeholder="0.00"
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <Label className="text-zinc-400">Purchase Date</Label>
                  <Input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  />
                </div>

                <div>
                  <Label className="text-zinc-400">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Additional details..."
                    className="bg-zinc-800 border-zinc-700 text-white mt-2 min-h-[80px]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1 border-zinc-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    {editingAsset ? 'Update' : 'Add'} Asset
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assets List */}
        <div className="space-y-3">
          {assets.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800">
              <Sparkles className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No assets tracked yet</p>
              <p className="text-zinc-600 text-sm mt-1">Add your first asset to get started</p>
            </div>
          ) : (
            assets.map((asset, idx) => {
              const assetType = ASSET_TYPES.find(t => t.value === asset.asset_type);
              
              return (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{assetType?.icon}</span>
                      <div>
                        <h3 className="text-white font-bold">{asset.name}</h3>
                        <p className="text-zinc-500 text-xs">{assetType?.label}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(asset)}
                        className="text-zinc-400 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(asset.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {asset.description && (
                    <p className="text-zinc-400 text-sm mb-3">{asset.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-zinc-800/50 rounded-lg p-2">
                      <p className="text-zinc-500 text-xs">Value</p>
                      <p className="text-white font-bold">${asset.estimated_value.toLocaleString()}</p>
                    </div>
                    {asset.purchase_date && (
                      <div className="bg-zinc-800/50 rounded-lg p-2">
                        <p className="text-zinc-500 text-xs">Purchased</p>
                        <p className="text-white font-bold text-sm">
                          {new Date(asset.purchase_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {asset.is_pledged_as_collateral && (
                    <div className="mt-3 bg-orange-900/30 border border-orange-600/30 rounded-lg p-2">
                      <p className="text-orange-400 text-xs font-bold">
                        ⚠️ Pledged as Collateral
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
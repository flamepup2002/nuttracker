import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  ArrowLeft, Palette, Type, Sparkles, Check, Lock, 
  Crown, Star, Award
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const THEMES = [
  { name: 'default', label: 'Default', colors: 'from-pink-500 to-purple-500', locked: false },
  { name: 'midnight', label: 'Midnight Blue', colors: 'from-blue-600 to-indigo-700', locked: false },
  { name: 'crimson', label: 'Crimson Tide', colors: 'from-red-600 to-rose-700', locked: true },
  { name: 'emerald', label: 'Emerald Dream', colors: 'from-green-600 to-emerald-700', locked: true },
  { name: 'gold', label: 'Golden Hour', colors: 'from-yellow-500 to-amber-600', locked: true },
  { name: 'neon', label: 'Neon Nights', colors: 'from-cyan-500 to-purple-600', locked: true },
];

const AURAS = [
  { name: 'none', label: 'No Aura', effect: 'none', locked: false },
  { name: 'purple_glow', label: 'Purple Glow', effect: 'shadow-lg shadow-purple-500/50', locked: true },
  { name: 'gold_radiance', label: 'Gold Radiance', effect: 'shadow-xl shadow-yellow-500/50', locked: true },
  { name: 'red_chains', label: 'Red Chains', effect: 'shadow-lg shadow-red-600/50', locked: true },
  { name: 'pink_sparkle', label: 'Pink Sparkle', effect: 'shadow-lg shadow-pink-500/50', locked: true },
];

export default function ProfileCustomization() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [selectedTitle, setSelectedTitle] = useState('');
  const [selectedAura, setSelectedAura] = useState('none');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Profile customization updated!');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  useEffect(() => {
    if (user) {
      setSelectedTheme(user.active_theme || 'default');
      setSelectedTitle(user.profile_title || '');
      setSelectedAura(user.active_aura || 'none');
    }
  }, [user]);

  const unlockedThemes = user?.unlocked_themes || [];
  const unlockedTitles = user?.unlocked_titles || [];
  const unlockedAuras = user?.unlocked_auras || [];

  const handleSave = () => {
    updateProfileMutation.mutate({
      active_theme: selectedTheme,
      profile_title: selectedTitle,
      active_aura: selectedAura,
    });
  };

  const hasChanges = 
    selectedTheme !== (user?.active_theme || 'default') ||
    selectedTitle !== (user?.profile_title || '') ||
    selectedAura !== (user?.active_aura || 'none');

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-black" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(createPageUrl('Profile'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Customize Profile
          </h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="px-6 pt-6 space-y-6">
        {/* Theme Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6"
        >
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" />
            Theme
          </h2>
          <p className="text-zinc-400 text-sm mb-4">
            Unlock themes by completing achievements
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((theme) => {
              const isLocked = theme.locked && !unlockedThemes.includes(theme.name) && theme.name !== 'default' && theme.name !== 'midnight';
              const isSelected = selectedTheme === theme.name;

              return (
                <motion.button
                  key={theme.name}
                  onClick={() => !isLocked && setSelectedTheme(theme.name)}
                  disabled={isLocked}
                  whileHover={{ scale: isLocked ? 1 : 1.02 }}
                  whileTap={{ scale: isLocked ? 1 : 0.98 }}
                  className={`relative overflow-hidden rounded-xl p-4 border-2 transition-all ${
                    isSelected
                      ? 'border-white bg-zinc-800'
                      : isLocked
                      ? 'border-zinc-800 bg-zinc-900/50 opacity-50 cursor-not-allowed'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className={`h-12 rounded-lg bg-gradient-to-r ${theme.colors} mb-3`} />
                  <p className="text-white font-medium text-sm">{theme.label}</p>
                  
                  {isLocked && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-4 h-4 text-zinc-500" />
                    </div>
                  )}
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                      <Check className="w-3 h-3 text-black" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Title Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6"
        >
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Type className="w-5 h-5 text-yellow-400" />
            Profile Title
          </h2>
          <p className="text-zinc-400 text-sm mb-4">
            Earn titles from achievements
          </p>
          
          {unlockedTitles.length > 0 ? (
            <div className="space-y-2">
              <button
                onClick={() => setSelectedTitle('')}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  selectedTitle === ''
                    ? 'border-white bg-zinc-800 text-white'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="italic">No title</span>
              </button>
              
              {unlockedTitles.map((title) => (
                <button
                  key={title}
                  onClick={() => setSelectedTitle(title)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    selectedTitle === title
                      ? 'border-white bg-zinc-800 text-white'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{title}</span>
                    {selectedTitle === title && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Crown className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No titles unlocked yet</p>
              <p className="text-zinc-600 text-xs mt-1">Complete achievements to earn titles</p>
            </div>
          )}
        </motion.div>

        {/* Aura Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6"
        >
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-pink-400" />
            Profile Aura
          </h2>
          <p className="text-zinc-400 text-sm mb-4">
            Add a visual effect to your profile avatar
          </p>
          
          <div className="space-y-3">
            {AURAS.map((aura) => {
              const isLocked = aura.locked && !unlockedAuras.includes(aura.name) && aura.name !== 'none';
              const isSelected = selectedAura === aura.name;

              return (
                <motion.button
                  key={aura.name}
                  onClick={() => !isLocked && setSelectedAura(aura.name)}
                  disabled={isLocked}
                  whileHover={{ scale: isLocked ? 1 : 1.01 }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-white bg-zinc-800'
                      : isLocked
                      ? 'border-zinc-800 bg-zinc-900/50 opacity-50 cursor-not-allowed'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-zinc-700 ${aura.effect}`} />
                    <span className="text-white font-medium">{aura.label}</span>
                  </div>
                  
                  {isLocked && <Lock className="w-4 h-4 text-zinc-500" />}
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-2 border-purple-500/30 rounded-2xl p-6"
        >
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" />
            Preview
          </h2>
          
          <div className="text-center">
            <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-r ${
              THEMES.find(t => t.name === selectedTheme)?.colors || 'from-pink-500 to-purple-500'
            } flex items-center justify-center mb-3 ${
              AURAS.find(a => a.name === selectedAura)?.effect || ''
            }`}>
              <span className="text-2xl font-bold text-white">
                {user?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            
            {selectedTitle && (
              <Badge className="bg-yellow-600/30 text-yellow-300 border-yellow-600/30 mb-2">
                {selectedTitle}
              </Badge>
            )}
            
            <p className="text-white font-bold">{user?.full_name || 'User'}</p>
          </div>
        </motion.div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent"
        >
          <Button
            onClick={handleSave}
            disabled={updateProfileMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 text-base font-bold"
          >
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Customization'}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
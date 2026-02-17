import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AchievementBadge from '@/components/AchievementBadge';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Save, Mail, Phone, MapPin, Calendar, Heart, FileText, DollarSign, TrendingUp, Package, Trophy, Sparkles, Settings, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  const [profile, setProfile] = useState({
    full_name: '',
    bio: '',
    gender: '',
    sexual_preference: '',
    address: '',
    birth_date: '',
    phone: '',
    findom_intensity_preference: '',
  });
  const [customGender, setCustomGender] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch activity stats
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.DebtContract.list(),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list(),
  });

  const { data: assetListings = [] } = useQuery({
    queryKey: ['assetListings'],
    queryFn: () => base44.entities.AssetListing.list(),
  });

  const { data: houseListings = [] } = useQuery({
    queryKey: ['houseListings'],
    queryFn: () => base44.entities.HouseListing.list(),
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => base44.entities.UserAchievement.list('-unlocked_at', 100),
  });

  const showcasedCount = achievements.filter(a => a.is_showcased).length;

  const activityStats = {
    totalContracts: contracts.length,
    activeContracts: contracts.filter(c => c.is_accepted && !c.cancelled_at).length,
    totalPaid: payments.reduce((sum, p) => sum + (p.status === 'succeeded' ? p.amount : 0), 0),
    assetsListed: assetListings.length + houseListings.length,
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setProfile({
          full_name: userData.full_name || '',
          bio: userData.bio || '',
          gender: userData.gender || '',
          sexual_preference: userData.sexual_preference || '',
          address: userData.address || '',
          birth_date: userData.birth_date || '',
          phone: userData.phone || '',
          findom_intensity_preference: userData.findom_intensity_preference || '',
        });
        
        // Check if gender is a custom one
        const standardGenders = ['male', 'female', 'non-binary', 'genderfluid', 'agender', 'prefer_not_to_say'];
        if (userData.gender && !standardGenders.includes(userData.gender)) {
          setCustomGender(true);
        }
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      return base44.auth.updateMe(data);
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      // Call backend function to delete account
      return await base44.functions.invoke('deleteAccount');
    },
    onSuccess: () => {
      toast.success('Account deleted successfully');
      // Logout and redirect
      base44.auth.logout();
    },
    onError: (error) => {
      toast.error('Failed to delete account: ' + error.message);
    },
  });

  const handleChange = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate(profile);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const sexualPreferences = [
    { value: 'straight', label: 'Straight' },
    { value: 'gay', label: 'Gay' },
    { value: 'lesbian', label: 'Lesbian' },
    { value: 'bisexual', label: 'Bisexual' },
    { value: 'pansexual', label: 'Pansexual' },
    { value: 'asexual', label: 'Asexual' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-purple-400" />
            Profile
          </h1>
          <Link to={createPageUrl('ProfileCustomization')}>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <Sparkles className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-24 space-y-6 mt-6">
        {/* Profile Picture with Aura */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-20 blur-2xl" />
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center relative z-10">
              <User className="w-12 h-12 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Achievements */}
         {achievements.length > 0 && (
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/30 rounded-2xl p-6"
           >
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-white font-bold flex items-center gap-2">
                 <Trophy className="w-5 h-5 text-yellow-400" />
                 Achievements ({achievements.length})
               </h3>
               <Link to={createPageUrl('Achievements')}>
                 <Button
                   size="sm"
                   variant="ghost"
                   className="text-yellow-400 hover:text-yellow-300"
                 >
                   View All
                 </Button>
               </Link>
             </div>
             
             {/* Showcased Achievements */}
             {showcasedCount > 0 && (
               <div className="mb-6">
                 <p className="text-zinc-400 text-xs mb-2">★ Showcased</p>
                 <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                   {achievements.filter(a => a.is_showcased).map((achievement) => (
                     <AchievementBadge
                       key={achievement.id}
                       achievement={achievement}
                       isShowcased={true}
                     />
                   ))}
                 </div>
               </div>
             )}
             
             {/* Recent Achievements */}
             <div>
               <p className="text-zinc-400 text-xs mb-2">Recent</p>
               <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                 {achievements.slice(0, 6).map((achievement) => (
                   <AchievementBadge
                     key={achievement.id}
                     achievement={achievement}
                     isShowcased={achievement.is_showcased}
                   />
                 ))}
               </div>
             </div>
           </motion.div>
         )}

        {/* Activity Summary */}
         <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500/30 rounded-2xl p-6"
        >
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Activity Summary
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <p className="text-zinc-400 text-xs">Total Contracts</p>
              </div>
              <p className="text-white font-bold text-2xl">{activityStats.totalContracts}</p>
              <p className="text-zinc-500 text-xs mt-1">{activityStats.activeContracts} active</p>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <p className="text-zinc-400 text-xs">Total Paid</p>
              </div>
              <p className="text-white font-bold text-2xl">${activityStats.totalPaid.toFixed(0)}</p>
              <p className="text-zinc-500 text-xs mt-1">from {payments.length} payments</p>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-orange-400" />
                <p className="text-zinc-400 text-xs">Assets Listed</p>
              </div>
              <p className="text-white font-bold text-2xl">{activityStats.assetsListed}</p>
              <p className="text-zinc-500 text-xs mt-1">for auction</p>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-pink-400" />
                <p className="text-zinc-400 text-xs">Member Since</p>
              </div>
              <p className="text-white font-bold text-lg">
                {user?.created_date ? new Date(user.created_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-4"
        >
          <h3 className="text-white font-bold mb-4">Basic Information</h3>

          <div>
            <Label className="text-zinc-400 text-sm mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name
            </Label>
            <Input
              value={profile.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              placeholder="John Doe"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div>
            <Label className="text-zinc-400 text-sm mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-zinc-800/50 border-zinc-700 text-zinc-500"
            />
            <p className="text-zinc-600 text-xs mt-1">Email cannot be changed</p>
          </div>

          <div>
            <Label className="text-zinc-400 text-sm mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </Label>
            <Input
              type="tel"
              inputMode="tel"
              value={profile.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div>
            <Label className="text-zinc-400 text-sm mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Birth Date
            </Label>
            <Input
              type="date"
              value={profile.birth_date}
              onChange={(e) => handleChange('birth_date', e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
        </motion.div>

        {/* Address */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-4"
        >
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-zinc-400" />
            Address
          </h3>

          <div>
            <Label className="text-zinc-400 text-sm mb-2">Home Address</Label>
            <Textarea
              value={profile.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="123 Main St, City, State, ZIP"
              className="bg-zinc-800 border-zinc-700 text-white h-20"
            />
            <p className="text-zinc-600 text-xs mt-1">
              Required for unethical mode collateral agreement
            </p>
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 space-y-4"
        >
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-zinc-400" />
            Preferences
          </h3>

          <div>
            <Label className="text-zinc-400 text-sm mb-2">Gender Identity</Label>
            {!customGender ? (
              <Select 
                value={profile.gender} 
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setCustomGender(true);
                    handleChange('gender', '');
                  } else {
                    handleChange('gender', value);
                  }
                }}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="genderfluid">Genderfluid</SelectItem>
                  <SelectItem value="agender">Agender</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2">
                <Input
                  value={profile.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  placeholder="e.g., pup, puppy, kitty, mutt, etc."
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCustomGender(false);
                    handleChange('gender', '');
                  }}
                  className="text-zinc-400 hover:text-white text-xs"
                >
                  Back to standard options
                </Button>
              </div>
            )}
          </div>

          <div>
            <Label className="text-zinc-400 text-sm mb-2">Sexual Orientation</Label>
            <Select value={profile.sexual_preference} onValueChange={(value) => handleChange('sexual_preference', value)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select your orientation" />
              </SelectTrigger>
              <SelectContent>
                {sexualPreferences.map(pref => (
                  <SelectItem key={pref.value} value={pref.value}>
                    {pref.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-zinc-400 text-sm mb-2">Bio</Label>
            <Textarea
              value={profile.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              className="bg-zinc-800 border-zinc-700 text-white h-32"
            />
          </div>

          <div>
            <Label className="text-zinc-400 text-sm mb-2">Findom Intensity Preference</Label>
            <Select 
              value={profile.findom_intensity_preference} 
              onValueChange={(value) => handleChange('findom_intensity_preference', value)}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select your preferred intensity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mild">Mild - Light financial play</SelectItem>
                <SelectItem value="moderate">Moderate - Balanced experience</SelectItem>
                <SelectItem value="intense">Intense - Serious commitment</SelectItem>
                <SelectItem value="extreme">Extreme - Maximum intensity</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-zinc-600 text-xs mt-1">
              This helps AI suggest contracts matching your preference
            </p>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-red-900/20 border-2 border-red-500/50 rounded-2xl p-6"
        >
          <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h3>
          <p className="text-zinc-400 text-sm mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="border-red-800 text-red-400 hover:bg-red-900/30"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-900 border-zinc-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">
                  This action cannot be undone. This will permanently delete your account
                  and remove all your data from our servers including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All sessions and orgasm logs</li>
                    <li>Payment history and contracts</li>
                    <li>Achievements and progress</li>
                    <li>Profile information</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteAccountMutation.mutate()}
                  disabled={deleteAccountMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>

        {/* Save Button */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-6 right-6"
          >
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white py-6 text-lg font-bold rounded-2xl shadow-lg shadow-pink-500/30"
            >
              <Save className="w-5 h-5 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      feature, 
      sessionDuration = 0, 
      engagementLevel = 50, 
      interactions = 1,
      featureData = {} 
    } = await req.json();

    // Track analytics
    const analytics = await base44.entities.UserAnalytics.create({
      feature: feature,
      session_duration_seconds: sessionDuration,
      engagement_level: Math.min(100, engagementLevel),
      timestamp: new Date().toISOString(),
      interactions_count: interactions,
      feature_specific_data: featureData
    });

    // Check for achievements based on analytics
    const allAnalytics = await base44.entities.UserAnalytics.list('-created_date', 1000);
    const userAnalytics = allAnalytics.filter(a => a.created_by === user.email);

    // Calculate metrics for achievements
    const findomSessions = userAnalytics.filter(a => a.feature === 'findom_session').length;
    const goonSessions = userAnalytics.filter(a => a.feature === 'goon_session').length;
    const chatInteractions = userAnalytics.filter(a => a.feature === 'bully_chat').length;
    const totalTimeMinutes = userAnalytics.reduce((sum, a) => sum + (a.session_duration_seconds || 0), 0) / 60;

    // Award relevant achievements
    const achievementsToAward = [];

    if (goonSessions >= 50) achievementsToAward.push({
      id: 'top_gooner',
      name: 'Top Gooner',
      category: 'goon',
      description: 'Completed 50+ goon sessions'
    });

    if (findomSessions >= 20) achievementsToAward.push({
      id: 'master_debtor',
      name: 'Master Debtor',
      category: 'findom',
      description: 'Engaged in 20+ findom sessions'
    });

    if (chatInteractions >= 100) achievementsToAward.push({
      id: 'devoted_servant',
      name: 'Devoted Servant',
      category: 'bully_ai',
      description: 'Had 100+ interactions with Bully AI'
    });

    if (totalTimeMinutes >= 1000) achievementsToAward.push({
      id: 'time_devotee',
      name: 'Time Devotee',
      category: 'engagement',
      description: 'Spent 1000+ minutes in the app'
    });

    // Create achievements if not already owned
    for (const achievement of achievementsToAward) {
      const existing = await base44.entities.UserAchievement.list();
      const hasAchievement = existing.some(a => a.achievement_id === achievement.id);
      
      if (!hasAchievement) {
        await base44.entities.UserAchievement.create({
          achievement_id: achievement.id,
          achievement_name: achievement.name,
          category: achievement.category,
          description: achievement.description,
          unlocked_at: new Date().toISOString(),
          rarity: achievement.rarity || 'uncommon',
          is_showcased: true
        });
      }
    }

    return Response.json({
      success: true,
      analytics: analytics,
      achievementsAwarded: achievementsToAward.length
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
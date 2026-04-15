import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { achievementId } = await req.json();

    // Get the achievement
    const achievements = await base44.entities.UserAchievement.filter({ achievement_id: achievementId });
    const achievement = achievements[0];

    if (!achievement) {
      return Response.json({ error: 'Achievement not found' }, { status: 404 });
    }

    if (achievement.reward_claimed) {
      return Response.json({ error: 'Reward already claimed' }, { status: 400 });
    }

    // Process reward based on type
    let rewardDetails = {};

    switch (achievement.reward_type) {
      case 'coins':
        // Grant coins
        const currentBalance = user.currency_balance || 0;
        await base44.auth.updateMe({
          currency_balance: currentBalance + achievement.reward_value
        });
        rewardDetails.coins = achievement.reward_value;
        break;

      case 'theme':
        // Unlock theme
        const unlockedThemes = user.unlocked_themes || [];
        const themeName = achievement.reward_data?.theme_name;
        if (themeName && !unlockedThemes.includes(themeName)) {
          await base44.auth.updateMe({
            unlocked_themes: [...unlockedThemes, themeName]
          });
        }
        rewardDetails.theme = themeName;
        break;

      case 'title':
        // Unlock profile title
        const unlockedTitles = user.unlocked_titles || [];
        const title = achievement.reward_data?.title;
        if (title && !unlockedTitles.includes(title)) {
          await base44.auth.updateMe({
            unlocked_titles: [...unlockedTitles, title]
          });
        }
        rewardDetails.title = title;
        break;

      case 'aura':
        // Unlock aura effect
        const unlockedAuras = user.unlocked_auras || [];
        const aura = achievement.reward_data?.aura_name;
        if (aura && !unlockedAuras.includes(aura)) {
          await base44.auth.updateMe({
            unlocked_auras: [...unlockedAuras, aura]
          });
        }
        rewardDetails.aura = aura;
        break;

      case 'badge':
        // Badge is the achievement itself, just mark as showcased
        await base44.entities.UserAchievement.update(achievement.id, {
          is_showcased: true
        });
        rewardDetails.badge = achievement.achievement_name;
        break;
    }

    // Mark reward as claimed
    await base44.entities.UserAchievement.update(achievement.id, {
      reward_claimed: true,
      claimed_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      achievement: achievement.achievement_name,
      reward: rewardDetails
    });

  } catch (error) {
    console.error('Error claiming reward:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
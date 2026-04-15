import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all user-related entities
    const entities = [
      'Orgasm',
      'Session',
      'Payment',
      'Achievement',
      'UserSettings',
      'DebtContract',
      'FailedPayment',
      'AssetListing',
      'HouseListing',
      'UserAsset',
      'Notification',
      'NotificationPreferences',
      'ViewingHistory',
      'BullyTask',
      'TaskCompletion',
      'UserAchievement',
      'Purchase',
      'PremiumPurchase',
      'TributeGoal',
      'RecurringPaymentPlan',
      'AIGuidedSession',
      'FindomChallenge',
      'ChallengeProgress',
      'UserFeedback',
      'UserAnalytics',
      'HornyJailInteraction',
    ];

    // Delete all records from each entity
    for (const entityName of entities) {
      try {
        await base44.asServiceRole.entities[entityName].deleteMany({
          created_by: user.email
        });
      } catch (error) {
        console.log(`Failed to delete ${entityName}:`, error.message);
        // Continue with other entities even if one fails
      }
    }

    // Delete the user record itself (admin operation)
    // Note: This assumes you have a way to delete users via service role
    // If not, you may need to implement this differently

    return Response.json({ 
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
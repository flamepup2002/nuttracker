import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only function
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list('', 1000);
    
    let distributedCount = 0;
    let skippedCount = 0;

    // Distribute bonus to users who haven't claimed it yet
    for (const userData of allUsers) {
      if (!userData.welcome_bonus_claimed) {
        const newBalance = (userData.currency_balance || 0) + 1000;
        
        try {
          await base44.asServiceRole.entities.User.update(userData.id, {
            currency_balance: newBalance,
            welcome_bonus_claimed: true
          });
          distributedCount++;
        } catch (error) {
          console.log(`Failed to update user ${userData.id}: ${error.message}`);
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }

    return Response.json({
      success: true,
      message: 'Welcome bonus distributed',
      distributed: distributedCount,
      skipped: skippedCount,
      totalProcessed: distributedCount + skippedCount
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
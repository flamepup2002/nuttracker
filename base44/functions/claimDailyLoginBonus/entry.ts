import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const lastClaimDate = user.last_daily_bonus_date;

    // Check if user already claimed today
    if (lastClaimDate === today) {
      return Response.json({ 
        message: 'Daily bonus already claimed today',
        balance: user.currency_balance || 0,
        alreadyClaimed: true
      });
    }

    // Award 100 coins for daily login
    const newBalance = (user.currency_balance || 0) + 100;
    
    // Update user with new balance and today's date
    await base44.auth.updateMe({
      currency_balance: newBalance,
      last_daily_bonus_date: today
    });

    return Response.json({
      success: true,
      message: 'Daily bonus claimed!',
      coinsAwarded: 100,
      newBalance: newBalance,
      alreadyClaimed: false
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
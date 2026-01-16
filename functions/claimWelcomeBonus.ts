import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already claimed bonus
    if (user.welcome_bonus_claimed) {
      return Response.json({ 
        message: 'Bonus already claimed',
        balance: user.currency_balance || 0
      });
    }

    // Add 1000 coins to user's balance
    const newBalance = (user.currency_balance || 0) + 1000;
    
    // Update user with new balance and mark bonus as claimed
    await base44.auth.updateMe({
      currency_balance: newBalance,
      welcome_bonus_claimed: true
    });

    return Response.json({
      success: true,
      message: 'Welcome bonus claimed!',
      coinsAwarded: 1000,
      newBalance: newBalance
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
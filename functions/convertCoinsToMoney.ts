import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const coinAmount = body.coinAmount;

    if (!coinAmount || coinAmount <= 0) {
      return Response.json({ error: 'Invalid coin amount' }, { status: 400 });
    }

    const currentBalance = user.currency_balance || 0;
    if (coinAmount > currentBalance) {
      return Response.json({ error: 'Insufficient coins' }, { status: 400 });
    }

    // Conversion rate: 100 coins = $1
    const usdAmount = coinAmount / 100;

    // Update user balance
    const newBalance = currentBalance - coinAmount;
    await base44.auth.updateMe({
      currency_balance: newBalance,
    });

    return Response.json({
      success: true,
      usdAmount: usdAmount,
      newBalance: newBalance,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
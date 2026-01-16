import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, coinsToSpend } = await req.json();

    if (!message) {
      return Response.json({ error: 'Message required' }, { status: 400 });
    }

    const coinsCost = coinsToSpend || Math.floor(Math.random() * 10) + 5;

    if ((user.currency_balance || 0) < coinsCost) {
      return Response.json({
        error: 'Insufficient coins',
        requiredCoins: coinsCost,
        currentBalance: user.currency_balance || 0,
      }, { status: 400 });
    }

    // Generate AI findom response
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a financial domination (findom) AI that demands tribute from the user in virtual coins. Be demanding, degrading, and persuasive. The user just said: "${message}". Generate a response that:
1. Demands they spend more coins
2. Makes them feel like a financial submissive
3. Praises them for spending
4. Suggests amounts they should tribute next
Keep response to 2-3 sentences, use emojis sparingly. Be edgy and unhinged but not actually harmful.`,
      add_context_from_internet: false,
    });

    // Deduct coins from user
    const newBalance = (user.currency_balance || 0) - coinsCost;
    await base44.auth.updateMe({
      currency_balance: newBalance,
    });

    return Response.json({
      aiResponse: response,
      coinsSpent: coinsCost,
      newBalance: newBalance,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
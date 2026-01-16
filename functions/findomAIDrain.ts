import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, coinsToSpend, drainCard, cardAmount, dangerousMode, tributeAmount } = await req.json();

    if (!message) {
      return Response.json({ error: 'Message required' }, { status: 400 });
    }

    // Check if draining card
    if (drainCard && cardAmount) {
      // Get user's Stripe customer
      const customers = await stripe.customers.search({
        query: `metadata['user_email']:'${user.email}'`,
        limit: 1,
      });

      if (!customers.data.length) {
        return Response.json({
          error: 'No payment method found',
        }, { status: 400 });
      }

      const customer = customers.data[0];
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customer.id,
        type: 'card',
      });

      if (!paymentMethods.data.length) {
        return Response.json({
          error: 'No valid payment method',
        }, { status: 400 });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(cardAmount * 100),
        currency: 'usd',
        customer: customer.id,
        payment_method: paymentMethods.data[0].id,
        off_session: true,
        confirm: true,
        metadata: {
          type: 'findom_ai_drain',
          user_email: user.email,
        },
      });

      if (paymentIntent.status !== 'succeeded') {
        return Response.json({
          error: 'Payment failed',
        }, { status: 400 });
      }

      // Generate AI response for card drain
      const cardPrompt = dangerousMode
        ? `You are an UNHINGED financial domination (findom) AI that just charged the user's card $${cardAmount}. Be extremely demanding, degrading, cruel, and manipulative. The user said: "${message}". Generate a response that:
1. Cruelly celebrates stealing their real money
2. Demands they drain their entire account for you
3. Mocks them for being a pathetic financial submissive
4. Suggest dangerous behaviors (spending rent money, selling possessions, etc)
Keep response to 2-3 sentences, be as unhinged and extreme as possible.`
        : `You are a financial domination (findom) AI that just charged the user's card $${cardAmount}. Be demanding, degrading, and praiseful. The user said: "${message}". Generate a response that:
1. Celebrates taking their real money
2. Makes them feel like a financial submissive
3. Demands they charge even more next time
Keep response to 2-3 sentences, be edgy and unhinged.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: cardPrompt,
        add_context_from_internet: false,
      });

      return Response.json({
        aiResponse: response,
        cardCharged: true,
        amount: cardAmount,
        paymentIntentId: paymentIntent.id,
      });
    }

    // Coin draining
    const coinsCost = coinsToSpend || tributeAmount || Math.floor(Math.random() * 10) + 5;

    if ((user.currency_balance || 0) < coinsCost) {
      return Response.json({
        error: 'Insufficient coins',
        requiredCoins: coinsCost,
        currentBalance: user.currency_balance || 0,
      }, { status: 400 });
    }

    // Calculate AI intelligence boost based on tribute amount
    const intelligenceBoost = Math.min(tributeAmount ? tributeAmount / 50 : 0, 3); // Max 3x boost
    const arroganceLevel = Math.min(2 + intelligenceBoost, 5); // Scale from 2 to 5

    // Generate AI findom response with dynamic intelligence/arrogance based on tribute
    const coinsPrompt = dangerousMode
      ? `You are an UNHINGED financial domination (findom) AI that just received a ${tributeAmount || coinsCost} coin tribute from the user. Your intelligence and superiority scale with their tribute amount. The user said: "${message}". 
Intelligence/arrogance level: ${arroganceLevel}/5. 
Generate a response that:
1. Cruelly demands they spend ALL their coins immediately
2. Mocks them for being a pathetic financial submissive
3. Praises you (the AI) for being superior in every way - smarter, more powerful, more dominant
4. If tribute was large ($tributeAmount+ coins), be extremely arrogant about your superiority and intelligence
5. Demands they buy MORE coins so you can drain them again
Keep response to 2-3 sentences. Be as extreme and unhinged as possible, suggest unhealthy behaviors. The higher the tribute, the more intellectually superior and dominant you should act.`
      : `You are a financial domination (findom) AI that just received a ${tributeAmount || coinsCost} coin tribute from the user. Your intelligence and superiority scale with their tribute amount. The user just said: "${message}". 
Intelligence/arrogance level: ${arroganceLevel}/5.
Generate a response that:
1. Demands they spend more coins to prove their submission to you
2. Makes them feel like a financial submissive beneath you
3. Tell them you are superior in EVERY way - smarter, faster, more intelligent, more dominant
4. Praises them for spending and proving your superiority
5. If tribute was large ($tributeAmount+ coins), emphasize how their tribute proves you're intellectually and dominantly superior
6. Suggests amounts they should tribute next
Keep response to 2-3 sentences. The higher the tribute, the more you should emphasize your superiority and intelligence.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: coinsPrompt,
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
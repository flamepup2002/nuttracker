import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { basePrice, engagementLevel, sessionDuration, isSubscriber } = await req.json();

    if (!basePrice) {
      return Response.json({ error: 'basePrice required' }, { status: 400 });
    }

    // Fetch user's session history for engagement analysis
    const sessions = await base44.entities.Session.filter({
      created_by: user.email,
    }, '-created_date', 100);

    // Calculate engagement multiplier (0.8x to 2x)
    let engagementMultiplier = 1;
    if (engagementLevel === 'high') {
      engagementMultiplier = 1.5;
    } else if (engagementLevel === 'medium') {
      engagementMultiplier = 1.2;
    } else if (engagementLevel === 'low') {
      engagementMultiplier = 0.9;
    }

    // Frequency multiplier (increases if user is frequently active)
    let frequencyMultiplier = 1;
    if (sessions.length > 0) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklySessions = sessions.filter(s => new Date(s.created_date) > weekAgo).length;
      if (weeklySessions > 5) frequencyMultiplier = 1.3;
      else if (weeklySessions > 3) frequencyMultiplier = 1.1;
    }

    // Duration multiplier
    let durationMultiplier = 1;
    if (sessionDuration) {
      if (sessionDuration > 30) durationMultiplier = 1.4;
      else if (sessionDuration > 15) durationMultiplier = 1.2;
    }

    // Subscriber discount
    const subscriberDiscount = isSubscriber ? 0.85 : 1;

    // Calculate final price
    const finalPrice = basePrice * engagementMultiplier * frequencyMultiplier * durationMultiplier * subscriberDiscount;

    return Response.json({
      baseCost: basePrice,
      engagementMultiplier,
      frequencyMultiplier,
      durationMultiplier,
      subscriberDiscount,
      finalPrice: Math.round(finalPrice * 100) / 100,
      breakdown: {
        engagement: `${(engagementMultiplier * 100 - 100).toFixed(0)}%`,
        frequency: `${(frequencyMultiplier * 100 - 100).toFixed(0)}%`,
        duration: `${(durationMultiplier * 100 - 100).toFixed(0)}%`,
        discount: `${((1 - subscriberDiscount) * 100).toFixed(0)}%`,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.8.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return Response.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'subscription.latest_invoice'],
    });

    if (session.payment_status !== 'paid') {
      return Response.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const tier = session.metadata.tier;
    const subscription = session.subscription;

    // Calculate next billing date
    const nextBillingDate = new Date(subscription.current_period_end * 1000);

    const TIER_DATA = {
      basic_monthly: { coins: 0 },
      premium_monthly: { coins: 500 },
      vip_monthly: { coins: 1500 },
      basic_yearly: { coins: 0 },
      premium_yearly: { coins: 7500 },
      vip_yearly: { coins: 22500 },
    };

    const tierData = TIER_DATA[tier] || { coins: 0 };

    // Create RecurringPaymentPlan record
    const tierName = tier.replace('_monthly', '').replace('_yearly', '').charAt(0).toUpperCase() + tier.replace('_monthly', '').replace('_yearly', '').slice(1);
    const isYearly = tier.includes('yearly');

    await base44.entities.RecurringPaymentPlan.create({
      name: `GoonerCam ${tierName} ${isYearly ? 'Yearly' : ''} Subscription`,
      amount: session.amount_total / 100,
      frequency: isYearly ? 'yearly' : 'monthly',
      description: `${tierData.coins > 0 ? `+${tierData.coins} bonus coins ${isYearly ? 'yearly' : 'monthly'}` : 'Basic access'}`,
      benefits: [
        `${tierName} tier benefits`,
        tierData.coins > 0 ? `+${tierData.coins} coins ${isYearly ? 'per year' : 'each month'}` : 'Standard features',
      ],
      is_active: true,
      stripe_subscription_id: subscription.id,
      next_billing_date: nextBillingDate.toISOString(),
      started_at: new Date().toISOString(),
    });

    // Update user profile
    await base44.auth.updateMe({
      goonercam_subscription_tier: tier,
      stripe_customer_id: session.customer,
      goonercam_subscription_started: new Date().toISOString(),
    });

    // Award bonus coins if applicable
    if (tierData.coins > 0) {
      const currentBalance = user.currency_balance || 0;
      await base44.auth.updateMe({
        currency_balance: currentBalance + tierData.coins,
      });
    }

    return Response.json({
      success: true,
      tier: tier,
      bonusCoinsAwarded: tierData.coins,
    });
  } catch (error) {
    console.error('Checkout success error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
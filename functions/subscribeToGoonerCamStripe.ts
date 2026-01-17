import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.8.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const SUBSCRIPTION_TIERS = {
  basic: { name: 'GoonerCam Basic', price: 499, coins: 0 },
  premium: { name: 'GoonerCam Premium', price: 999, coins: 500 },
  vip: { name: 'GoonerCam VIP', price: 1999, coins: 1500 },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier } = await req.json();

    if (!tier || !SUBSCRIPTION_TIERS[tier]) {
      return Response.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const tierData = SUBSCRIPTION_TIERS[tier];

    // Get or create Stripe customer
    let stripeCustomerId = user.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
          userName: user.full_name,
        },
      });
      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await base44.auth.updateMe({
        stripe_customer_id: stripeCustomerId,
      });
    }

    // Create or get product
    const products = await stripe.products.search({
      query: `name:"${tierData.name}"`,
    });

    let productId = products.data[0]?.id;

    if (!productId) {
      const product = await stripe.products.create({
        name: tierData.name,
        description: `GoonerCam ${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription`,
        metadata: { tier },
      });
      productId = product.id;
    }

    // Create or get price
    const prices = await stripe.prices.search({
      query: `product:"${productId}" active:"true"`,
    });

    let priceId = prices.data[0]?.id;

    if (!priceId) {
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: tierData.price,
        currency: 'usd',
        recurring: {
          interval: 'month',
          interval_count: 1,
        },
      });
      priceId = price.id;
    }

    // Check for existing subscriptions and cancel them
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      expand: ['data.items.data.price.product'],
    });

    for (const sub of existingSubscriptions.data) {
      if (sub.items.data[0]?.price?.product?.metadata?.tier !== tier) {
        await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
      }
    }

    // Check if already subscribed to this tier
    const tierSubscription = existingSubscriptions.data.find(
      (sub) => sub.items.data[0]?.price?.product?.metadata?.tier === tier
    );

    if (tierSubscription) {
      return Response.json({
        success: false,
        message: 'Already subscribed to this tier',
      });
    }

    // Create new subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'error_if_incomplete',
      metadata: {
        userId: user.id,
        tier: tier,
      },
      off_session: true,
    });

    // Calculate next billing date
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    // Create RecurringPaymentPlan record
    await base44.entities.RecurringPaymentPlan.create({
      name: `GoonerCam ${tier.charAt(0).toUpperCase() + tier.slice(1)} Subscription`,
      amount: tierData.price / 100,
      frequency: 'monthly',
      description: `${tierData.coins > 0 ? `+${tierData.coins} bonus coins monthly` : 'Basic access'}`,
      benefits: [
        `${tier.charAt(0).toUpperCase() + tier.slice(1)} tier benefits`,
        tierData.coins > 0 ? `+${tierData.coins} coins each month` : 'Standard features',
      ],
      is_active: true,
      stripe_subscription_id: subscription.id,
      next_billing_date: nextBillingDate.toISOString(),
      started_at: new Date().toISOString(),
    });

    // Update user profile
    await base44.auth.updateMe({
      goonercam_subscription_tier: tier,
      stripe_customer_id: stripeCustomerId,
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
      subscription: {
        id: subscription.id,
        status: subscription.status,
        tier: tier,
        nextBillingDate: nextBillingDate.toISOString(),
        bonusCoinsAwarded: tierData.coins,
      },
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
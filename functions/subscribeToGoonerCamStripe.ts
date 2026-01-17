import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.8.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const SUBSCRIPTION_TIERS = {
  basic_monthly: { name: 'GoonerCam Basic', price: 499, coins: 0, interval: 'month' },
  premium_monthly: { name: 'GoonerCam Premium', price: 999, coins: 500, interval: 'month' },
  vip_monthly: { name: 'GoonerCam VIP', price: 1999, coins: 1500, interval: 'month' },
  basic_yearly: { name: 'GoonerCam Basic Yearly', price: 4788, coins: 0, interval: 'year' },
  premium_yearly: { name: 'GoonerCam Premium Yearly', price: 9588, coins: 7500, interval: 'year' },
  vip_yearly: { name: 'GoonerCam VIP Yearly', price: 19188, coins: 22500, interval: 'year' },
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
          interval: tierData.interval === 'year' ? 'year' : 'month',
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

    // Create checkout session instead of direct subscription
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        tier: tier,
      },
      success_url: `${Deno.env.get('APP_URL')}/goonercam?subscription=success&tier=${tier}`,
      cancel_url: `${Deno.env.get('APP_URL')}/goonercam?subscription=cancelled`,
    });

    return Response.json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
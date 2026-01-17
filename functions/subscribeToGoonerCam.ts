import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier, priceUsd, bonusCoins } = await req.json();

    // Validate tier
    const validTiers = ['basic', 'premium', 'vip'];
    if (!validTiers.includes(tier)) {
      return Response.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }

    // Check if user has Stripe customer ID
    if (!user.stripe_customer_id) {
      return Response.json({ 
        error: 'Payment method not set up',
        message: 'Please add a payment method in settings first'
      }, { status: 400 });
    }

    // Cancel existing subscription if any
    if (user.goonercam_subscription_id) {
      try {
        await stripe.subscriptions.cancel(user.goonercam_subscription_id);
      } catch (error) {
        console.error('Error canceling old subscription:', error);
      }
    }

    // Create new subscription
    const subscription = await stripe.subscriptions.create({
      customer: user.stripe_customer_id,
      items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `GoonerCam ${tier.charAt(0).toUpperCase() + tier.slice(1)} Subscription`,
            description: `Monthly subscription with ${bonusCoins} bonus coins`
          },
          unit_amount: Math.round(priceUsd * 100),
          recurring: {
            interval: 'month'
          }
        }
      }],
      metadata: {
        user_email: user.email,
        tier,
        bonus_coins: bonusCoins.toString()
      }
    });

    // Update user with subscription info
    await base44.asServiceRole.auth.updateUser(user.email, {
      goonercam_subscription_tier: tier,
      goonercam_subscription_id: subscription.id,
      goonercam_subscription_status: subscription.status,
      goonercam_subscription_renews_at: new Date(subscription.current_period_end * 1000).toISOString()
    });

    // Add bonus coins immediately
    if (bonusCoins > 0) {
      const newBalance = (user.currency_balance || 0) + bonusCoins;
      await base44.asServiceRole.auth.updateUser(user.email, {
        currency_balance: newBalance
      });
    }

    // Send notification
    await base44.asServiceRole.entities.Notification.create({
      created_by: user.email,
      type: 'contract_accepted',
      title: '🎉 Subscription Activated!',
      message: `Your ${tier} subscription is now active. Enjoy your exclusive perks${bonusCoins > 0 ? ` and ${bonusCoins} bonus coins!` : '!'}`,
      priority: 'medium'
    });

    return Response.json({
      success: true,
      subscription_id: subscription.id,
      tier,
      status: subscription.status,
      bonus_coins_added: bonusCoins
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return Response.json({ 
      error: error.message || 'Failed to create subscription' 
    }, { status: 500 });
  }
});
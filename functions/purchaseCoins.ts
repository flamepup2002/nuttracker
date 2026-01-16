import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { coinAmount } = await req.json();
    
    if (!coinAmount || coinAmount < 1) {
      return Response.json({ error: 'Invalid coin amount' }, { status: 400 });
    }

    // Price: $1 = 100 coins
    const priceInDollars = coinAmount / 100;
    const amountInCents = Math.round(priceInDollars * 100);

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
      await base44.auth.updateMe({ stripe_customer_id: customerId });
    }

    // Get payment method
    const paymentMethodId = user.stripe_payment_method_id;
    if (!paymentMethodId) {
      return Response.json({ 
        error: 'No payment method found. Please add one in settings.' 
      }, { status: 400 });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: `${coinAmount} KinkCoins`,
      metadata: {
        user_id: user.id,
        coin_amount: coinAmount
      }
    });

    if (paymentIntent.status === 'succeeded') {
      // Add coins to user balance
      const newBalance = (user.currency_balance || 0) + coinAmount;
      await base44.auth.updateMe({ currency_balance: newBalance });

      return Response.json({
        success: true,
        newBalance,
        amountPaid: priceInDollars
      });
    } else {
      return Response.json({ 
        error: 'Payment failed',
        status: paymentIntent.status 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Purchase error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
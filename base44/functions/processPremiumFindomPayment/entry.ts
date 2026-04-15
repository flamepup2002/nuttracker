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

    const { contentId, contentTitle, price, stripePaymentMethodId } = await req.json();

    if (!contentId || !price || !stripePaymentMethodId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(price * 100),
      currency: 'usd',
      payment_method: stripePaymentMethodId,
      confirm: true,
      description: `Premium Findom Content: ${contentTitle}`,
      metadata: {
        user_email: user.email,
        content_id: contentId,
        content_title: contentTitle,
      },
    });

    if (paymentIntent.status !== 'succeeded') {
      return Response.json({
        success: false,
        error: 'Payment failed',
        status: paymentIntent.status,
      }, { status: 400 });
    }

    // Record purchase
    const purchase = await base44.entities.PremiumPurchase.create({
      content_id: contentId,
      content_title: contentTitle,
      price,
      stripe_payment_intent_id: paymentIntent.id,
      download_url: `/premium-content/${contentId}`,
    });

    return Response.json({
      success: true,
      purchaseId: purchase.id,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    return Response.json({
      error: error.message,
    }, { status: 500 });
  }
});
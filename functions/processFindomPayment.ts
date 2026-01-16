import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { sessionId, amount, stripeCustomerId, paymentMethodId } = await req.json();
    
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user settings to lock interest rate
    const settings = await base44.asServiceRole.entities.UserSettings.filter({ created_by: user.email });
    const currentInterestRate = settings.length > 0 ? settings[0].interest_rate : 0;

    // Create a Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: `NUTtracker Findom Session ${sessionId}`,
      metadata: {
        session_id: sessionId,
        app: 'nuttracker'
      }
    });

    // Record the payment
    const payment = await base44.entities.Payment.create({
      session_id: sessionId,
      amount: amount,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_customer_id: stripeCustomerId,
      status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'pending',
      metadata: {
        payment_method_id: paymentMethodId
      }
    });

    // Update session with locked interest rate
    await base44.entities.Session.update(sessionId, {
      locked_interest_rate: currentInterestRate
    });

    return Response.json({
      success: true,
      payment,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100
      }
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    
    const base44 = createClientFromRequest(req);

    // Record failed payment
    await base44.entities.Payment.create({
      session_id: sessionId,
      amount: amount,
      stripe_customer_id: stripeCustomerId,
      status: 'failed',
      error_message: error.message,
      metadata: {
        payment_method_id: paymentMethodId
      }
    });

    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
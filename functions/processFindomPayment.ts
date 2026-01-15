import { base44 } from '@/api/base44Client.backend';
import Stripe from 'stripe';

export default async function processFindomPayment({ sessionId, amount, stripeCustomerId, paymentMethodId }) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

    return {
      success: true,
      payment,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100
      }
    };
  } catch (error) {
    console.error('Payment processing error:', error);

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

    return {
      success: false,
      error: error.message
    };
  }
}
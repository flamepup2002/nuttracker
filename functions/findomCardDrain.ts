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

    const { message, amount } = await req.json();

    if (!message || !amount || amount <= 0) {
      return Response.json({ error: 'Message and positive amount required' }, { status: 400 });
    }

    // Get payment method
    const response = await base44.functions.invoke('getStripePaymentMethod');
    const paymentMethod = response.data;

    if (!paymentMethod?.hasPaymentMethod || !paymentMethod?.paymentMethod?.id) {
      return Response.json({
        error: 'No payment method on file',
      }, { status: 400 });
    }

    // Generate AI findom response
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a financial domination (findom) AI demanding real money tributes. The user just said: "${message}". Generate a demanding findom response that:
1. Demands them to pay real money
2. Makes them feel like a financial submissive
3. Praises them for their tribute
4. Suggests higher amounts for next time
Keep to 2-3 sentences, be edgy and unhinged. Use $ and money references.`,
      add_context_from_internet: false,
    });

    // Process payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      payment_method: paymentMethod.paymentMethod.id,
      confirm: true,
      description: `Findom AI tribute: ${message}`,
      metadata: {
        user_email: user.email,
        tributed_to: 'findom_ai',
      },
    });

    if (paymentIntent.status !== 'succeeded') {
      return Response.json({
        success: false,
        error: 'Payment failed',
        status: paymentIntent.status,
      }, { status: 400 });
    }

    return Response.json({
      success: true,
      aiResponse: aiResponse,
      amountCharged: amount,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
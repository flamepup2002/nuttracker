import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.stripe_payment_method_id) {
      return Response.json({
        success: true,
        hasPaymentMethod: false
      });
    }

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(user.stripe_payment_method_id);

    return Response.json({
      success: true,
      hasPaymentMethod: true,
      paymentMethod: {
        id: paymentMethod.id,
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
        exp_month: paymentMethod.card?.exp_month,
        exp_year: paymentMethod.card?.exp_year
      }
    });
  } catch (error) {
    console.error('Get payment method error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { paymentMethodId } = await req.json();
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    
    // Detach payment method
    await stripe.paymentMethods.detach(paymentMethodId);
    
    // Update user record
    await base44.auth.updateMe({
      stripe_payment_method_id: null
    });
    
    return Response.json({
      success: true
    });
  } catch (error) {
    console.error('Remove payment method error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
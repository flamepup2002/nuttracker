import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { paymentMethodId, email, name } = await req.json();
    
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a Stripe customer ID
    const currentUser = await base44.asServiceRole.entities.User.get(user.id);
    
    let customerId = currentUser.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: email || user.email,
        name: name || user.full_name,
        metadata: {
          user_id: user.id,
          app: 'nuttracker'
        }
      });
      customerId = customer.id;

      // Save customer ID to user
      await base44.asServiceRole.entities.User.update(user.id, {
        stripe_customer_id: customerId
      });
    }

    if (paymentMethodId) {
      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Save default payment method to user
      await base44.asServiceRole.entities.User.update(user.id, {
        stripe_payment_method_id: paymentMethodId
      });
    }

    return Response.json({
      success: true,
      customerId,
      paymentMethodId
    });
  } catch (error) {
    console.error('Stripe customer setup error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
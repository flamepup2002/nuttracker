import { base44 } from '@/api/base44Client.backend';
import Stripe from 'stripe';

export default async function setupStripeCustomer({ email, name, paymentMethodId }) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const user = await base44.auth.requireUser();

    // Check if user already has a Stripe customer ID
    const currentUser = await base44.entities.User.get(user.id);
    
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
      await base44.entities.User.update(user.id, {
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
      await base44.entities.User.update(user.id, {
        stripe_payment_method_id: paymentMethodId
      });
    }

    return {
      success: true,
      customerId,
      paymentMethodId
    };
  } catch (error) {
    console.error('Stripe customer setup error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
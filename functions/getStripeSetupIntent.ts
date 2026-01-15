import { base44 } from '@/api/base44Client.backend';
import Stripe from 'stripe';

export default async function getStripeSetupIntent() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const user = await base44.auth.requireUser();

    let customerId = user.stripe_customer_id;

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          user_id: user.id,
          app: 'nuttracker'
        }
      });
      customerId = customer.id;

      await base44.entities.User.update(user.id, {
        stripe_customer_id: customerId
      });
    }

    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card']
    });

    return {
      success: true,
      clientSecret: setupIntent.client_secret,
      customerId
    };
  } catch (error) {
    console.error('Setup intent error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
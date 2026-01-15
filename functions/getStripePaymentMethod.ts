import { base44 } from '@/api/base44Client.backend';
import Stripe from 'stripe';

export default async function getStripePaymentMethod() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const user = await base44.auth.requireUser();

    if (!user.stripe_payment_method_id) {
      return {
        success: true,
        hasPaymentMethod: false
      };
    }

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(user.stripe_payment_method_id);

    return {
      success: true,
      hasPaymentMethod: true,
      paymentMethod: {
        id: paymentMethod.id,
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
        exp_month: paymentMethod.card?.exp_month,
        exp_year: paymentMethod.card?.exp_year
      }
    };
  } catch (error) {
    console.error('Get payment method error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
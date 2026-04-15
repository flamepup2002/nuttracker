import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.8.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contractId } = await req.json();

    if (!contractId) {
      return Response.json({ error: 'contractId required' }, { status: 400 });
    }

    // Get contract
    const contract = await base44.entities.DebtContract.filter({ id: contractId });
    if (!contract || contract.length === 0) {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }

    const debtContract = contract[0];

    // Check if already has subscription
    if (debtContract.stripe_subscription_id) {
      return Response.json({ error: 'Subscription already exists' }, { status: 400 });
    }

    // Get or create Stripe customer
    let stripeCustomerId = debtContract.stripe_customer_id;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
          userName: user.full_name,
        },
      });
      stripeCustomerId = customer.id;

      // Update contract with customer ID
      await base44.entities.DebtContract.update(contractId, {
        stripe_customer_id: stripeCustomerId,
      });
    }

    // Create product and price if not using existing
    const product = await stripe.products.create({
      name: debtContract.title,
      description: debtContract.description,
      metadata: {
        contractId: contractId,
      },
    });

    // Calculate billing cycle in days
    const billingCycleDays = 30;

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(debtContract.monthly_payment * 100),
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: 1,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: price.id }],
      payment_behavior: 'error_if_incomplete',
      metadata: {
        contractId: contractId,
        userId: user.id,
      },
      off_session: true,
      automatic_tax: { enabled: false },
    });

    // Update contract with subscription details
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + billingCycleDays);

    await base44.entities.DebtContract.update(contractId, {
      stripe_subscription_id: subscription.id,
      stripe_customer_id: stripeCustomerId,
      next_payment_due: nextBillingDate.toISOString(),
      amount_paid: 0,
    });

    return Response.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        nextBillingDate: nextBillingDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
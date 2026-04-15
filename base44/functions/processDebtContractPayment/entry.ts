import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { contractId, paymentType } = await req.json();
    
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get contract details
    const contract = await base44.entities.DebtContract.get(contractId);
    if (!contract) {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Ensure user has Stripe customer ID
    const currentUser = await base44.asServiceRole.entities.User.get(user.id);
    if (!currentUser.stripe_customer_id || !currentUser.stripe_payment_method_id) {
      return Response.json({ 
        error: 'Payment method not set up. Please add a payment method first.' 
      }, { status: 400 });
    }

    const { stripe_customer_id, stripe_payment_method_id } = currentUser;

    // For perpetual contracts (duration = 0) or contracts > 3 months, create subscription
    // For shorter contracts, handle as one-time or series of payments
    if (paymentType === 'recurring' || contract.duration_months === 0 || contract.duration_months > 3) {
      // Create recurring subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripe_customer_id,
        items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: contract.title,
              description: contract.description,
            },
            recurring: {
              interval: 'month',
              interval_count: 1,
            },
            unit_amount: Math.round(contract.monthly_payment * 100),
          },
        }],
        default_payment_method: stripe_payment_method_id,
        metadata: {
          contract_id: contractId,
          user_id: user.id,
          app: 'nuttracker',
          contract_type: 'debt',
        },
        ...(contract.duration_months > 0 && {
          cancel_at: Math.floor(Date.now() / 1000) + (contract.duration_months * 30 * 24 * 60 * 60)
        })
      });

      // Update contract with subscription ID
      await base44.entities.DebtContract.update(contractId, {
        stripe_subscription_id: subscription.id,
        is_accepted: true,
        accepted_at: new Date().toISOString(),
        next_payment_due: new Date(subscription.current_period_end * 1000).toISOString(),
      });

      // Create notification
      await base44.asServiceRole.functions.invoke('createNotification', {
        userEmail: user.email,
        type: 'contract_accepted',
        title: '✅ Contract Accepted',
        message: `You've accepted the contract "${contract.title}". Monthly payments will be charged automatically.`,
        contractId,
        actionUrl: 'MyContracts',
        priority: 'medium'
      });

      return Response.json({
        success: true,
        type: 'subscription',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
        }
      });
    } else {
      // One-time payment for the full contract amount
      const totalAmount = contract.monthly_payment * contract.duration_months;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        currency: 'usd',
        customer: stripe_customer_id,
        payment_method: stripe_payment_method_id,
        off_session: true,
        confirm: true,
        description: `${contract.title} - Full Contract Payment`,
        metadata: {
          contract_id: contractId,
          user_id: user.id,
          app: 'nuttracker',
          contract_type: 'debt',
        }
      });

      // Update contract
      await base44.entities.DebtContract.update(contractId, {
        stripe_payment_intent_id: paymentIntent.id,
        is_accepted: true,
        accepted_at: new Date().toISOString(),
        amount_paid: totalAmount,
        next_payment_due: null, // Paid in full
      });

      // Record payment
      await base44.entities.Payment.create({
        amount: totalAmount,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: stripe_customer_id,
        status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'pending',
        metadata: {
          contract_id: contractId,
          payment_type: 'one_time_full',
        }
      });

      // Create notification
      await base44.asServiceRole.functions.invoke('createNotification', {
        userEmail: user.email,
        type: 'contract_accepted',
        title: '✅ Contract Accepted',
        message: `You've accepted the contract "${contract.title}". Payment processed successfully.`,
        contractId,
        actionUrl: 'MyContracts',
        priority: 'medium'
      });

      return Response.json({
        success: true,
        type: 'one_time',
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
        }
      });
    }
  } catch (error) {
    console.error('Contract payment processing error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
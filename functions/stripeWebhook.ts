import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    // Create base44 client BEFORE webhook validation
    const base44 = createClientFromRequest(req);
    
    if (!signature || !webhookSecret) {
      console.log('Missing signature or webhook secret');
      return Response.json({ error: 'Webhook signature missing' }, { status: 400 });
    }
    
    // Verify webhook signature (async in Deno)
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );
    
    console.log('Webhook event:', event.type);
    
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const contractId = paymentIntent.metadata?.contract_id;
        
        if (contractId) {
          // Update contract with successful payment
          const contract = await base44.asServiceRole.entities.DebtContract.get(contractId);
          if (contract) {
            await base44.asServiceRole.entities.DebtContract.update(contractId, {
              amount_paid: (contract.amount_paid || 0) + (paymentIntent.amount / 100),
              is_accepted: true,
              accepted_at: contract.accepted_at || new Date().toISOString(),
              next_payment_due: contract.duration_months === 0 
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                : contract.next_payment_due
            });
          }
          
          // Mark any failed payments as resolved
          const failedPayments = await base44.asServiceRole.entities.FailedPayment.filter({
            contract_id: contractId,
            status: 'pending_retry'
          });
          
          for (const failed of failedPayments) {
            await base44.asServiceRole.entities.FailedPayment.update(failed.id, {
              status: 'resolved',
              resolved_at: new Date().toISOString()
            });
          }
        }
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const contractId = paymentIntent.metadata?.contract_id;
        
        if (contractId) {
          const contract = await base44.asServiceRole.entities.DebtContract.get(contractId);
          
          // Create failed payment record
          await base44.asServiceRole.entities.FailedPayment.create({
            contract_id: contractId,
            stripe_payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
            retry_count: 0,
            next_retry_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending_retry',
            created_by: contract.created_by
          });
          
          // Send failure notification
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: contract.created_by,
            subject: `❌ Payment Failed - ${contract.title}`,
            body: `
Your contract payment has failed.

Contract: ${contract.title}
Amount: $${(paymentIntent.amount / 100).toFixed(2)}
Reason: ${paymentIntent.last_payment_error?.message || 'Payment declined'}

We will automatically retry the payment in 24 hours. Please ensure your payment method is valid.

⚠️ Late penalties may apply if payment continues to fail.

Login to update your payment method: https://your-app.base44.com
            `
          });
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          // Find contract by subscription ID
          const contracts = await base44.asServiceRole.entities.DebtContract.filter({
            stripe_subscription_id: subscriptionId
          });
          
          if (contracts.length > 0) {
            const contract = contracts[0];
            await base44.asServiceRole.entities.DebtContract.update(contract.id, {
              amount_paid: (contract.amount_paid || 0) + (invoice.amount_paid / 100),
              next_payment_due: new Date(invoice.period_end * 1000).toISOString()
            });
          }
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          const contracts = await base44.asServiceRole.entities.DebtContract.filter({
            stripe_subscription_id: subscriptionId
          });
          
          if (contracts.length > 0) {
            const contract = contracts[0];
            
            // Create failed payment record
            await base44.asServiceRole.entities.FailedPayment.create({
              contract_id: contract.id,
              stripe_payment_intent_id: invoice.payment_intent,
              amount: invoice.amount_due / 100,
              failure_reason: 'Subscription payment failed',
              retry_count: 0,
              next_retry_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              status: 'pending_retry',
              created_by: contract.created_by
            });
            
            // Send notification
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: contract.created_by,
              subject: `❌ Subscription Payment Failed - ${contract.title}`,
              body: `
Your recurring contract payment has failed.

Contract: ${contract.title}
Amount: $${(invoice.amount_due / 100).toFixed(2)}

⚠️ This is a recurring subscription. Please update your payment method immediately.

Late penalties: ${contract.penalty_percentage}%
${contract.collateral_type && contract.collateral_type !== 'none' ? `⚠️ Your ${contract.collateral_type} is at risk!` : ''}

Login to manage payment: https://your-app.base44.com
              `
            });
          }
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Find and mark contract as cancelled
        const contracts = await base44.asServiceRole.entities.DebtContract.filter({
          stripe_subscription_id: subscription.id
        });
        
        if (contracts.length > 0) {
          await base44.asServiceRole.entities.DebtContract.update(contracts[0].id, {
            is_accepted: false,
            cancelled_at: new Date().toISOString()
          });
        }
        break;
      }
    }
    
    return Response.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({
      error: error.message
    }, { status: 400 });
  }
});
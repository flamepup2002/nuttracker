import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.8.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !secret) {
      return Response.json({ error: 'Missing webhook signature' }, { status: 400 });
    }

    // Construct and verify the event
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, secret);
    } catch (err) {
      return Response.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
    }

    const data = event.data.object;

    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const contractId = data.metadata?.contractId;
        if (contractId) {
          const nextPaymentDate = new Date();
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

          const contract = await base44.asServiceRole.entities.DebtContract.filter({ id: contractId });
          if (contract && contract.length > 0) {
            const amountPaid = (contract[0].amount_paid || 0) + (data.amount_paid / 100);

            await base44.asServiceRole.entities.DebtContract.update(contractId, {
              next_payment_due: nextPaymentDate.toISOString(),
              amount_paid: amountPaid,
            });

            // Create payment record
            await base44.asServiceRole.entities.Payment.create({
              amount: data.amount_paid / 100,
              stripe_payment_intent_id: data.payment_intent,
              stripe_customer_id: data.customer,
              status: 'succeeded',
              metadata: {
                contract_id: contractId,
                type: 'monthly_payment',
                invoice_id: data.id,
              },
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const contractId = data.metadata?.contractId;
        if (contractId) {
          // Create failed payment record
          await base44.asServiceRole.entities.Payment.create({
            amount: data.amount_due / 100,
            stripe_payment_intent_id: data.payment_intent,
            stripe_customer_id: data.customer,
            status: 'failed',
            error_message: data.attempted_at ? 'Payment declined' : 'Payment attempt failed',
            metadata: {
              contract_id: contractId,
              type: 'monthly_payment',
              invoice_id: data.id,
            },
          });

          // Create notification for user
          const contract = await base44.asServiceRole.entities.DebtContract.filter({ id: contractId });
          if (contract && contract.length > 0) {
            await base44.asServiceRole.entities.Notification.create({
              title: 'Payment Failed',
              message: `Payment for ${contract[0].title} failed. Please update your payment method.`,
              type: 'payment_failed',
              contract_id: contractId,
              created_by: contract[0].created_by,
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const contractId = data.metadata?.contractId;
        if (contractId) {
          // Mark contract as subscription cancelled
          await base44.asServiceRole.entities.DebtContract.update(contractId, {
            stripe_subscription_id: null,
          });
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.8.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all active contracts with due payments
    const now = new Date();
    const allContracts = await base44.asServiceRole.entities.DebtContract.list();

    const dueContracts = allContracts.filter(c => {
      if (!c.is_accepted || !c.next_payment_due) return false;
      const nextPaymentDate = new Date(c.next_payment_due);
      return nextPaymentDate <= now;
    });

    const results = {
      processed: 0,
      failed: 0,
      errors: [],
    };

    for (const contract of dueContracts) {
      try {
        if (contract.stripe_subscription_id) {
          // Subscription payments are handled by Stripe automatically
          // We just need to update the next payment due date
          const nextPaymentDate = new Date();
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

          await base44.asServiceRole.entities.DebtContract.update(contract.id, {
            next_payment_due: nextPaymentDate.toISOString(),
          });

          results.processed++;
        } else if (contract.stripe_customer_id) {
          // Process one-time payment
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(contract.monthly_payment * 100),
            currency: 'usd',
            customer: contract.stripe_customer_id,
            description: `Payment for ${contract.title}`,
            metadata: {
              contractId: contract.id,
              type: 'monthly_contract_payment',
            },
            off_session: true,
            confirm: true,
          });

          // Create payment record
          await base44.asServiceRole.entities.Payment.create({
            contract_id: contract.id,
            amount: contract.monthly_payment,
            stripe_payment_intent_id: paymentIntent.id,
            stripe_customer_id: contract.stripe_customer_id,
            status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'failed',
            error_message: paymentIntent.status === 'succeeded' ? null : paymentIntent.last_payment_error?.message,
            metadata: {
              contract_id: contract.id,
              type: 'monthly_payment',
            },
          });

          if (paymentIntent.status === 'succeeded') {
            // Update contract
            const nextPaymentDate = new Date();
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

            const amountPaid = (contract.amount_paid || 0) + contract.monthly_payment;

            await base44.asServiceRole.entities.DebtContract.update(contract.id, {
              next_payment_due: nextPaymentDate.toISOString(),
              amount_paid: amountPaid,
            });

            results.processed++;
          } else {
            results.failed++;
            results.errors.push({
              contractId: contract.id,
              error: paymentIntent.last_payment_error?.message || 'Payment failed',
            });
          }
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          contractId: contract.id,
          error: error.message,
        });
      }
    }

    return Response.json({
      success: true,
      results,
      contractsChecked: dueContracts.length,
    });
  } catch (error) {
    console.error('Monthly payment processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
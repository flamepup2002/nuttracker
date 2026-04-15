import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    
    // Get all failed payments that are due for retry
    const failedPayments = await base44.asServiceRole.entities.FailedPayment.filter({
      status: 'pending_retry'
    });
    
    const today = new Date();
    const results = [];
    
    for (const failed of failedPayments) {
      const retryDate = new Date(failed.next_retry_date);
      
      // Check if it's time to retry
      if (retryDate > today) {
        continue;
      }
      
      // Max 3 retries
      if (failed.retry_count >= 3) {
        await base44.asServiceRole.entities.FailedPayment.update(failed.id, {
          status: 'abandoned'
        });
        
        // Send final notice
        const contract = await base44.asServiceRole.entities.DebtContract.get(failed.contract_id);
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: contract.created_by,
          subject: `🚨 FINAL NOTICE - Payment Failed 3 Times - ${contract.title}`,
          body: `
FINAL NOTICE

Your payment has failed 3 times and will not be retried automatically.

Contract: ${contract.title}
Amount Due: $${failed.amount}

⚠️ IMMEDIATE ACTION REQUIRED
- Penalty: ${contract.penalty_percentage}%
${contract.collateral_type && contract.collateral_type !== 'none' ? `- Your ${contract.collateral_type} is now at risk of seizure` : ''}
${contract.custom_penalty_clause ? `- ${contract.custom_penalty_clause}` : ''}

You must update your payment method and contact us immediately.

Login: https://your-app.base44.com
          `
        });
        
        results.push({
          failedPaymentId: failed.id,
          status: 'abandoned',
          reason: 'Max retries reached'
        });
        continue;
      }
      
      // Get contract and user's Stripe customer
      const contract = await base44.asServiceRole.entities.DebtContract.get(failed.contract_id);
      const user = await base44.asServiceRole.entities.User.filter({
        email: contract.created_by
      });
      
      if (!user[0]?.stripe_customer_id || !user[0]?.stripe_payment_method_id) {
        results.push({
          failedPaymentId: failed.id,
          status: 'failed',
          reason: 'No payment method available'
        });
        continue;
      }
      
      try {
        // Update status to retrying
        await base44.asServiceRole.entities.FailedPayment.update(failed.id, {
          status: 'retrying',
          retry_count: failed.retry_count + 1
        });
        
        // Attempt payment
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(failed.amount * 100),
          currency: 'usd',
          customer: user[0].stripe_customer_id,
          payment_method: user[0].stripe_payment_method_id,
          off_session: true,
          confirm: true,
          description: `Retry ${failed.retry_count + 1} - ${contract.title}`,
          metadata: {
            contract_id: contract.id,
            retry_attempt: failed.retry_count + 1
          }
        });
        
        if (paymentIntent.status === 'succeeded') {
          // Success! Mark as resolved
          await base44.asServiceRole.entities.FailedPayment.update(failed.id, {
            status: 'resolved',
            resolved_at: new Date().toISOString()
          });
          
          // Update contract
          await base44.asServiceRole.entities.DebtContract.update(contract.id, {
            amount_paid: (contract.amount_paid || 0) + failed.amount
          });
          
          // Send success email
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: contract.created_by,
            subject: `✅ Payment Successful - ${contract.title}`,
            body: `
Your payment retry was successful!

Contract: ${contract.title}
Amount Paid: $${failed.amount}
Retry Attempt: ${failed.retry_count + 1}

Your contract is now up to date.
            `
          });
          
          results.push({
            failedPaymentId: failed.id,
            status: 'resolved',
            amount: failed.amount
          });
        } else {
          throw new Error('Payment not succeeded: ' + paymentIntent.status);
        }
        
      } catch (error) {
        // Retry failed, schedule next attempt
        const nextRetry = new Date(today);
        nextRetry.setDate(nextRetry.getDate() + (failed.retry_count + 1)); // Exponential backoff
        
        await base44.asServiceRole.entities.FailedPayment.update(failed.id, {
          status: 'pending_retry',
          next_retry_date: nextRetry.toISOString(),
          failure_reason: error.message
        });
        
        results.push({
          failedPaymentId: failed.id,
          status: 'retry_failed',
          nextRetry: nextRetry.toISOString(),
          error: error.message
        });
      }
    }
    
    return Response.json({
      success: true,
      results,
      summary: {
        total: results.length,
        resolved: results.filter(r => r.status === 'resolved').length,
        failed: results.filter(r => r.status === 'retry_failed').length,
        abandoned: results.filter(r => r.status === 'abandoned').length
      }
    });
    
  } catch (error) {
    console.error('Retry failed payments error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
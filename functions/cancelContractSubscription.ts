import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { subscriptionId, contractId, contractTitle } = await req.json();
    
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cancel the subscription
    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    // Create notification
    if (contractId && contractTitle) {
      await base44.asServiceRole.functions.invoke('createNotification', {
        userEmail: user.email,
        type: 'contract_cancelled',
        title: '🚫 Contract Cancelled',
        message: `Your contract "${contractTitle}" has been cancelled.`,
        contractId,
        actionUrl: 'MyContracts',
        priority: 'medium'
      });
    }

    return Response.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        canceled_at: subscription.canceled_at,
      }
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
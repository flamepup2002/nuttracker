import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove payment method ID from user
    await base44.auth.updateMe({
      stripe_payment_method_id: null
    });

    return Response.json({ 
      success: true,
      message: 'Payment method removed successfully'
    });
  } catch (error) {
    console.error('Error removing payment method:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
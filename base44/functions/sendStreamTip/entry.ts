import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { broadcasterId, amount, message } = await req.json();

    // Validate amount
    if (!amount || amount < 1) {
      return Response.json({ error: 'Invalid tip amount' }, { status: 400 });
    }

    // Check user has enough coins
    const currentBalance = user.currency_balance || 0;
    if (currentBalance < amount) {
      return Response.json({ 
        error: 'Insufficient coins',
        required: amount,
        current: currentBalance
      }, { status: 400 });
    }

    // Deduct coins from tipper
    const newBalance = currentBalance - amount;
    await base44.asServiceRole.auth.updateUser(user.email, {
      currency_balance: newBalance
    });

    // Get broadcaster user
    const broadcasterUsers = await base44.asServiceRole.entities.User.filter({ 
      email: broadcasterId 
    });
    
    if (broadcasterUsers.length === 0) {
      return Response.json({ error: 'Broadcaster not found' }, { status: 404 });
    }

    const broadcaster = broadcasterUsers[0];

    // Add coins to broadcaster (70% after platform fee)
    const broadcasterAmount = Math.floor(amount * 0.7);
    const broadcasterBalance = (broadcaster.currency_balance || 0) + broadcasterAmount;
    await base44.asServiceRole.auth.updateUser(broadcasterId, {
      currency_balance: broadcasterBalance
    });

    // Create tip record (optional - you can create a StreamTip entity if needed)
    // await base44.asServiceRole.entities.StreamTip.create({...})

    // Send notification to broadcaster
    await base44.asServiceRole.entities.Notification.create({
      created_by: broadcasterId,
      type: 'new_contract_offer', // Reusing type for now
      title: '💰 New Tip Received!',
      message: `${user.full_name || 'Someone'} tipped you ${broadcasterAmount} coins! (${amount} sent, 30% platform fee)`,
      priority: 'medium'
    });

    return Response.json({
      success: true,
      amount,
      broadcasterReceived: broadcasterAmount,
      newBalance,
      message: 'Tip sent successfully'
    });

  } catch (error) {
    console.error('Error sending tip:', error);
    return Response.json({ 
      error: error.message || 'Failed to send tip' 
    }, { status: 500 });
  }
});
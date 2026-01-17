import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userEmail, type, title, message, contractId, actionUrl, priority } = await req.json();

    if (!userEmail || !type || !title || !message) {
      return Response.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Check user's notification preferences
    const preferences = await base44.asServiceRole.entities.NotificationPreferences.filter({
      created_by: userEmail
    });

    const userPrefs = preferences[0] || {
      payment_due_enabled: true,
      payment_overdue_enabled: true,
      penalty_applied_enabled: true,
      collateral_liquidation_enabled: true,
      contract_status_enabled: true,
      new_contract_offers_enabled: true
    };

    // Check if this notification type is enabled
    const prefMap = {
      'payment_due': 'payment_due_enabled',
      'payment_overdue': 'payment_overdue_enabled',
      'penalty_applied': 'penalty_applied_enabled',
      'collateral_liquidation': 'collateral_liquidation_enabled',
      'contract_accepted': 'contract_status_enabled',
      'contract_cancelled': 'contract_status_enabled',
      'new_contract_offer': 'new_contract_offers_enabled'
    };

    const prefKey = prefMap[type];
    if (prefKey && userPrefs[prefKey] === false) {
      return Response.json({ 
        success: true, 
        skipped: true,
        reason: 'User has disabled this notification type'
      });
    }

    // Create notification with service role to ensure it's created for the target user
    const notification = await base44.asServiceRole.entities.Notification.create({
      type,
      title,
      message,
      contract_id: contractId,
      action_url: actionUrl,
      priority: priority || 'medium',
      created_by: userEmail
    });

    return Response.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});
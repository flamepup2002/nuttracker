import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active contracts
    const contracts = await base44.asServiceRole.entities.DebtContract.filter({
      is_accepted: true,
      cancelled_at: null
    });

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    const reminders = [];

    for (const contract of contracts) {
      if (!contract.next_payment_due) continue;

      const dueDate = new Date(contract.next_payment_due);
      
      // Check if payment is due in 3 days
      const daysDiff = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 3) {
        const totalOwed = contract.total_obligation - (contract.amount_paid || 0);

        // Send email reminder
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: contract.created_by,
          subject: `💳 Payment Due in 3 Days - ${contract.title}`,
          body: `Your payment for "${contract.title}" is due in 3 days.

Payment Due Date: ${dueDate.toLocaleDateString()}
Amount Due: $${contract.monthly_payment}
Remaining Balance: $${totalOwed.toFixed(2)}

Please ensure payment is made on time to avoid penalties.`
        });

        // Create notification
        await base44.asServiceRole.functions.invoke('createNotification', {
          userEmail: contract.created_by,
          type: 'payment_due',
          title: '💳 Payment Due Soon',
          message: `Payment for "${contract.title}" is due in 3 days. Amount: $${contract.monthly_payment}`,
          contractId: contract.id,
          actionUrl: 'MyContracts',
          priority: 'medium'
        });

        reminders.push({
          contractId: contract.id,
          contractTitle: contract.title,
          dueDate: dueDate.toISOString(),
          amount: contract.monthly_payment
        });
      }
    }

    return Response.json({
      success: true,
      remindersSent: reminders.length,
      reminders
    });
  } catch (error) {
    console.error('Send payment due reminders error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all active contracts
    const contracts = await base44.asServiceRole.entities.DebtContract.filter({ 
      is_accepted: true 
    });
    
    const today = new Date();
    const reminders = [];
    
    for (const contract of contracts) {
      if (!contract.next_payment_due) continue;
      
      const dueDate = new Date(contract.next_payment_due);
      const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      let reminderType = null;
      let subject = '';
      let urgency = '';
      
      // Determine reminder type
      if (daysUntil < 0) {
        // Overdue
        const daysOverdue = Math.abs(daysUntil);
        reminderType = 'overdue';
        subject = `🚨 URGENT: Contract Payment ${daysOverdue} Days OVERDUE`;
        urgency = 'CRITICAL';
        
        // Calculate penalty
        const penaltyAmount = contract.monthly_payment * (contract.penalty_percentage / 100);
        
      } else if (daysUntil === 0) {
        // Due today
        reminderType = 'due_today';
        subject = `⚠️ Payment Due TODAY - ${contract.title}`;
        urgency = 'HIGH';
        
      } else if (daysUntil === 1) {
        // Due tomorrow
        reminderType = 'due_tomorrow';
        subject = `⏰ Payment Due Tomorrow - ${contract.title}`;
        urgency = 'MEDIUM';
        
      } else if (daysUntil === 3) {
        // 3 days warning
        reminderType = 'due_soon_3days';
        subject = `📅 Payment Due in 3 Days - ${contract.title}`;
        urgency = 'MEDIUM';
        
      } else if (daysUntil === 7) {
        // 7 days warning
        reminderType = 'due_soon_7days';
        subject = `📌 Payment Due in 1 Week - ${contract.title}`;
        urgency = 'LOW';
      }
      
      if (reminderType) {
        // Get user email
        const userEmail = contract.created_by;
        
        // Calculate penalty if overdue
        let penaltyInfo = '';
        if (daysUntil < 0) {
          const penaltyAmount = contract.monthly_payment * (contract.penalty_percentage / 100);
          penaltyInfo = `
⚠️ PENALTY APPLIED: ${contract.penalty_percentage}% = $${penaltyAmount.toFixed(2)}
Total Now Due: $${(contract.monthly_payment + penaltyAmount).toFixed(2)}
`;
          
          if (contract.custom_penalty_clause) {
            penaltyInfo += `
⚠️ CUSTOM PENALTY: ${contract.custom_penalty_clause}
`;
          }
          
          if (contract.collateral_type && contract.collateral_type !== 'none') {
            penaltyInfo += `
🏚️ COLLATERAL AT RISK: Your ${contract.collateral_type.replace('_', ' ')} may be seized!
`;
          }
        }
        
        // Interest warning
        let interestInfo = '';
        if (contract.interest_rate > 0) {
          interestInfo = `
📈 Interest: ${contract.interest_rate}% compounding ${contract.compound_frequency}
Unpaid balances will continue to grow exponentially.
`;
        }
        
        // Send email
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: userEmail,
            subject: subject,
            body: `
${urgency} PRIORITY - Contract Payment Reminder

Contract: ${contract.title}
Payment Amount: $${contract.monthly_payment}
Due Date: ${dueDate.toLocaleDateString()}
Status: ${reminderType.replace('_', ' ').toUpperCase()}

${penaltyInfo}
${interestInfo}

Contract Details:
- Duration: ${contract.duration_months ? `${contract.duration_months} months` : 'Permanent'}
- Total Obligation: $${contract.total_obligation}
- Amount Paid: $${contract.amount_paid || 0}

${daysUntil < 0 ? '⚠️ YOUR PAYMENT IS OVERDUE! Act immediately to avoid further penalties.' : ''}
${daysUntil === 0 ? '⚠️ Payment is due TODAY! Ensure payment is processed to avoid penalties.' : ''}
${daysUntil > 0 ? `You have ${daysUntil} day(s) remaining to make your payment.` : ''}

Payment will be automatically charged to your saved payment method.

${contract.stripe_subscription_id ? 'This is an automated recurring payment - ensure your payment method is valid.' : 'Please ensure sufficient funds are available.'}

Login to view your contract: https://your-app.base44.com

---
This is an automated reminder for contract: ${contract.id}
            `
          });
          
          reminders.push({
            contractId: contract.id,
            userEmail,
            reminderType,
            daysUntil,
            success: true
          });
          
        } catch (emailError) {
          console.error(`Failed to send reminder for contract ${contract.id}:`, emailError);
          reminders.push({
            contractId: contract.id,
            userEmail,
            reminderType,
            daysUntil,
            success: false,
            error: emailError.message
          });
        }
      }
    }
    
    return Response.json({
      success: true,
      reminders,
      summary: {
        total: reminders.length,
        successful: reminders.filter(r => r.success).length,
        failed: reminders.filter(r => !r.success).length,
        byType: {
          overdue: reminders.filter(r => r.reminderType === 'overdue').length,
          due_today: reminders.filter(r => r.reminderType === 'due_today').length,
          due_tomorrow: reminders.filter(r => r.reminderType === 'due_tomorrow').length,
          due_soon_3days: reminders.filter(r => r.reminderType === 'due_soon_3days').length,
          due_soon_7days: reminders.filter(r => r.reminderType === 'due_soon_7days').length,
        }
      }
    });
    
  } catch (error) {
    console.error('Payment reminder error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
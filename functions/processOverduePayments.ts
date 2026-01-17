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
    const actions = [];

    for (const contract of contracts) {
      if (!contract.next_payment_due) continue;

      const dueDate = new Date(contract.next_payment_due);
      const daysPastDue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

      if (daysPastDue <= 0) continue; // Not overdue

      // Calculate penalty amount
      const penaltyPercentage = contract.penalty_percentage || 5;
      const penaltyAmount = contract.monthly_payment * (penaltyPercentage / 100);
      const totalOwed = contract.total_obligation - (contract.amount_paid || 0);

      // Stage 1: 3 days overdue - First warning
      if (daysPastDue === 3) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: contract.created_by,
          subject: '⚠️ Payment Overdue - First Notice',
          body: `Your payment for "${contract.title}" is 3 days overdue.

Payment Due: ${dueDate.toLocaleDateString()}
Amount Due: $${contract.monthly_payment}
Penalty if not paid within 2 days: $${penaltyAmount.toFixed(2)} (${penaltyPercentage}%)

Please make payment immediately to avoid penalties.
Remaining balance: $${totalOwed.toFixed(2)}`
        });

        actions.push({
          contractId: contract.id,
          action: 'first_warning',
          daysPastDue
        });
      }

      // Stage 2: 5 days overdue - Apply penalty and second warning
      if (daysPastDue === 5) {
        // Apply penalty to total obligation
        const newTotalObligation = contract.total_obligation + penaltyAmount;
        
        await base44.asServiceRole.entities.DebtContract.update(contract.id, {
          total_obligation: newTotalObligation
        });

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: contract.created_by,
          subject: '🚨 Payment Overdue - Penalty Applied',
          body: `Your payment for "${contract.title}" is now 5 days overdue.

PENALTY APPLIED: $${penaltyAmount.toFixed(2)} (${penaltyPercentage}%)
New Total Owed: $${(totalOwed + penaltyAmount).toFixed(2)}

${contract.collateral_type && contract.collateral_type !== 'none' 
  ? '⚠️ WARNING: Your pledged collateral (' + contract.collateral_type + ') will be liquidated in 2 days if payment is not received.'
  : 'Payment must be received immediately to avoid further penalties.'}

Monthly Payment: $${contract.monthly_payment}
Days Overdue: ${daysPastDue}`
        });

        actions.push({
          contractId: contract.id,
          action: 'penalty_applied',
          penaltyAmount,
          daysPastDue
        });
      }

      // Stage 3: 7 days overdue with collateral - Final warning before liquidation
      if (daysPastDue === 7 && contract.collateral_type && contract.collateral_type !== 'none' && !contract.in_liquidation) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: contract.created_by,
          subject: '🔴 FINAL WARNING - Asset Liquidation Imminent',
          body: `CRITICAL: Your payment for "${contract.title}" is 7 days overdue.

Your pledged collateral (${contract.collateral_type}) will be automatically liquidated within 24 hours if payment is not received.

Amount Owed: $${totalOwed.toFixed(2)}
Payment Required: $${contract.monthly_payment}
Days Overdue: ${daysPastDue}

This is your final opportunity to avoid asset liquidation. Make payment immediately.`
        });

        actions.push({
          contractId: contract.id,
          action: 'final_warning',
          daysPastDue,
          willLiquidate: true
        });
      }

      // Stage 4: 10+ days overdue - Regular reminder
      if (daysPastDue >= 10 && daysPastDue % 7 === 0) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: contract.created_by,
          subject: `Payment Overdue - ${daysPastDue} Days`,
          body: `Your payment for "${contract.title}" is ${daysPastDue} days overdue.

Total Amount Owed: $${totalOwed.toFixed(2)}
${contract.in_liquidation ? 'Asset liquidation is in progress.' : 'Further penalties may apply.'}

Please contact support or make payment immediately.`
        });

        actions.push({
          contractId: contract.id,
          action: 'reminder',
          daysPastDue
        });
      }
    }

    return Response.json({
      success: true,
      actionsProcessed: actions.length,
      details: actions
    });
  } catch (error) {
    console.error('Process overdue payments error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});
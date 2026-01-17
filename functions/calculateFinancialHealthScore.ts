import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all relevant data
    const [contracts, payments, assets] = await Promise.all([
      base44.entities.DebtContract.filter({ is_accepted: true }),
      base44.entities.Payment.list(),
      base44.entities.UserAsset.list()
    ]);

    const failedPayments = await base44.entities.FailedPayment.list();

    // Calculate metrics
    const now = new Date();
    const totalAssetValue = assets.reduce((sum, a) => sum + a.estimated_value, 0);
    const totalDebt = contracts
      .filter(c => !c.cancelled_at)
      .reduce((sum, c) => sum + (c.total_obligation - c.amount_paid), 0);
    
    const activeContracts = contracts.filter(c => !c.cancelled_at);
    const completedContracts = contracts.filter(c => c.cancelled_at && c.amount_paid >= c.total_obligation);
    
    // Payment timeliness
    const overdueContracts = activeContracts.filter(c => {
      const dueDate = new Date(c.next_payment_due);
      return dueDate < now;
    });
    
    const totalPaymentsExpected = activeContracts.length;
    const onTimePayments = totalPaymentsExpected - overdueContracts.length;
    const paymentTimeliness = totalPaymentsExpected > 0 
      ? (onTimePayments / totalPaymentsExpected) * 100 
      : 100;

    // Debt-to-Asset Ratio
    const debtToAssetRatio = totalAssetValue > 0 ? (totalDebt / totalAssetValue) : 0;

    // Score calculation (0-1000 points)
    let score = 500; // Base score

    // Payment timeliness (0-300 points)
    score += (paymentTimeliness / 100) * 300;

    // Debt-to-Asset ratio (0-250 points, inverse relationship)
    if (debtToAssetRatio === 0) {
      score += 250;
    } else if (debtToAssetRatio < 0.3) {
      score += 200;
    } else if (debtToAssetRatio < 0.5) {
      score += 150;
    } else if (debtToAssetRatio < 0.8) {
      score += 100;
    } else {
      score += Math.max(0, 100 - (debtToAssetRatio * 50));
    }

    // Contract history bonus (0-200 points)
    const contractScore = Math.min(200, completedContracts.length * 20);
    score += contractScore;

    // Penalties
    score -= failedPayments.filter(p => p.status !== 'resolved').length * 50;
    score -= overdueContracts.length * 30;
    if (activeContracts.some(c => c.in_liquidation)) score -= 150;

    // Cap score between 300-1000
    score = Math.max(300, Math.min(1000, Math.round(score)));

    // Determine grade
    let grade, color;
    if (score >= 850) { grade = 'A+'; color = 'green'; }
    else if (score >= 750) { grade = 'A'; color = 'green'; }
    else if (score >= 650) { grade = 'B'; color = 'blue'; }
    else if (score >= 550) { grade = 'C'; color = 'yellow'; }
    else if (score >= 450) { grade = 'D'; color = 'orange'; }
    else { grade = 'F'; color = 'red'; }

    // Generate insights and recommendations
    const insights = [];
    const recommendations = [];

    if (paymentTimeliness < 80) {
      insights.push(`Payment timeliness at ${paymentTimeliness.toFixed(0)}% - needs improvement`);
      recommendations.push('Set up automatic payments to avoid missing due dates');
    }

    if (debtToAssetRatio > 0.7) {
      insights.push(`High debt-to-asset ratio: ${(debtToAssetRatio * 100).toFixed(0)}%`);
      recommendations.push('Focus on paying down debt or increasing asset value');
    } else if (debtToAssetRatio > 0.5) {
      insights.push(`Moderate debt-to-asset ratio: ${(debtToAssetRatio * 100).toFixed(0)}%`);
      recommendations.push('Consider building more assets to improve ratio');
    }

    if (overdueContracts.length > 0) {
      insights.push(`${overdueContracts.length} overdue contracts detected`);
      recommendations.push('Address overdue payments immediately to avoid penalties');
    }

    if (failedPayments.filter(p => p.status !== 'resolved').length > 0) {
      insights.push('Unresolved failed payments affecting score');
      recommendations.push('Update payment method to resolve failed transactions');
    }

    if (totalAssetValue === 0) {
      insights.push('No assets on record');
      recommendations.push('Add your assets to improve your financial profile');
    }

    if (completedContracts.length > 0) {
      insights.push(`${completedContracts.length} contracts completed successfully`);
    }

    // Positive insights
    if (paymentTimeliness >= 95) {
      insights.push('Excellent payment history!');
    }
    if (debtToAssetRatio < 0.3 && totalAssetValue > 0) {
      insights.push('Strong asset base with low debt');
    }

    return Response.json({
      success: true,
      score,
      grade,
      color,
      metrics: {
        totalAssetValue,
        totalDebt,
        debtToAssetRatio: Math.round(debtToAssetRatio * 100),
        paymentTimeliness: Math.round(paymentTimeliness),
        activeContracts: activeContracts.length,
        completedContracts: completedContracts.length,
        overdueContracts: overdueContracts.length,
        failedPayments: failedPayments.filter(p => p.status !== 'resolved').length
      },
      insights,
      recommendations
    });
  } catch (error) {
    console.error('Calculate score error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});
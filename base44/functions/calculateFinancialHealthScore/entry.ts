import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all relevant data
    const [contracts, payments, assets, failedPayments] = await Promise.all([
      base44.entities.DebtContract.filter({ is_accepted: true }),
      base44.entities.Payment.list(),
      base44.entities.UserAsset.list(),
      base44.entities.FailedPayment.list()
    ]);

    // Calculate user tenure (days since registration)
    const userCreatedDate = new Date(user.created_date);
    const daysSinceRegistration = Math.floor((now - userCreatedDate) / (1000 * 60 * 60 * 24));

    // Calculate metrics
    const now = new Date();
    const totalAssetValue = assets.reduce((sum, a) => sum + a.estimated_value, 0);
    const totalDebt = contracts
      .filter(c => !c.cancelled_at)
      .reduce((sum, c) => sum + (c.total_obligation - c.amount_paid), 0);
    
    const activeContracts = contracts.filter(c => !c.cancelled_at);
    const completedContracts = contracts.filter(c => c.cancelled_at && c.amount_paid >= c.total_obligation);
    
    // Payment timeliness - Enhanced with payment history
    const overdueContracts = activeContracts.filter(c => {
      const dueDate = new Date(c.next_payment_due);
      return dueDate < now;
    });
    
    // Calculate historical payment performance
    const successfulPayments = payments.filter(p => p.status === 'succeeded').length;
    const totalPaymentAttempts = payments.length;
    const historicalPaymentRate = totalPaymentAttempts > 0 
      ? (successfulPayments / totalPaymentAttempts) * 100 
      : 100;
    
    // Current timeliness
    const totalPaymentsExpected = activeContracts.length;
    const onTimePayments = totalPaymentsExpected - overdueContracts.length;
    const currentTimeliness = totalPaymentsExpected > 0 
      ? (onTimePayments / totalPaymentsExpected) * 100 
      : 100;
    
    // Combined payment timeliness (70% historical, 30% current)
    const paymentTimeliness = (historicalPaymentRate * 0.7) + (currentTimeliness * 0.3);

    // Debt-to-Asset Ratio
    const debtToAssetRatio = totalAssetValue > 0 ? (totalDebt / totalAssetValue) : 0;

    // Contract diversity - having multiple contract types shows engagement
    const contractTypes = new Set(contracts.map(c => c.intensity_level)).size;
    
    // Average payment amount (indicates financial capacity)
    const avgPaymentAmount = payments.length > 0 
      ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length 
      : 0;
    
    // Platform engagement score
    const engagementScore = Math.min(100, (daysSinceRegistration / 365) * 100); // Max 100 for 1+ year

    // Score calculation (0-1000 points)
    let score = 400; // Base score

    // Payment timeliness (0-280 points)
    score += (paymentTimeliness / 100) * 280;

    // Debt-to-Asset ratio (0-200 points, inverse relationship)
    if (debtToAssetRatio === 0) {
      score += 200;
    } else if (debtToAssetRatio < 0.3) {
      score += 160;
    } else if (debtToAssetRatio < 0.5) {
      score += 120;
    } else if (debtToAssetRatio < 0.8) {
      score += 80;
    } else {
      score += Math.max(0, 80 - (debtToAssetRatio * 40));
    }

    // Contract history and diversity (0-150 points)
    const contractHistoryScore = Math.min(120, completedContracts.length * 15);
    const contractDiversityBonus = Math.min(30, contractTypes * 10);
    score += contractHistoryScore + contractDiversityBonus;

    // Active contract management (0-100 points)
    // Reward having manageable number of contracts (sweet spot: 1-3)
    if (activeContracts.length === 0) {
      score += 50; // No debt is good
    } else if (activeContracts.length <= 3) {
      score += 100; // Optimal range
    } else if (activeContracts.length <= 5) {
      score += 70; // Moderate
    } else {
      score += Math.max(0, 50 - (activeContracts.length * 5)); // Too many contracts
    }

    // Platform engagement bonus (0-70 points)
    score += (engagementScore / 100) * 70;
    
    // Payment capacity indicator (0-50 points based on avg payment size)
    if (avgPaymentAmount > 0) {
      const capacityScore = Math.min(50, (avgPaymentAmount / 50) * 50); // $50+ avg = max score
      score += capacityScore;
    }

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

    // Generate insights and recommendations with impact scores
    const insights = [];
    const recommendations = [];

    // Payment history analysis
    if (paymentTimeliness < 80) {
      insights.push(`Payment reliability at ${paymentTimeliness.toFixed(0)}% - major score impact`);
      recommendations.push({
        action: 'Set up automatic payments to never miss due dates',
        impact: 'High',
        potentialPoints: Math.round((100 - paymentTimeliness) * 2.8)
      });
    } else if (paymentTimeliness < 95) {
      recommendations.push({
        action: 'Improve payment timeliness to 95%+ for score boost',
        impact: 'Medium',
        potentialPoints: Math.round((100 - paymentTimeliness) * 2.8)
      });
    }

    // Debt management
    if (debtToAssetRatio > 0.7) {
      insights.push(`High debt-to-asset ratio: ${(debtToAssetRatio * 100).toFixed(0)}%`);
      recommendations.push({
        action: 'Pay down debt or add assets to reach <50% ratio',
        impact: 'High',
        potentialPoints: 80
      });
    } else if (debtToAssetRatio > 0.5) {
      insights.push(`Moderate debt-to-asset ratio: ${(debtToAssetRatio * 100).toFixed(0)}%`);
      recommendations.push({
        action: 'Reduce debt-to-asset ratio to <30% for optimal score',
        impact: 'Medium',
        potentialPoints: 40
      });
    }

    // Active contracts
    if (activeContracts.length > 5) {
      insights.push(`Managing ${activeContracts.length} active contracts - consider consolidation`);
      recommendations.push({
        action: 'Reduce active contracts to 3 or fewer for better management',
        impact: 'Medium',
        potentialPoints: 30
      });
    } else if (activeContracts.length > 3) {
      recommendations.push({
        action: 'Maintain 1-3 active contracts for optimal score',
        impact: 'Low',
        potentialPoints: 15
      });
    }

    // Overdue items
    if (overdueContracts.length > 0) {
      insights.push(`⚠️ ${overdueContracts.length} overdue contract${overdueContracts.length > 1 ? 's' : ''} - immediate attention required`);
      recommendations.push({
        action: 'Make overdue payments immediately to stop penalties',
        impact: 'Critical',
        potentialPoints: overdueContracts.length * 30
      });
    }

    // Failed payments
    const unresolvedFailures = failedPayments.filter(p => p.status !== 'resolved').length;
    if (unresolvedFailures > 0) {
      insights.push(`${unresolvedFailures} unresolved failed payment${unresolvedFailures > 1 ? 's' : ''}`);
      recommendations.push({
        action: 'Update payment method and resolve failed transactions',
        impact: 'High',
        potentialPoints: unresolvedFailures * 50
      });
    }

    // Asset building
    if (totalAssetValue === 0) {
      insights.push('No assets on record - missing score opportunities');
      recommendations.push({
        action: 'Add your assets (property, vehicles, savings) to profile',
        impact: 'High',
        potentialPoints: 100
      });
    } else if (totalAssetValue < 10000) {
      recommendations.push({
        action: 'Increase tracked assets to strengthen financial position',
        impact: 'Medium',
        potentialPoints: 40
      });
    }

    // Contract completion
    if (completedContracts.length === 0 && contracts.length > 0) {
      recommendations.push({
        action: 'Complete your first contract to establish payment history',
        impact: 'Medium',
        potentialPoints: 15
      });
    } else if (completedContracts.length < 5) {
      recommendations.push({
        action: 'Build contract completion history (target: 5+ completions)',
        impact: 'Low',
        potentialPoints: (5 - completedContracts.length) * 15
      });
    }

    // Platform tenure
    if (daysSinceRegistration < 30) {
      insights.push(`New member (${daysSinceRegistration} days) - score will improve with time`);
      recommendations.push({
        action: 'Continue active platform engagement for tenure bonus',
        impact: 'Low',
        potentialPoints: 20
      });
    }

    // Positive insights
    if (completedContracts.length > 0) {
      insights.push(`✅ ${completedContracts.length} contract${completedContracts.length > 1 ? 's' : ''} completed successfully`);
    }
    if (paymentTimeliness >= 95) {
      insights.push('🌟 Outstanding payment reliability!');
    }
    if (debtToAssetRatio < 0.3 && totalAssetValue > 0) {
      insights.push('💪 Strong financial foundation with healthy debt ratio');
    }
    if (activeContracts.length >= 1 && activeContracts.length <= 3) {
      insights.push('👍 Optimal number of active contracts');
    }
    if (engagementScore > 50) {
      insights.push(`🎯 Established member (${Math.floor(daysSinceRegistration / 30)} months)`);
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
        failedPayments: failedPayments.filter(p => p.status !== 'resolved').length,
        daysSinceRegistration,
        contractDiversity: contractTypes,
        avgPaymentAmount: Math.round(avgPaymentAmount),
        totalPayments: payments.length,
        successfulPayments
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
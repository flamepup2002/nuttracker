import { base44 } from '@/api/base44Client';

// When an admin attempts to cancel an irrevocable contract, the cancellation is
// BLOCKED. Instead: a 12-month penalty is applied to the original contract and a
// second penalty contract is created on the user's account.
export async function applyIrrevocableAdminPenalty(contract) {
  const penaltyAmount = (contract.monthly_payment || 0) * 12;

  // 1. Add 12-month penalty to the original contract (do NOT cancel it)
  await base44.entities.DebtContract.update(contract.id, {
    cancellation_penalty_triggered: true,
    cancellation_penalty_amount: (contract.cancellation_penalty_amount || 0) + penaltyAmount,
    total_obligation: (contract.total_obligation || 0) + penaltyAmount,
  });

  // 2. Create a second penalty contract
  const penaltyContract = await base44.entities.DebtContract.create({
    title: `PENALTY CONTRACT — ${contract.title}`,
    description: `Auto-generated penalty contract. An administrator attempted to cancel the irrevocable contract "${contract.title}". Per the irrevocable terms, cancellation was denied and a 12-month penalty has been imposed.`,
    intensity_level: contract.intensity_level || 'extreme',
    monthly_payment: contract.monthly_payment || 0,
    duration_months: 12,
    total_obligation: penaltyAmount,
    penalty_percentage: contract.penalty_percentage || 5,
    payment_frequency: contract.payment_frequency || 'monthly',
    terms: [
      'Irrevocable cancellation-attempt penalty',
      `12-month penalty obligation of $${penaltyAmount.toFixed(2)}`,
      'Auto-created when an admin attempted to cancel an irrevocable contract',
      'Criminal charges apply for non-payment',
    ],
    is_accepted: true,
    accepted_at: new Date().toISOString(),
    cancellation_irrevocable: true,
    next_payment_due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // 3. Notify the user
  await base44.entities.Notification.create({
    type: 'penalty_applied',
    title: '🔒 Irrevocable Cancellation Attempted',
    message: `An admin attempted to cancel your irrevocable contract "${contract.title}". Cancellation was DENIED. A 12-month penalty of $${penaltyAmount.toFixed(2)} has been added and a second penalty contract has been created.`,
    contract_id: contract.id,
    action_url: 'MyContracts',
    priority: 'urgent',
    is_read: false,
  });

  return { penaltyAmount, penaltyContractId: penaltyContract.id };
}
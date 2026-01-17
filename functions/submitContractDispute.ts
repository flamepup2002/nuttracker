import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { contractId, reason } = await req.json();
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get contract details
    const contract = await base44.entities.DebtContract.get(contractId);
    if (!contract) {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Send email notification to admin (simulate dispute submission)
    await base44.integrations.Core.SendEmail({
      to: 'admin@nuttracker.com',
      subject: `Contract Dispute Submitted - ${contract.title}`,
      body: `
        User: ${user.email}
        Contract: ${contract.title}
        Contract ID: ${contractId}
        
        Dispute Reason:
        ${reason}
        
        Contract Details:
        - Monthly Payment: $${contract.monthly_payment}
        - Duration: ${contract.duration_months || 'Perpetual'}
        - Total Obligation: $${contract.total_obligation}
        - Accepted At: ${contract.accepted_at}
        
        Please review this dispute and take appropriate action.
      `
    });

    return Response.json({
      success: true,
      message: 'Dispute submitted successfully'
    });
  } catch (error) {
    console.error('Dispute submission error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
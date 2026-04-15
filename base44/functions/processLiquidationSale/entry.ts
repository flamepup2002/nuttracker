import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { listingId } = await req.json();

    // Get the liquidation listing
    const listing = await base44.asServiceRole.entities.AssetListing.filter({ id: listingId });
    if (!listing || listing.length === 0) {
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }

    const auction = listing[0];
    
    if (!auction.is_liquidation || !auction.contract_id) {
      return Response.json({ error: 'Not a liquidation auction' }, { status: 400 });
    }

    // Get the contract
    const contract = await base44.asServiceRole.entities.DebtContract.filter({ id: auction.contract_id });
    if (!contract || contract.length === 0) {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }

    const debtContract = contract[0];
    const saleProceeds = auction.current_bid;
    const remainingDebt = debtContract.total_obligation - debtContract.amount_paid;

    // Apply proceeds to contract
    const newAmountPaid = debtContract.amount_paid + saleProceeds;
    const isFullyPaid = newAmountPaid >= debtContract.total_obligation;

    await base44.asServiceRole.entities.DebtContract.update(debtContract.id, {
      amount_paid: newAmountPaid,
      in_liquidation: false,
      liquidation_completed_at: new Date().toISOString(),
      ...(isFullyPaid && { cancelled_at: new Date().toISOString() })
    });

    // Mark listing as sold
    await base44.asServiceRole.entities.AssetListing.update(auction.id, {
      status: 'sold'
    });

    // Delete the user asset (it's been sold)
    if (auction.user_asset_id) {
      await base44.asServiceRole.entities.UserAsset.delete(auction.user_asset_id);
    }

    // Send notification email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: debtContract.created_by,
      subject: 'Asset Liquidation Completed',
      body: `Your asset "${auction.title}" has been sold for $${saleProceeds.toLocaleString()}.

Proceeds applied to contract: "${debtContract.title}"
Amount applied: $${saleProceeds.toLocaleString()}
${isFullyPaid 
  ? '✅ Contract is now fully paid and closed!' 
  : `Remaining balance: $${(remainingDebt - saleProceeds).toLocaleString()}`
}`
    });

    // Create notification
    await base44.asServiceRole.functions.invoke('createNotification', {
      userEmail: debtContract.created_by,
      type: 'collateral_liquidation',
      title: '✅ Collateral Liquidation Complete',
      message: `Your asset sold for $${saleProceeds.toFixed(2)}. Applied to "${debtContract.title}". Remaining balance: $${Math.max(0, remainingDebt - saleProceeds).toFixed(2)}`,
      contractId: debtContract.id,
      actionUrl: 'MyContracts',
      priority: 'high'
    });

    return Response.json({
      success: true,
      saleProceeds,
      appliedToContract: debtContract.id,
      remainingDebt: Math.max(0, remainingDebt - saleProceeds),
      contractFullyPaid: isFullyPaid
    });
  } catch (error) {
    console.error('Process liquidation error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});
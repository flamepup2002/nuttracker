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
    const liquidations = [];

    for (const contract of contracts) {
      // Skip if no collateral or already in liquidation
      if (!contract.collateral_type || contract.collateral_type === 'none') continue;
      if (contract.in_liquidation) continue;

      // Check if payment is overdue (more than 7 days past due)
      const nextPaymentDue = new Date(contract.next_payment_due);
      const daysPastDue = Math.floor((now - nextPaymentDue) / (1000 * 60 * 60 * 24));

      if (daysPastDue >= 7) {
        // Find user's assets matching collateral type
        const userAssets = await base44.asServiceRole.entities.UserAsset.filter({
          created_by: contract.created_by,
          asset_type: contract.collateral_type,
          is_pledged_as_collateral: false
        });

        if (userAssets.length > 0) {
          // Take the first available asset
          const asset = userAssets[0];

          // Mark asset as pledged
          await base44.asServiceRole.entities.UserAsset.update(asset.id, {
            is_pledged_as_collateral: true,
            pledged_to_contract_id: contract.id
          });

          // Create liquidation auction (7-day auction)
          const auctionEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          
          const listing = await base44.asServiceRole.entities.AssetListing.create({
            seller_email: contract.created_by,
            asset_type: asset.asset_type,
            title: `LIQUIDATION: ${asset.name}`,
            description: `Forced liquidation for overdue contract. ${asset.description || ''}`,
            initial_value: asset.estimated_value * 0.7, // Start at 70% of estimated value
            current_bid: asset.estimated_value * 0.7,
            status: 'active',
            ends_at: auctionEnd.toISOString(),
            is_liquidation: true,
            contract_id: contract.id,
            user_asset_id: asset.id
          });

          // Mark contract as in liquidation
          await base44.asServiceRole.entities.DebtContract.update(contract.id, {
            in_liquidation: true,
            liquidation_started_at: now.toISOString()
          });

          // Send notification email
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: contract.created_by,
            subject: '⚠️ Asset Liquidation Initiated - Overdue Payment',
            body: `Your ${asset.name} is being liquidated due to ${daysPastDue} days overdue payment on contract "${contract.title}".
            
The auction will run for 7 days. Proceeds will be applied to your outstanding balance.

View liquidation: ${Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com'}/asset-auction

Outstanding amount: $${contract.total_obligation - contract.amount_paid}`
          });

          liquidations.push({
            contractId: contract.id,
            assetId: asset.id,
            listingId: listing.id,
            daysPastDue
          });
        }
      }
    }

    return Response.json({
      success: true,
      liquidationsInitiated: liquidations.length,
      details: liquidations
    });
  } catch (error) {
    console.error('Liquidation check error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});
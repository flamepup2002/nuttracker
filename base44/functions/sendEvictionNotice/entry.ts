import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all sold house listings
    const soldListings = await base44.asServiceRole.entities.HouseListing.filter({
      status: 'sold'
    });

    let noticesSent = 0;

    for (const listing of soldListings) {
      // Check if notice already sent (we can track this via a field or by checking sent_eviction_notice_at)
      if (listing.sent_eviction_notice_at) {
        continue;
      }

      const sellerEmail = listing.seller_email;
      const buyerEmail = listing.highest_bidder_email;
      const salePrice = listing.current_bid;

      // Send eviction notice to seller
      await base44.integrations.Core.SendEmail({
        to: sellerEmail,
        subject: '30-DAY EVICTION NOTICE',
        body: `
Your house has been sold in the House Auction!

EVICTION DETAILS:
- Property Sold To: ${buyerEmail}
- Sale Price: $${salePrice.toLocaleString()}
- Eviction Notice Period: 30 Days
- Vacate By: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}

You have 30 days from this notice to vacate the property. Failure to comply may result in legal action.

This is part of the extreme findom simulation on NUT Tracker.
        `.trim()
      });

      // Mark as sent
      await base44.asServiceRole.entities.HouseListing.update(listing.id, {
        sent_eviction_notice_at: new Date().toISOString()
      });

      noticesSent++;
    }

    return Response.json({ 
      success: true, 
      noticesSent,
      message: `Sent ${noticesSent} eviction notices`
    });
  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { listingId } = await req.json();

    if (!listingId) {
      return Response.json({ error: 'Missing listingId' }, { status: 400 });
    }

    // Fetch the listing
    const listing = await base44.entities.HouseListing.filter({
      id: listingId
    });

    if (!listing || listing.length === 0) {
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }

    const houseData = listing[0];

    // Send email to seller
    await base44.integrations.Core.SendEmail({
      to: houseData.seller_email,
      subject: '🎉 Your House Has Been Sold!',
      body: `
Congratulations! Your house auction has ended.

Property Details:
- Starting Bid: $${houseData.initial_value.toLocaleString()}
- Final Bid: $${houseData.current_bid.toLocaleString()}
- Winning Bidder: ${houseData.highest_bidder_email}

The ${houseData.current_bid.toLocaleString()} kinkcoins have been added to your account.

Visit the app to view more details.
      `.trim()
    });

    // Update listing status to sold
    await base44.asServiceRole.entities.HouseListing.update(listingId, {
      status: 'sold'
    });

    return Response.json({ success: true, message: 'Email sent and listing marked as sold' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
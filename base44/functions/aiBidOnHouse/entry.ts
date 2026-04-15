import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const AI_EMAIL = 'ai.bidder@nuttracker.ai';

async function bidOnListing(base44, listing) {
  if (listing.highest_bidder_email === AI_EMAIL) return null;

  const currentBid = listing.current_bid || listing.initial_value || 0;
  const incrementPercent = 0.05 + Math.random() * 0.20;
  const newBid = Math.ceil(currentBid * (1 + incrementPercent) / 1000) * 1000;

  await base44.asServiceRole.entities.HouseListing.update(listing.id, {
    current_bid: newBid,
    highest_bidder_email: AI_EMAIL,
  });

  return newBid;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const { listingId } = body;

    // Single listing mode (triggered after a user bids)
    if (listingId) {
      const listing = await base44.asServiceRole.entities.HouseListing.get(listingId);
      if (!listing || listing.status !== 'active') {
        return Response.json({ success: false, error: 'Listing not found or not active' }, { status: 404 });
      }
      const newBid = await bidOnListing(base44, listing);
      if (!newBid) return Response.json({ success: false, message: 'AI already has highest bid' });
      return Response.json({ success: true, newBid, message: `AI bid $${newBid.toLocaleString()}` });
    }

    // Autonomous mode — bid on ALL active listings AI doesn't already lead
    const listings = await base44.asServiceRole.entities.HouseListing.filter({ status: 'active' });
    const results = [];
    for (const listing of listings) {
      const newBid = await bidOnListing(base44, listing);
      if (newBid) results.push({ id: listing.id, newBid });
    }

    return Response.json({ success: true, bidsPlaced: results.length, results });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});
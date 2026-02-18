import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import OpenAI from 'npm:openai';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { listingId } = await req.json();

    // Get the listing
    const listing = await base44.asServiceRole.entities.HouseListing.get(listingId);
    if (!listing || listing.status !== 'active') {
      return Response.json({ success: false, error: 'Listing not found or not active' }, { status: 404 });
    }

    const currentBid = listing.current_bid || listing.initial_value || 0;

    // AI decides how much to outbid by - random aggressive increment between 5% and 25%
    const incrementPercent = 0.05 + Math.random() * 0.20;
    const newBid = Math.ceil(currentBid * (1 + incrementPercent) / 1000) * 1000;

    // AI always outbids as long as it's not already the highest bidder
    if (listing.highest_bidder_email === 'ai.bidder@nuttracker.ai') {
      return Response.json({ success: false, message: 'AI already has highest bid' });
    }

    await base44.asServiceRole.entities.HouseListing.update(listingId, {
      current_bid: newBid,
      highest_bidder_email: 'ai.bidder@nuttracker.ai',
    });

    return Response.json({ success: true, newBid, message: `AI bid $${newBid.toLocaleString()}` });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});
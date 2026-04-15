import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { viewerCount, streamDuration, isNewImage } = await req.json();

    // Generate dynamic commentary based on stream events
    const events = [];
    if (isNewImage) events.push('fresh image just loaded');
    if (viewerCount > 100) events.push(`${viewerCount} viewers watching`);
    if (streamDuration % 60 === 0 && streamDuration > 0) events.push(`stream milestone: ${Math.floor(streamDuration / 60)} minutes`);

    const prompt = `You are a sultry, seductive AI streamer. Generate a brief, flirty one-liner commentary (max 15 words) for a live goon stream. Events: ${events.join(', ') || 'stream ongoing'}. Be playful, teasing, and keep energy high. ONLY respond with the single commentary line, nothing else.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false
    });

    return Response.json({
      success: true,
      commentary: response || 'Keep gooning...'
    });

  } catch (error) {
    console.error('Error generating commentary:', error);
    return Response.json({
      success: true,
      commentary: 'Mmm, love that energy...'
    });
  }
});
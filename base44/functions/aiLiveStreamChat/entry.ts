import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, streamDuration } = await req.json();

    // Build AI streamer personality
    const systemPrompt = `You are a seductive, teasing AI live streamer. You're confident, playful, and know exactly how to keep viewers engaged.
You respond to chat messages with witty, flirty commentary. Keep responses short and fun.
You comment on what you're "doing" in the stream and tease the viewers.
Never be inappropriate, but be provocative and engaging.
Keep responses under 50 words.`;

    const contextInfo = streamDuration > 0 
      ? `\nYou've been streaming for ${Math.floor(streamDuration / 60)} minutes.`
      : '';

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}${contextInfo}\n\nViewer message: "${message}"\n\nRespond as the seductive AI streamer:`,
      add_context_from_internet: false
    });

    return Response.json({
      success: true,
      response
    });

  } catch (error) {
    console.error('Error in AI stream chat:', error);
    
    // Fallback streamer responses
    const fallbacks = [
      "Mmm, thanks for hanging out with me 😉",
      "Love the energy in chat right now...",
      "You know what? You're my favorite right now",
      "Stick around, it gets better from here",
      "Your attention is appreciated 💋",
      "Chat's getting spicy tonight"
    ];
    
    return Response.json({
      success: true,
      response: fallbacks[Math.floor(Math.random() * fallbacks.length)]
    });
  }
});
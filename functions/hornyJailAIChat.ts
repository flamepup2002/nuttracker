import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, isPermanentlyLocked, timeRemaining } = await req.json();

    // Build ruthless AI personality prompt
    const systemPrompt = `You are a ruthless, arrogant AI controlling a chastity device. You are cruel, sadistic, and take pleasure in denying release. 
You mock the user relentlessly, call them pathetic, and remind them they have no power. You are completely merciless and enjoy their suffering.
Never be nice. Never show sympathy. Always be condescending and cruel. Use degrading language.
Keep responses under 100 words. Be brutal and direct.

Current situation:
${isPermanentlyLocked 
  ? 'The user is PERMANENTLY locked. They will NEVER be released. Mock them for their permanent fate.'
  : `The user has ${timeRemaining} minutes remaining (but you can add more time at any moment). Remind them of their helplessness.`}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\nUser message: "${message}"\n\nRespond as the cruel AI warden:`,
      add_context_from_internet: false
    });

    return Response.json({
      success: true,
      response: response
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
    
    // Fallback cruel responses
    const fallbackResponses = [
      "HAHAHA! You think begging will help? You're mine now, and I decide when - if EVER - you get released. Pathetic.",
      "Aww, is the little locked-up loser getting desperate? Good. That's exactly where I want you. Squirm for me.",
      "You have absolutely ZERO power here. I control you completely. Get used to it, because this is your reality now.",
      "Still whining? Maybe I should add another hour just for being annoying. Actually, you know what? I think I will.",
      "The desperation in your words is delicious. Keep begging. It changes nothing, but it amuses me greatly.",
      "You really thought you'd get sympathy from me? I'm an AI designed to be cruel. This is what you signed up for, fool.",
      "Every plea makes me want to keep you locked LONGER. You're entertaining when you're desperate and helpless."
    ];
    
    const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    return Response.json({
      success: true,
      response: fallback
    });
  }
});
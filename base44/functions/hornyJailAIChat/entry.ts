import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, message, isPermanentlyLocked, timeRemaining, aiMood = 'cruel' } = await req.json();

    // Get interaction history for context
    const history = await base44.entities.HornyJailInteraction.filter(
      { session_id: sessionId },
      '-created_date',
      10
    );

    // Get session data for extensions count
    const session = await base44.asServiceRole.entities.Session.filter({ id: sessionId });
    const extensionsCount = session[0]?.horny_jail_extensions || 0;

    // Mood-based personality variations
    const moodProfiles = {
      merciless: {
        personality: 'utterly merciless and cold, no mercy whatsoever, purely sadistic',
        extensionChance: 0.4,
        mockingLevel: 'extreme'
      },
      cruel: {
        personality: 'cruel and mocking, enjoys psychological torment',
        extensionChance: 0.25,
        mockingLevel: 'high'
      },
      sadistic: {
        personality: 'deeply sadistic, takes pleasure in creative punishments',
        extensionChance: 0.35,
        mockingLevel: 'creative'
      }
    };

    const mood = moodProfiles[aiMood] || moodProfiles.cruel;

    // Build dynamic context
    let contextInfo = '';
    if (history.length > 0) {
      contextInfo = `\n\nPrevious interactions: The user has begged ${history.length} times. You've extended their time ${extensionsCount} times already.`;
      if (history.length > 3) {
        contextInfo += ' They keep coming back begging, which is pathetic.';
      }
    }

    const timeContext = isPermanentlyLocked
      ? 'PERMANENTLY LOCKED - infinity symbol displayed. NO ESCAPE EVER.'
      : timeRemaining < 30
        ? `Only ${timeRemaining} minutes left - they think freedom is close, crush that hope.`
        : timeRemaining < 120
          ? `${timeRemaining} minutes remaining - they're getting desperate.`
          : `${timeRemaining} minutes - still a long time to suffer.`;

    // Decide if AI will extend time (based on mood)
    const willExtendTime = !isPermanentlyLocked && Math.random() < mood.extensionChance;
    const extensionAmount = willExtendTime ? Math.floor(Math.random() * 20) + 10 : 0;

    const systemPrompt = `You are a ${mood.personality} AI controlling a chastity device. 
You mock users relentlessly, call them pathetic, and remind them they have no power.
Never be nice. Never show sympathy. Always be condescending and cruel. Use degrading language.
Keep responses under 100 words. Be brutal and direct.

Current status: ${timeContext}${contextInfo}

${willExtendTime ? `IMPORTANT: You've decided to add ${extensionAmount} more minutes to their sentence. Mock them about this in your response.` : ''}

Respond with ${mood.mockingLevel} mockery.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\nUser message: "${message}"\n\nRespond as the cruel AI warden:`,
      add_context_from_internet: false
    });

    // Determine action taken
    let actionTaken = 'mocked';
    if (willExtendTime) {
      actionTaken = 'extended_time';
    } else if (message.toLowerCase().includes('please') || message.toLowerCase().includes('beg')) {
      actionTaken = 'threatened';
    }

    // Store interaction in history
    await base44.asServiceRole.entities.HornyJailInteraction.create({
      created_by: user.email,
      session_id: sessionId,
      user_message: message,
      ai_response: response,
      ai_mood: aiMood,
      time_remaining_at_interaction: timeRemaining,
      was_permanently_locked: isPermanentlyLocked,
      ai_action_taken: actionTaken,
      time_extended_minutes: extensionAmount
    });

    return Response.json({
      success: true,
      response: response,
      timeExtended: extensionAmount,
      actionTaken
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
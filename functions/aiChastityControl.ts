import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userHistory } = await req.json();

    // AI decision-making for lock duration
    const baseDuration = 15; // Base 15 minutes
    let duration = baseDuration;
    let multiplier = 1.0;
    let factors = [];

    // Factor 1: Dangerous mode increases duration
    if (userHistory.dangerous_mode) {
      multiplier *= 2.0;
      factors.push('dangerous mode enabled (+100%)');
    }

    // Factor 2: Findom enabled adds time
    if (userHistory.findom_enabled) {
      multiplier *= 1.5;
      factors.push('findom mode active (+50%)');
    }

    // Factor 3: Random factor (0.5x to 3x)
    const randomFactor = 0.5 + Math.random() * 2.5;
    multiplier *= randomFactor;
    factors.push(`AI randomness (${randomFactor.toFixed(2)}x)`);

    // Calculate final duration
    duration = Math.floor(baseDuration * multiplier);

    // Min 5 minutes, max 480 minutes (8 hours)
    duration = Math.max(5, Math.min(480, duration));

    // Generate AI message
    let message = '';
    if (duration < 20) {
      message = 'The AI shows mercy... this time.';
    } else if (duration < 60) {
      message = 'The AI has decided you need some time to think.';
    } else if (duration < 120) {
      message = 'The AI believes you require extended discipline.';
    } else {
      message = 'The AI has determined you need maximum restraint.';
    }

    // Log the AI decision
    await base44.asServiceRole.entities.Notification.create({
      created_by: user.email,
      type: 'penalty_applied',
      title: '🔒 Horny Jail Sentence',
      message: `AI has locked you for ${duration} minutes. ${message}`,
      priority: 'high'
    });

    return Response.json({
      success: true,
      duration_minutes: duration,
      factors,
      message,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in AI chastity control:', error);
    return Response.json({ 
      error: error.message || 'AI control failed' 
    }, { status: 500 });
  }
});
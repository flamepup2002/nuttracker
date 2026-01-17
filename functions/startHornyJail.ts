import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { initialMinutes, deviceId } = await req.json();

    if (!initialMinutes || initialMinutes < 1) {
      return Response.json({ error: 'Invalid duration' }, { status: 400 });
    }

    // Check for existing active session
    const existingSessions = await base44.asServiceRole.entities.Session.filter({
      created_by: user.email,
      status: 'active',
      is_horny_jail: true
    });

    if (existingSessions.length > 0) {
      return Response.json({ 
        error: 'You already have an active horny jail session' 
      }, { status: 400 });
    }

    // Create the session
    const session = await base44.asServiceRole.entities.Session.create({
      created_by: user.email,
      start_time: new Date().toISOString(),
      status: 'active',
      is_horny_jail: true,
      horny_jail_minutes: initialMinutes,
      horny_jail_device_id: deviceId,
      horny_jail_extensions: 0
    });

    // Send notification
    await base44.asServiceRole.entities.Notification.create({
      created_by: user.email,
      type: 'penalty_applied',
      title: '🔒 Locked in Horny Jail',
      message: `The AI has locked you for ${initialMinutes} minutes. Good luck.`,
      priority: 'high'
    });

    return Response.json({
      success: true,
      sessionId: session.id,
      minutes: initialMinutes,
      message: 'AI control activated'
    });

  } catch (error) {
    console.error('Error starting horny jail:', error);
    return Response.json({ 
      error: error.message || 'Failed to start session' 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();

    const sessions = await base44.asServiceRole.entities.Session.filter({ id: sessionId });
    const session = sessions[0];

    if (!session || session.status !== 'active') {
      return Response.json({ 
        error: 'Session not found or inactive',
        released: true 
      }, { status: 404 });
    }

    const startTime = new Date(session.start_time).getTime();
    const currentMinutes = session.horny_jail_minutes || 0;
    const lockDuration = currentMinutes * 60 * 1000;
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, lockDuration - elapsed);

    // If time is up, release
    if (remaining <= 0) {
      await base44.asServiceRole.entities.Session.update(session.id, {
        status: 'completed',
        end_time: new Date().toISOString()
      });

      await base44.asServiceRole.entities.Notification.create({
        created_by: user.email,
        type: 'contract_accepted',
        title: '🔓 Released from Horny Jail',
        message: `The AI has decided you've served your time. Total: ${currentMinutes} minutes.`,
        priority: 'medium'
      });

      return Response.json({
        success: true,
        released: true,
        totalMinutes: currentMinutes
      });
    }

    // AI decision: 35% chance to PERMANENTLY lock
    const shouldPermanentLock = Math.random() < 0.35;
    
    if (shouldPermanentLock && !session.horny_jail_permanent_lock) {
      await base44.asServiceRole.entities.Session.update(session.id, {
        horny_jail_permanent_lock: true,
        horny_jail_minutes: 999999 // Essentially infinite
      });

      await base44.asServiceRole.entities.Notification.create({
        created_by: user.email,
        type: 'collateral_liquidation',
        title: '🔒 PERMANENTLY LOCKED',
        message: `The AI has decided you deserve permanent chastity. There is no release. Ever.`,
        priority: 'urgent'
      });

      return Response.json({
        success: true,
        released: false,
        permanentLock: true,
        message: 'You are now permanently locked'
      });
    }

    // AI decision: randomly add time (30% chance each check)
    const shouldAddTime = Math.random() < 0.3;
    
    if (shouldAddTime) {
      // Add random time between 10-30 minutes
      const minutesToAdd = Math.floor(Math.random() * 21) + 10;
      const newTotalMinutes = currentMinutes + minutesToAdd;
      const extensions = (session.horny_jail_extensions || 0) + 1;

      await base44.asServiceRole.entities.Session.update(session.id, {
        horny_jail_minutes: newTotalMinutes,
        horny_jail_extensions: extensions
      });

      const reasons = [
        "You're still too horny",
        "The AI thinks you need more time to reflect",
        "You were thinking impure thoughts",
        "The AI is feeling cruel today",
        "You haven't learned your lesson yet",
        "The AI detected elevated arousal levels",
        "Just because the AI can",
        "You looked at the timer too many times",
        "The AI wants to see you squirm more"
      ];

      const reason = reasons[Math.floor(Math.random() * reasons.length)];

      await base44.asServiceRole.entities.Notification.create({
        created_by: user.email,
        type: 'penalty_applied',
        title: '⏰ Time Extended!',
        message: `AI added ${minutesToAdd} more minutes. Reason: ${reason}`,
        priority: 'urgent'
      });

      return Response.json({
        success: true,
        released: false,
        timeAdded: minutesToAdd,
        newTotalMinutes,
        reason,
        extensions
      });
    }

    // No change this time
    return Response.json({
      success: true,
      released: false,
      timeAdded: 0,
      remainingSeconds: Math.floor(remaining / 1000)
    });

  } catch (error) {
    console.error('Error in AI check:', error);
    return Response.json({ 
      error: error.message || 'AI check failed' 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's current findom settings
    const settings = await base44.asServiceRole.entities.UserSettings.filter({
      created_by: user.email,
    });

    if (!settings || settings.length === 0) {
      return Response.json({ error: 'Findom not enabled' }, { status: 400 });
    }

    const userSettings = settings[0];

    if (!userSettings.findom_enabled) {
      return Response.json({ error: 'Findom mode not enabled' }, { status: 400 });
    }

    // Create session with locked interest rate
    const session = await base44.entities.Session.create({
      start_time: new Date().toISOString(),
      is_findom: true,
      total_cost: 0,
      locked_interest_rate: userSettings.interest_rate, // Lock the rate at session start
      status: 'active',
    });

    return Response.json({
      success: true,
      session_id: session.id,
      locked_interest_rate: userSettings.interest_rate,
      message: `Session started with ${userSettings.interest_rate}% daily interest rate locked`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
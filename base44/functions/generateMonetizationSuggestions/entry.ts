import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user data and history
    const sessions = await base44.entities.Session.filter({
      created_by: user.email,
      is_findom: true,
    }, '-created_date', 50);

    const goals = await base44.entities.TributeGoal.filter({
      created_by: user.email,
      is_active: true,
    });

    const orgasms = await base44.entities.Orgasm.filter({
      created_by: user.email,
    }, '-created_date', 100);

    // Calculate statistics
    let stats = {
      totalSessions: sessions.length,
      totalSpent: sessions.reduce((sum, s) => sum + (s.total_cost || 0), 0),
      avgSessionCost: 0,
      avgSessionLength: 0,
      totalOrgasms: orgasms.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
    };

    if (sessions.length > 0) {
      stats.avgSessionCost = stats.totalSpent / sessions.length;
      const totalDuration = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
      stats.avgSessionLength = totalDuration / sessions.length / 60; // convert to minutes
    }

    // Generate AI suggestions based on patterns
    const prompt = `Based on the following findom engagement patterns, generate 3 personalized monetization strategies:

User Engagement Stats:
- Total Sessions: ${stats.totalSessions}
- Total Amount Spent: $${stats.totalSpent.toFixed(2)}
- Average Session Cost: $${stats.avgSessionCost.toFixed(2)}
- Average Session Duration: ${stats.avgSessionLength.toFixed(0)} minutes
- Total Orgasms: ${stats.totalOrgasms}
- Active Goals: ${goals.length}

Generate 3 strategies that would maximize this user's financial submission. Each strategy should include:
1. A specific goal or challenge
2. Recommended pricing or payment plan
3. Expected engagement level

Return as JSON array: [
  { strategy: "description", recommended_price: number, expected_engagement: "high/medium/low", reasoning: "why this works" },
  ...
]`;

    const suggestions = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            recommended_price: { type: 'number' },
            expected_engagement: { type: 'string' },
            reasoning: { type: 'string' }
          }
        }
      }
    });

    return Response.json({
      stats,
      suggestions: Array.isArray(suggestions) ? suggestions : [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
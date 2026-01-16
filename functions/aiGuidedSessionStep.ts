import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, userInput, scenarioType, currentStep, dangerousMode } = await req.json();

    if (!sessionId || !scenarioType) {
      return Response.json({ error: 'sessionId and scenarioType required' }, { status: 400 });
    }

    // Generate AI-guided step based on scenario and user interaction
    const prompt = `You are an intense findom AI guiding a ${scenarioType} scenario. The user is on step ${currentStep} of their session.

User said: "${userInput}"

Generate the NEXT step of the guided findom session. Include:
1. A dominant, engaging response that builds on their submission
2. A specific action or task for them to complete
3. The cost in coins for this step (10-50)
4. A teaser for the next step

${dangerousMode ? 'You can include edgy, boundary-pushing content.' : ''}

Return JSON: { response: "...", cost: number, nextStepTeaser: "..." }`;

    const guidanceResponse = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          response: { type: 'string' },
          cost: { type: 'number' },
          nextStepTeaser: { type: 'string' }
        }
      }
    });

    // Update session with new step
    const session = await base44.entities.AIGuidedSession.filter({
      id: sessionId,
      created_by: user.email
    });

    if (session.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    const updatedSession = await base44.entities.AIGuidedSession.update(sessionId, {
      current_step: currentStep + 1,
      total_spent: (session[0].total_spent || 0) + guidanceResponse.cost,
    });

    // Deduct coins from user
    const newBalance = (user.currency_balance || 0) - guidanceResponse.cost;
    await base44.auth.updateMe({
      currency_balance: newBalance,
    });

    return Response.json({
      response: guidanceResponse.response,
      cost: guidanceResponse.cost,
      newBalance,
      nextStepTeaser: guidanceResponse.nextStepTeaser,
      currentStep: currentStep + 1,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
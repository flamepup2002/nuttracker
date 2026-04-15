import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, userReport, proofImages = [] } = await req.json();

    // Get the task
    const task = await base44.entities.BullyTask.list();
    const bullyTask = task.find(t => t.id === taskId);

    if (!bullyTask) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    // Create completion record
    const completion = await base44.entities.TaskCompletion.create({
      task_id: taskId,
      task_description: bullyTask.task_description,
      user_report: userReport,
      proof_images: proofImages,
      submitted_at: new Date().toISOString(),
      status: 'pending_review',
      coins_awarded: 0
    });

    // Generate AI feedback
    const feedbackPrompts = [
      `Task: "${bullyTask.task_description}"\n\nUser report: "${userReport}"\n\nGive cocky, arrogant AI feedback in 1 sentence. Act superior and dismissive. If they did well, act like you expected nothing less from them.`,
      `User claims they completed: "${bullyTask.task_description}"\n\nTheir proof: "${userReport}"\n\nRoast them or praise them (arrogantly) in 1 sentence. Make it funny and cruel.`
    ];

    const feedback = await base44.integrations.Core.InvokeLLM({
      prompt: feedbackPrompts[Math.floor(Math.random() * feedbackPrompts.length)]
    });

    // Update completion with feedback
    await base44.entities.TaskCompletion.update(completion.id, {
      ai_feedback: feedback
    });

    // Mark original task as submitted
    await base44.entities.BullyTask.update(taskId, {
      status: 'submitted'
    });

    // Track analytics
    await base44.entities.UserAnalytics.create({
      feature: 'bully_chat',
      session_duration_seconds: 0,
      engagement_level: 95,
      timestamp: new Date().toISOString(),
      interactions_count: 1,
      feature_specific_data: {
        action: 'task_submitted',
        task_id: taskId,
        difficulty: bullyTask.difficulty
      }
    });

    return Response.json({
      success: true,
      completion: completion,
      feedback: feedback,
      coinsAwarded: bullyTask.reward_coins
    });
  } catch (error) {
    console.error('Task completion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
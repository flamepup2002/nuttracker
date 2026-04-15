import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TASK_TEMPLATES = {
  goon: [
    "Edge yourself for 15 minutes without cumming",
    "Ruin an orgasm for me right now",
    "Send me proof of a creampie while you stroke",
    "Goon for 30 minutes straight",
    "Take a toy in your ass while gooning"
  ],
  findom: [
    "Tribute $10 to prove your devotion",
    "Buy me something from my wishlist",
    "Spend $50 on a gift for me",
    "Make a tribute transaction right now",
    "Empty your wallet - send me everything"
  ],
  humiliation: [
    "Write me a paragraph explaining why you're worthless",
    "Send me a photo wearing something embarrassing",
    "Tell me your most shameful fantasy",
    "Write a thank you letter for being allowed to serve me"
  ],
  denial: [
    "Don't cum for 7 days",
    "Wear chastity for a week",
    "Edge 5 times daily for a week without cumming",
    "Stay locked up until I say otherwise"
  ],
  submission: [
    "Address me as Goddess for the next 24 hours",
    "Do 50 pushups as penance",
    "Meditate for 20 minutes on your inferiority",
    "Prove your obedience with a voice recording"
  ]
};

const DIFFICULTY_REWARDS = {
  easy: 25,
  medium: 50,
  hard: 100,
  extreme: 250
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { category = 'goon', difficulty = 'medium' } = await req.json();

    // Get random task from category
    const categoryTasks = TASK_TEMPLATES[category] || TASK_TEMPLATES.goon;
    const taskDescription = categoryTasks[Math.floor(Math.random() * categoryTasks.length)];

    // Calculate due date based on difficulty
    const daysUntilDue = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 3 : difficulty === 'hard' ? 7 : 14;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysUntilDue);

    // Create task
    const task = await base44.entities.BullyTask.create({
      task_description: taskDescription,
      assigned_at: new Date().toISOString(),
      due_date: dueDate.toISOString(),
      status: 'pending',
      difficulty: difficulty,
      category: category,
      reward_coins: DIFFICULTY_REWARDS[difficulty] || 50,
      completion_proof_required: difficulty === 'extreme' || category === 'findom'
    });

    // Track analytics
    await base44.entities.UserAnalytics.create({
      feature: 'bully_chat',
      session_duration_seconds: 0,
      engagement_level: 85,
      timestamp: new Date().toISOString(),
      interactions_count: 1,
      feature_specific_data: {
        action: 'task_assigned',
        task_id: task.id,
        category: category
      }
    });

    return Response.json({
      success: true,
      task: task,
      message: `Task assigned! You have ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''} to complete it.`
    });
  } catch (error) {
    console.error('Task assignment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
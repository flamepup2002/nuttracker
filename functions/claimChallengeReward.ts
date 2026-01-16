import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeProgressId } = await req.json();

    if (!challengeProgressId) {
      return Response.json({ error: 'challengeProgressId required' }, { status: 400 });
    }

    // Get challenge progress
    const progressResults = await base44.entities.ChallengeProgress.filter({
      id: challengeProgressId,
      created_by: user.email,
    });

    if (progressResults.length === 0) {
      return Response.json({ error: 'Progress not found' }, { status: 404 });
    }

    const progress = progressResults[0];

    if (progress.status !== 'completed') {
      return Response.json({ error: 'Challenge not completed' }, { status: 400 });
    }

    if (progress.reward_claimed) {
      return Response.json({ error: 'Reward already claimed' }, { status: 400 });
    }

    // Get challenge details
    const challenges = await base44.entities.FindomChallenge.filter({
      id: progress.challenge_id,
    });

    const challenge = challenges[0];
    const rewardCoins = challenge?.reward_coins || 0;

    // Update progress
    await base44.entities.ChallengeProgress.update(challengeProgressId, {
      reward_claimed: true,
    });

    // Add coins to user
    const newBalance = (user.currency_balance || 0) + rewardCoins;
    await base44.auth.updateMe({
      currency_balance: newBalance,
    });

    return Response.json({
      success: true,
      rewardCoins,
      newBalance,
      message: `Claimed ${rewardCoins} coins!`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
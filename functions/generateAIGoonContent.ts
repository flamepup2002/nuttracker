import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user settings for style preference
    const settings = await base44.entities.UserSettings.filter({ 
      created_by: user.email 
    });
    const userSettings = settings[0] || {};

    const style = userSettings.goon_fuel_style || 'realistic';
    const customKeywords = userSettings.goon_fuel_keywords || [];

    // Build prompt based on style
    const stylePrompts = {
      realistic: 'photorealistic, high quality, professional photography',
      anime: 'anime style, digital art, highly detailed anime illustration',
      fantasy: 'fantasy art, digital painting, ethereal and mystical'
    };

    const basePrompt = `Beautiful attractive person in suggestive pose, ${stylePrompts[style]}`;
    const keywords = customKeywords.length > 0 ? `, ${customKeywords.join(', ')}` : '';
    const fullPrompt = `${basePrompt}${keywords}, seductive, alluring, high detail, 4k quality`;

    // Generate image
    const result = await base44.integrations.Core.GenerateImage({
      prompt: fullPrompt
    });

    // Track usage
    await base44.asServiceRole.entities.Session.create({
      created_by: user.email,
      start_time: new Date().toISOString(),
      status: 'completed',
      end_time: new Date().toISOString(),
      ai_goon_content_generated: true
    });

    return Response.json({
      success: true,
      url: result.url,
      style
    });

  } catch (error) {
    console.error('Error generating AI goon content:', error);
    return Response.json({ 
      error: error.message || 'Failed to generate content' 
    }, { status: 500 });
  }
});
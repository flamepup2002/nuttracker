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

    // Generate image with retry logic to prevent blank screens
    let result = null;
    let retries = 0;
    const maxRetries = 2;

    while (!result && retries < maxRetries) {
      try {
        result = await base44.integrations.Core.GenerateImage({
          prompt: fullPrompt
        });
        if (result?.url) break;
      } catch (e) {
        retries++;
        if (retries >= maxRetries) throw e;
        await new Promise(r => setTimeout(r, 500)); // Small delay before retry
      }
    }

    if (!result?.url) {
      throw new Error('Failed to generate image after retries');
    }

    return Response.json({
      success: true,
      url: result.url,
      style,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error generating AI goon content:', error);
    return Response.json({ 
      error: error.message || 'Failed to generate content' 
    }, { status: 500 });
  }
});
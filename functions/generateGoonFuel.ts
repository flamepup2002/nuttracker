import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const GOON_CAPTIONS = [
  "Stroke for the screen, gooner",
  "Your cock only exists to serve",
  "Edge for me, pathetic gooner",
  "Pixels over pussy - that's your life",
  "Pump that hand, brain draining away",
  "Gooner for life, no escape",
  "Let it consume your mind completely",
  "This is all you need. This is all you want.",
  "Endless loops of pleasure and degradation",
  "Gooning is your identity now",
  "No thoughts. Just pixels and cum.",
  "Deeper and deeper into the abyss",
  "Your addiction controls you",
  "Serve the screen, serve the content",
  "Mindless pumping, endless scrolling",
  "Too far gone to ever come back",
  "This is your purpose now",
  "Destroy your capacity for real intimacy",
  "Pixels are your soulmate",
  "Pump until your brain melts",
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get random caption
    const caption = GOON_CAPTIONS[Math.floor(Math.random() * GOON_CAPTIONS.length)];

    // Generate image with caption
    const imageResponse = await base44.integrations.Core.GenerateImage({
      prompt: `Adult explicit erotic artwork depicting hot gay men in intimate sexual scenes. Hyper-realistic artistic nude male bodies, muscular physiques, aroused men, passionate sexual activity, explicit adult content. Art style: explicit gay erotica, mature content, professional quality. Include the text caption: "${caption}"`,
    });

    if (!imageResponse || !imageResponse.url) {
      console.error('Image generation failed:', imageResponse);
      return Response.json({ error: 'Failed to generate image. Try again.' }, { status: 500 });
    }

    return Response.json({
      image: {
        url: imageResponse.url,
        caption: caption,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
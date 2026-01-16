import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Messages required' }, { status: 400 });
    }

    // Format messages for summarization
    const chatHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');

    const prompt = `Summarize this chat conversation in 2-3 concise sentences. Focus on the main themes and progression. Keep it brief and engaging.

Chat:
${chatHistory}`;

    const summary = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: false,
    });

    return Response.json({
      summary: summary,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
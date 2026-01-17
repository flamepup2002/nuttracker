import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requirements } = await req.json();

    // Generate AI-powered contract
    const prompt = `You are a findom contract specialist. Generate a detailed debt contract based on these requirements:

${requirements}

Create a comprehensive contract with:
1. A compelling title
2. Detailed description
3. Appropriate intensity level (mild/moderate/intense/extreme)
4. Monthly payment amount
5. Contract duration in months (or 0 for permanent)
6. List of 5-10 specific contract terms
7. Penalty percentage (5-50%)
8. Interest rate if applicable (0-20%)
9. Recommended collateral type if any

Return ONLY valid JSON in this exact format:
{
  "title": "string",
  "description": "string",
  "intensity_level": "mild|moderate|intense|extreme",
  "monthly_payment": number,
  "duration_months": number,
  "terms": ["term1", "term2", ...],
  "penalty_percentage": number,
  "interest_rate": number,
  "collateral_type": "none|house|car|savings|retirement_accounts|crypto|jewelry|electronics|all_assets",
  "compound_frequency": "none|daily|weekly|monthly|quarterly"
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          intensity_level: { type: "string", enum: ["mild", "moderate", "intense", "extreme"] },
          monthly_payment: { type: "number" },
          duration_months: { type: "number" },
          terms: { type: "array", items: { type: "string" } },
          penalty_percentage: { type: "number" },
          interest_rate: { type: "number" },
          collateral_type: { type: "string" },
          compound_frequency: { type: "string" }
        },
        required: ["title", "description", "intensity_level", "monthly_payment", "duration_months", "terms"]
      }
    });

    return Response.json({
      success: true,
      contract: result
    });
  } catch (error) {
    console.error('Generate contract error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});
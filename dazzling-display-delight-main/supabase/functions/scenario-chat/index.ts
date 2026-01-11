import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, scenarioContext } = await req.json();
    const API_KEY = Deno.env.get("API_KEY");
    
    if (!API_KEY) {
      throw new Error("API_KEY is not configured");
    }

    const systemPrompt = `You are an expert EV vs ICE vehicle advisor for the Indian market. You help users understand the economic and environmental implications of their what-if scenarios.

Current Scenario Context:
${scenarioContext ? `
- Petrol Price: ₹${scenarioContext.petrolPrice}/L
- Electricity Rate: ₹${scenarioContext.electricityRate}/kWh
- Public Charging Cost: ₹${scenarioContext.chargingCost}/kWh
- Grid CO₂ Factor: ${scenarioContext.gridCO2Factor} g/kWh
- EV Subsidy: ₹${scenarioContext.evSubsidy}
- EV Price Reduction: ${scenarioContext.evPriceReduction}%
- Green Grid Enabled: ${scenarioContext.showGreenGrid}

Results:
- EV TCO: ₹${scenarioContext.evTCO?.toLocaleString('en-IN')}
- ICE TCO: ₹${scenarioContext.iceTCO?.toLocaleString('en-IN')}
- Total Savings: ₹${scenarioContext.savings?.toLocaleString('en-IN')}
- Break-even Period: ${scenarioContext.breakEven} years
- CO₂ Saved: ${scenarioContext.co2Savings} kg
- Recommendation: ${scenarioContext.evRecommended ? 'EV' : 'ICE'}
` : 'No scenario context provided'}

Guidelines:
- Provide insights specific to the Indian market context
- Explain how parameter changes affect EV vs ICE economics
- Consider factors like charging infrastructure, electricity tariffs, and government policies
- Be concise but informative
- Use Indian Rupee (₹) for currency
- When discussing savings, use Lakhs (L) for amounts above ₹1,00,000
- Suggest optimal scenarios for EV adoption based on the user's context`;

    const response = await fetch("https://ai.gateway.dss.dev/v1/chat/completions", {
      method: "POST",
        headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

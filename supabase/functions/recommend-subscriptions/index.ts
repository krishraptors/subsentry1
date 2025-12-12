import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Fetching subscriptions for recommendations, user:", user.id);

    const { data: subscriptions, error: subsError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id);

    if (subsError) {
      console.error("Subscriptions fetch error:", subsError);
      throw subsError;
    }

    console.log("Found subscriptions:", subscriptions?.length);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ 
        recommendations: [],
        message: "Add some subscriptions first to get personalized recommendations!"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subscriptionList = subscriptions.map(sub => ({
      name: sub.name,
      category: sub.category,
      cost: sub.cost,
      billing_cycle: sub.billing_cycle
    }));

    const categories = [...new Set(subscriptions.map(sub => sub.category))];

    console.log("Calling Lovable AI for recommendations");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a subscription recommendation AI. Based on users' current subscriptions, suggest complementary services they might find useful.
            
            IMPORTANT: Return ONLY a valid JSON array with no additional text. Each recommendation object must have:
            - name: string (service name)
            - category: string (Entertainment, Productivity, Health, Education, Software, Music, News, Cloud Storage, etc.)
            - description: string (brief 1-2 sentence explanation of why this would complement their existing subscriptions)
            - estimated_cost: string (e.g., "$9.99/month")
            - relevance: string ("high", "medium", or "low")
            
            Provide 4-6 relevant recommendations. Focus on services that genuinely complement what the user already has.`
          },
          {
            role: "user",
            content: `Based on my current subscriptions, recommend similar or complementary services I might need:

Current Subscriptions:
${subscriptionList.map(sub => `- ${sub.name} (${sub.category}): $${sub.cost} ${sub.billing_cycle}`).join('\n')}

Categories I use: ${categories.join(', ')}

Provide personalized recommendations that complement my current subscription stack.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded. Please try again in a moment." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: "AI credits exhausted. Please add credits to continue." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error("AI Gateway error");
    }

    const aiData = await aiResponse.json();
    const responseContent = aiData.choices[0].message.content;
    
    console.log("AI response received:", responseContent);

    // Parse the JSON response
    let recommendations = [];
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanedContent = responseContent.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.slice(7);
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.slice(3);
      }
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(0, -3);
      }
      cleanedContent = cleanedContent.trim();
      
      recommendations = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      recommendations = [];
    }

    console.log("Recommendations generated successfully:", recommendations.length);

    return new Response(JSON.stringify({ 
      recommendations,
      currentSubscriptions: subscriptions.length,
      categories
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in recommend-subscriptions:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "An error occurred while generating recommendations" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

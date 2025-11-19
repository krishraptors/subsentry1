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

    // Get user from auth header
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Fetching subscriptions for user:", user.id);

    // Fetch user's subscriptions
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
        insights: "You don't have any subscriptions yet. Add some subscriptions to get AI-powered insights about your spending patterns and optimization opportunities." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate summary statistics
    const totalMonthly = subscriptions.reduce((sum, sub) => {
      const cost = parseFloat(sub.cost);
      if (sub.billing_cycle === 'monthly') return sum + cost;
      if (sub.billing_cycle === 'yearly') return sum + (cost / 12);
      if (sub.billing_cycle === 'quarterly') return sum + (cost / 3);
      return sum;
    }, 0);

    const totalYearly = totalMonthly * 12;

    // Group by category
    const categoryBreakdown = subscriptions.reduce((acc, sub) => {
      const category = sub.category || 'Other';
      if (!acc[category]) acc[category] = { count: 0, cost: 0 };
      acc[category].count++;
      const cost = parseFloat(sub.cost);
      if (sub.billing_cycle === 'monthly') acc[category].cost += cost;
      else if (sub.billing_cycle === 'yearly') acc[category].cost += (cost / 12);
      else if (sub.billing_cycle === 'quarterly') acc[category].cost += (cost / 3);
      return acc;
    }, {} as Record<string, { count: number; cost: number }>);

    // Get upcoming renewals
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const upcomingRenewals = subscriptions.filter(sub => {
      const renewalDate = new Date(sub.renewal_date);
      return renewalDate >= today && renewalDate <= thirtyDaysFromNow;
    });

    const subscriptionData = {
      total: subscriptions.length,
      totalMonthly: totalMonthly.toFixed(2),
      totalYearly: totalYearly.toFixed(2),
      categoryBreakdown,
      upcomingRenewals: upcomingRenewals.length,
      subscriptionDetails: subscriptions.map(sub => ({
        name: sub.name,
        cost: sub.cost,
        billing_cycle: sub.billing_cycle,
        category: sub.category,
        renewal_date: sub.renewal_date
      }))
    };

    console.log("Calling Lovable AI with subscription data");

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
            content: `You are a financial analytics AI assistant specializing in subscription management. 
            Analyze subscription data and provide actionable insights in a friendly, conversational tone.
            Focus on: spending patterns, cost optimization, renewal management, and category analysis.
            Keep insights concise and practical. Use bullet points for clarity.
            Be encouraging and highlight both concerns and positive aspects.`
          },
          {
            role: "user",
            content: `Analyze this subscription data and provide insights:
            
Total Subscriptions: ${subscriptionData.total}
Monthly Spending: $${subscriptionData.totalMonthly}
Yearly Projection: $${subscriptionData.totalYearly}
Upcoming Renewals (30 days): ${subscriptionData.upcomingRenewals}

Category Breakdown:
${(Object.entries(categoryBreakdown) as [string, { count: number; cost: number }][]).map(([cat, data]) => 
  `- ${cat}: ${data.count} subscription(s), $${data.cost.toFixed(2)}/month`
).join('\n')}

Subscription Details:
${subscriptionData.subscriptionDetails.map(sub => 
  `- ${sub.name}: $${sub.cost} ${sub.billing_cycle} (${sub.category})`
).join('\n')}

Provide 4-5 key insights covering:
1. Overall spending analysis
2. Cost-saving opportunities
3. Category-specific observations
4. Renewal management tips
5. Potential optimization strategies`
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
    const insights = aiData.choices[0].message.content;
    
    console.log("AI analysis completed successfully");

    return new Response(JSON.stringify({ 
      insights,
      summary: {
        total: subscriptionData.total,
        monthlySpending: subscriptionData.totalMonthly,
        yearlyProjection: subscriptionData.totalYearly,
        upcomingRenewals: subscriptionData.upcomingRenewals
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-subscriptions:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "An error occurred during analysis" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

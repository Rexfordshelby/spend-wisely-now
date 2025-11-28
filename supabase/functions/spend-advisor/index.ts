import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, category, item, userId } = await req.json();
    
    console.log('Spend advisor called:', { amount, category, item, userId });

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API key not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch user context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: budget } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get week's transactions
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const { data: weekTransactions } = await supabase
      .from('transactions')
      .select('amount, category')
      .eq('wallet_id', wallet?.id || '')
      .gte('created_at', weekStart.toISOString());

    const weekTotal = weekTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    
    // Get today's transactions
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: todayTransactions } = await supabase
      .from('transactions')
      .select('amount')
      .eq('wallet_id', wallet?.id || '')
      .gte('created_at', todayStart.toISOString());

    const todayTotal = todayTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    // Get category history
    const categoryTransactions = weekTransactions?.filter(t => t.category === category) || [];
    const categoryWeekTotal = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // Build context for Gemini
    const context = {
      weekly_budget: budget?.weekly_limit || 0,
      spent_this_week: weekTotal,
      daily_budget: budget?.daily_limit || 0,
      spent_today: todayTotal,
      savings_goal: goals ? {
        name: goals.name,
        target: goals.target_amount,
        current: goals.current_amount || 0,
        deadline: goals.deadline
      } : null,
      category_history: {
        week_total: categoryWeekTotal,
        transaction_count: categoryTransactions.length
      }
    };

    // Call Gemini API
    const prompt = `You are a financial advisor helping a user make a spending decision RIGHT NOW.

User wants to spend ₹${amount} on ${item} (${category}).

Context:
- Weekly budget: ₹${context.weekly_budget}, already spent ₹${context.spent_this_week}
- Daily budget: ₹${context.daily_budget}, already spent ₹${context.spent_today}
${context.savings_goal ? `- Savings goal: ${context.savings_goal.name}, ₹${context.savings_goal.current}/₹${context.savings_goal.target} saved` : ''}
- This week in ${category}: ₹${context.category_history.week_total} (${context.category_history.transaction_count} transactions)

Provide:
1. Impact assessment (will they go over budget? By how much?)
2. Smarter alternatives (if wasteful)
3. Goal impact (delays goal by X days?) if applicable
4. Clear recommendation: PROCEED or SKIP

Keep it short, bold, action-focused. Use Indian Rupees (₹). Format as JSON with keys: impact, alternatives, goal_delay, recommendation, confidence.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response:', geminiData);
    
    const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Try to parse JSON from response
    let advice;
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        advice = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback parsing
        advice = {
          impact: aiText.split('\n')[0] || 'Unable to assess impact',
          alternatives: aiText.split('\n')[1] || '',
          goal_delay: aiText.split('\n')[2] || '',
          recommendation: aiText.toLowerCase().includes('skip') ? 'SKIP' : 'PROCEED',
          confidence: 'medium'
        };
      }
    } catch (e) {
      console.error('Failed to parse Gemini response:', e);
      advice = {
        impact: aiText,
        alternatives: '',
        goal_delay: '',
        recommendation: 'PROCEED',
        confidence: 'low'
      };
    }

    // Update user stats
    await supabase
      .from('profiles')
      .update({
        spends_advised_count: (profile?.spends_advised_count || 0) + 1
      })
      .eq('id', userId);

    // Calculate remaining amounts
    const weeklyRemaining = (budget?.weekly_limit || 0) - weekTotal - amount;
    const dailyRemaining = (budget?.daily_limit || 0) - todayTotal - amount;

    return new Response(
      JSON.stringify({
        ...advice,
        context: {
          weekly_remaining: weeklyRemaining,
          daily_remaining: dailyRemaining,
          week_spent: weekTotal,
          today_spent: todayTotal
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in spend-advisor:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

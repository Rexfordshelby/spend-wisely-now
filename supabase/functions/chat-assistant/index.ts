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
    const { message, userId } = await req.json();
    
    console.log('Chat assistant called:', { message, userId });

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
      .select('*, budgets(*), goals(*)')
      .eq('id', userId)
      .single();

    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get recent transactions
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', wallet?.id || '')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent chat history
    const { data: chatHistory } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Build context for Gemini
    const systemPrompt = `You are a friendly and helpful financial assistant for World Vault, a behavioral fintech app.

User Profile:
- Monthly Income: ₹${profile?.monthly_income || 0}
- Weekly Budget: ₹${profile?.budgets?.[0]?.weekly_limit || 0}
- Daily Budget: ₹${profile?.budgets?.[0]?.daily_limit || 0}
- Current Balance: ₹${wallet?.balance || 0}
- Active Goal: ${profile?.goals?.[0]?.name || 'None'} (Target: ₹${profile?.goals?.[0]?.target_amount || 0})

Recent Spending:
${recentTransactions?.map(t => `- ₹${t.amount} on ${t.description || t.category} (${new Date(t.created_at).toLocaleDateString()})`).join('\n') || 'No recent transactions'}

Your role:
- Provide personalized financial advice
- Answer questions about budgeting and spending
- Suggest ways to save money
- Help with goal planning
- Be encouraging and positive
- Use Indian Rupees (₹) for all amounts
- Keep responses concise and actionable

Always be friendly, supportive, and help the user make better financial decisions.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(chatHistory?.reverse().map(m => ({ role: m.role, content: m.content })) || []),
      { role: 'user', content: message }
    ];

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: messages.slice(1).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          })),
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 800,
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
    console.log('Gemini response received');
    
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not process that request.';

    // Save messages to database
    await supabase.from('chat_messages').insert([
      { user_id: userId, role: 'user', content: message },
      { user_id: userId, role: 'assistant', content: aiResponse }
    ]);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-assistant:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

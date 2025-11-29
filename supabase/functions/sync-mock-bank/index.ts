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
    const { userId } = await req.json();
    
    console.log('Mock bank sync called for user:', userId);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get user's wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Mock transaction templates
    const mockTransactions = [
      // Subscriptions
      { description: 'Netflix Subscription', amount: 649, category: 'Entertainment', is_recurring: true, recurrence_pattern: 'monthly' },
      { description: 'Spotify Premium', amount: 119, category: 'Entertainment', is_recurring: true, recurrence_pattern: 'monthly' },
      { description: 'Amazon Prime', amount: 1499, category: 'Shopping', is_recurring: true, recurrence_pattern: 'yearly' },
      
      // Regular expenses
      { description: 'Grocery Shopping - DMart', amount: 2450, category: 'Food', is_recurring: false },
      { description: 'Uber Ride', amount: 320, category: 'Transport', is_recurring: false },
      { description: 'Cafe Coffee Day', amount: 280, category: 'Food', is_recurring: false },
      { description: 'Movie Tickets', amount: 600, category: 'Entertainment', is_recurring: false },
      { description: 'Pharmacy', amount: 850, category: 'Health', is_recurring: false },
      { description: 'Mobile Recharge', amount: 599, category: 'Bills', is_recurring: true, recurrence_pattern: 'monthly' },
      { description: 'Restaurant Bill', amount: 1200, category: 'Food', is_recurring: false },
    ];

    // Generate random transactions (5-8 transactions)
    const numTransactions = Math.floor(Math.random() * 4) + 5;
    const selectedTransactions = [];
    
    for (let i = 0; i < numTransactions; i++) {
      const template = mockTransactions[Math.floor(Math.random() * mockTransactions.length)];
      const variance = (Math.random() * 0.3 - 0.15); // ±15% variance
      const amount = Math.round(template.amount * (1 + variance));
      
      // Random date in last 7 days
      const daysAgo = Math.floor(Math.random() * 7);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      selectedTransactions.push({
        wallet_id: wallet.id,
        amount,
        category: template.category,
        description: template.description,
        type: 'debit',
        is_recurring: template.is_recurring,
        recurrence_pattern: template.recurrence_pattern,
        created_at: date.toISOString()
      });
    }

    // Insert transactions
    const { data: insertedTransactions, error: insertError } = await supabase
      .from('transactions')
      .insert(selectedTransactions)
      .select();

    if (insertError) {
      throw insertError;
    }

    // Update wallet balance
    const totalSpent = selectedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const newBalance = (wallet.balance || 0) - totalSpent;

    await supabase
      .from('wallets')
      .update({ balance: Math.max(0, newBalance) })
      .eq('id', wallet.id);

    console.log(`Synced ${insertedTransactions?.length} mock transactions`);

    return new Response(
      JSON.stringify({
        success: true,
        transactions_synced: insertedTransactions?.length || 0,
        total_amount: totalSpent,
        new_balance: Math.max(0, newBalance)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-mock-bank:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

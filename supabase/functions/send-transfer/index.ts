import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fee structure based on corridor
const getFee = (sourceCurrency: string, targetCurrency: string, amount: number) => {
  const corridors: Record<string, { percent: number; flat: number }> = {
    'INR-USD': { percent: 0.5, flat: 50 },
    'USD-INR': { percent: 0.4, flat: 0.5 },
    'INR-PKR': { percent: 1.0, flat: 30 },
    'INR-EUR': { percent: 0.6, flat: 40 },
    'USD-EUR': { percent: 0.3, flat: 1 },
  };

  const key = `${sourceCurrency}-${targetCurrency}`;
  const corridor = corridors[key] || { percent: 1, flat: 1 };
  
  return (amount * corridor.percent / 100) + corridor.flat;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { 
      recipientId, 
      amount, 
      sourceCurrency, 
      targetCurrency,
      exchangeRate,
      transferType,
      recipientDetails 
    } = await req.json();

    // Calculate fee and total
    const fee = getFee(sourceCurrency, targetCurrency, amount);
    const totalAmount = amount + fee;

    // Check sender has sufficient balance
    const { data: wallet } = await supabase
      .from('multi_currency_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .eq('currency', sourceCurrency)
      .single();

    if (!wallet || wallet.balance < totalAmount) {
      throw new Error('Insufficient balance');
    }

    // Create transfer record
    const { data: transfer, error: transferError } = await supabase
      .from('international_transfers')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        amount,
        source_currency: sourceCurrency,
        target_currency: targetCurrency,
        exchange_rate: exchangeRate,
        fee,
        total_amount: totalAmount,
        status: 'processing',
        transfer_type: transferType,
        recipient_details: recipientDetails,
      })
      .select()
      .single();

    if (transferError) throw transferError;

    // Deduct from sender wallet (demo mode)
    await supabase
      .from('multi_currency_wallets')
      .update({ balance: wallet.balance - totalAmount })
      .eq('user_id', user.id)
      .eq('currency', sourceCurrency);

    // Simulate processing delay and completion
    setTimeout(async () => {
      await supabase
        .from('international_transfers')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', transfer.id);
    }, 3000);

    console.log(`Transfer initiated: ${transfer.id}`);
    return new Response(JSON.stringify({ transfer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing transfer:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
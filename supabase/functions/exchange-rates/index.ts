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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { base, target } = await req.json();
    
    // Check cache first (15 min expiry)
    const { data: cached } = await supabase
      .from('exchange_rate_cache')
      .select('*')
      .eq('base_currency', base)
      .eq('target_currency', target)
      .gte('fetched_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
      .single();

    if (cached) {
      console.log('Returning cached rate');
      return new Response(JSON.stringify({ rate: cached.rate, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch from API
    const apiUrl = `https://open.er-api.com/v6/latest/${base}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.rates || !data.rates[target]) {
      throw new Error('Exchange rate not found');
    }

    const rate = data.rates[target];

    // Cache the rate
    await supabase
      .from('exchange_rate_cache')
      .upsert({
        base_currency: base,
        target_currency: target,
        rate,
        fetched_at: new Date().toISOString(),
      }, {
        onConflict: 'base_currency,target_currency'
      });

    console.log(`Fetched fresh rate: ${base} -> ${target} = ${rate}`);
    return new Response(JSON.stringify({ rate, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
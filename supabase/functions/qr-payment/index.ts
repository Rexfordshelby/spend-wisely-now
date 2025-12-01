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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { qrData } = await req.json();

    // Parse QR code data
    let paymentInfo;
    
    if (qrData.startsWith('upi://pay')) {
      // Parse UPI QR code
      const url = new URL(qrData);
      paymentInfo = {
        type: 'upi',
        recipientId: url.searchParams.get('pa'),
        recipientName: url.searchParams.get('pn'),
        amount: parseFloat(url.searchParams.get('am') || '0'),
        currency: 'INR',
      };
    } else if (qrData.startsWith('worldvault://')) {
      // Parse World Vault QR code
      const data = JSON.parse(atob(qrData.replace('worldvault://', '')));
      paymentInfo = {
        type: 'worldvault',
        ...data,
      };
    } else {
      throw new Error('Invalid QR code format');
    }

    console.log('Parsed QR payment:', paymentInfo);
    return new Response(JSON.stringify({ paymentInfo }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error parsing QR payment:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
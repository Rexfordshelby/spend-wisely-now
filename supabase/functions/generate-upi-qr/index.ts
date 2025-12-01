import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, amount, currency } = await req.json();

    // Generate UPI-style QR data
    const upiId = `${username}@worldvault`;
    let qrData;

    if (currency === 'INR') {
      // UPI format
      qrData = `upi://pay?pa=${upiId}&pn=${username}&cu=INR${amount ? `&am=${amount}` : ''}`;
    } else {
      // World Vault custom format
      const data = btoa(JSON.stringify({
        recipientId: upiId,
        recipientName: username,
        amount,
        currency,
      }));
      qrData = `worldvault://${data}`;
    }

    console.log('Generated QR data:', qrData);
    return new Response(JSON.stringify({ qrData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating QR:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
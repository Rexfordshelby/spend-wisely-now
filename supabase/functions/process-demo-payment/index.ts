import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Demo merchant database
const DEMO_MERCHANTS = {
  'demo@worldvault': { name: 'World Vault Demo', type: 'wallet' },
  'coffee@worldvault': { name: 'Starbucks Coffee', type: 'merchant' },
  'grocery@worldvault': { name: 'BigBasket Groceries', type: 'merchant' },
  'fuel@worldvault': { name: 'HP Petrol Pump', type: 'merchant' },
  'movie@worldvault': { name: 'PVR Cinemas', type: 'merchant' },
  'food@worldvault': { name: 'Swiggy Food Delivery', type: 'merchant' },
  'shopping@worldvault': { name: 'Amazon Shopping', type: 'merchant' },
  'travel@worldvault': { name: 'MakeMyTrip', type: 'merchant' },
  'mobile@worldvault': { name: 'Airtel Recharge', type: 'merchant' },
  'electricity@worldvault': { name: 'BESCOM Bill Pay', type: 'merchant' },
};

// UPI Demo IDs
const UPI_DEMO_IDS: Record<string, { name: string; type: string }> = {
  'demo@upi': { name: 'UPI Demo Account', type: 'upi' },
  'paytm@upi': { name: 'Paytm Wallet', type: 'upi' },
  'gpay@upi': { name: 'Google Pay', type: 'upi' },
  'phonepe@upi': { name: 'PhonePe', type: 'upi' },
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

    const { recipientId, amount, currency, note, paymentType } = await req.json();

    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Check if recipient is a demo merchant or UPI
    let recipientName = 'Unknown';
    let merchantType = 'unknown';

    if (DEMO_MERCHANTS[recipientId as keyof typeof DEMO_MERCHANTS]) {
      const merchant = DEMO_MERCHANTS[recipientId as keyof typeof DEMO_MERCHANTS];
      recipientName = merchant.name;
      merchantType = merchant.type;
    } else if (UPI_DEMO_IDS[recipientId as keyof typeof UPI_DEMO_IDS]) {
      const upiAccount = UPI_DEMO_IDS[recipientId as keyof typeof UPI_DEMO_IDS];
      recipientName = upiAccount.name;
      merchantType = upiAccount.type;
    } else if (recipientId.includes('@')) {
      // Custom UPI ID
      recipientName = recipientId.split('@')[0];
      merchantType = 'upi';
    }

    // Get user's wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user.id)
      .single();

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Check balance (demo mode - we'll allow it even if insufficient)
    const currentBalance = Number(wallet.balance);
    const newBalance = Math.max(0, currentBalance - amount);

    // Update wallet balance
    await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    // Create transaction record
    const { data: transaction, error: txnError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        amount: amount,
        type: 'debit',
        category: getCategoryFromMerchant(recipientId),
        description: note || `Payment to ${recipientName}`,
      })
      .select()
      .single();

    if (txnError) throw txnError;

    // Simulate processing delay
    const processingTime = Math.random() * 1000 + 500; // 0.5-1.5 seconds
    
    console.log(`Demo payment processed: ${amount} ${currency} to ${recipientId}`);

    return new Response(JSON.stringify({
      success: true,
      transactionId: transaction.id,
      recipientName,
      merchantType,
      amount,
      currency,
      newBalance,
      processingTime,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing demo payment:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getCategoryFromMerchant(merchantId: string): string {
  if (merchantId.includes('coffee') || merchantId.includes('food')) return 'Food';
  if (merchantId.includes('grocery')) return 'Groceries';
  if (merchantId.includes('fuel')) return 'Transport';
  if (merchantId.includes('movie') || merchantId.includes('entertainment')) return 'Entertainment';
  if (merchantId.includes('shopping')) return 'Shopping';
  if (merchantId.includes('travel')) return 'Travel';
  if (merchantId.includes('mobile') || merchantId.includes('recharge')) return 'Bills';
  if (merchantId.includes('electricity') || merchantId.includes('bill')) return 'Bills';
  return 'Other';
}

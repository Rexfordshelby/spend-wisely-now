import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Demo merchant database - Global
const DEMO_MERCHANTS: Record<string, { name: string; type: string; country: string }> = {
  'demo@worldvault': { name: 'World Vault Demo', type: 'wallet', country: 'Global' },
  'coffee@worldvault': { name: 'Starbucks Coffee', type: 'merchant', country: 'IN' },
  'coffee@paytm': { name: 'Starbucks', type: 'merchant', country: 'IN' },
  'grocery@ybl': { name: 'BigBasket', type: 'merchant', country: 'IN' },
  'fuel@axisbank': { name: 'HP Petrol', type: 'merchant', country: 'IN' },
  'movie@okicici': { name: 'PVR Cinemas', type: 'merchant', country: 'IN' },
  'food@upi': { name: 'Swiggy', type: 'merchant', country: 'IN' },
  'travel@paytm': { name: 'MakeMyTrip', type: 'merchant', country: 'IN' },
};

// UPI Demo IDs
const UPI_DEMO_IDS: Record<string, { name: string; type: string }> = {
  'demo@upi': { name: 'UPI Demo Account', type: 'upi' },
  'paytm@upi': { name: 'Paytm Wallet', type: 'upi' },
  'gpay@upi': { name: 'Google Pay', type: 'upi' },
  'phonepe@upi': { name: 'PhonePe', type: 'upi' },
  'starbucks@paytm': { name: 'Starbucks', type: 'upi' },
  'amazon@ybl': { name: 'Amazon', type: 'upi' },
  'swiggy@axisbank': { name: 'Swiggy', type: 'upi' },
};

// International payment identifiers
const INTL_PAYMENT_IDS: Record<string, { name: string; type: string; currency: string }> = {
  '+923001234567': { name: 'EasyPaisa Shop', type: 'easypaisa', currency: 'PKR' },
  '+923211234567': { name: 'JazzCash Store', type: 'jazzcash', currency: 'PKR' },
  '+923331234567': { name: 'Foodpanda PK', type: 'easypaisa', currency: 'PKR' },
  '+923451234567': { name: 'Daraz', type: 'jazzcash', currency: 'PKR' },
  'alipay_merchant_001': { name: 'Alipay Shop', type: 'alipay', currency: 'CNY' },
  'wechat_merchant_001': { name: 'WeChat Store', type: 'wechatpay', currency: 'CNY' },
  '+254712345678': { name: 'M-Pesa Kenya', type: 'mpesa', currency: 'KES' },
  'merchant@paypal': { name: 'PayPal Shop', type: 'paypal', currency: 'USD' },
  'merchant@alipay': { name: 'Alipay Merchant', type: 'alipay', currency: 'CNY' },
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

    // Check if recipient is a demo merchant, UPI, or international
    let recipientName = 'Unknown';
    let merchantType = paymentType || 'unknown';

    if (DEMO_MERCHANTS[recipientId]) {
      const merchant = DEMO_MERCHANTS[recipientId];
      recipientName = merchant.name;
      merchantType = merchant.type;
    } else if (UPI_DEMO_IDS[recipientId]) {
      const upiAccount = UPI_DEMO_IDS[recipientId];
      recipientName = upiAccount.name;
      merchantType = upiAccount.type;
    } else if (INTL_PAYMENT_IDS[recipientId]) {
      const intlAccount = INTL_PAYMENT_IDS[recipientId];
      recipientName = intlAccount.name;
      merchantType = intlAccount.type;
    } else if (recipientId.includes('@')) {
      // Custom UPI ID
      recipientName = recipientId.split('@')[0];
      merchantType = 'upi';
    } else if (recipientId.startsWith('+') || /^\d{10,15}$/.test(recipientId)) {
      // Phone number - determine type by prefix
      if (recipientId.startsWith('+92') || recipientId.startsWith('03')) {
        recipientName = 'Pakistan Mobile';
        merchantType = 'easypaisa';
      } else if (recipientId.startsWith('+254') || recipientId.startsWith('07')) {
        recipientName = 'Kenya Mobile';
        merchantType = 'mpesa';
      } else if (recipientId.startsWith('+86')) {
        recipientName = 'China Mobile';
        merchantType = 'alipay';
      } else {
        recipientName = `Mobile: ${recipientId}`;
        merchantType = 'mobile_payment';
      }
    } else {
      recipientName = recipientId.substring(0, 30);
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

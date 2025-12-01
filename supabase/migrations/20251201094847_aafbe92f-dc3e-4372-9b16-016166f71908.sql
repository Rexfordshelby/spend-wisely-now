-- Create multi-currency wallets table
CREATE TABLE public.multi_currency_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  currency TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create recipients table
CREATE TABLE public.recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  currency TEXT NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  swift_code TEXT,
  iban TEXT,
  upi_id TEXT,
  wallet_address TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create international transfers table
CREATE TABLE public.international_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID,
  sender_wallet_id UUID,
  amount NUMERIC NOT NULL,
  source_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  exchange_rate NUMERIC NOT NULL,
  fee NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  transfer_type TEXT NOT NULL,
  recipient_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create KYC documents table
CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  document_url TEXT,
  verification_status TEXT DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  country_code TEXT NOT NULL,
  id_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create exchange rate cache table
CREATE TABLE public.exchange_rate_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);

-- Enable RLS
ALTER TABLE public.multi_currency_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.international_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rate_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for multi_currency_wallets
CREATE POLICY "Users can manage own wallets"
ON public.multi_currency_wallets
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for recipients
CREATE POLICY "Users can manage own recipients"
ON public.recipients
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for international_transfers
CREATE POLICY "Users can view own transfers"
ON public.international_transfers
FOR SELECT
USING (auth.uid() = sender_id);

CREATE POLICY "Users can create transfers"
ON public.international_transfers
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for kyc_documents
CREATE POLICY "Users can manage own KYC documents"
ON public.kyc_documents
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for exchange_rate_cache
CREATE POLICY "Anyone can view exchange rates"
ON public.exchange_rate_cache
FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_multi_currency_wallets_updated_at
BEFORE UPDATE ON public.multi_currency_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
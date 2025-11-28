-- Add budgets table for weekly/daily limits
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weekly_limit NUMERIC NOT NULL DEFAULT 0,
  daily_limit NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add spending_limits table for category-specific limits
CREATE TABLE public.spending_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  weekly_limit NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Update profiles table with additional fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_income NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS spends_advised_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS spends_skipped_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_adherence_score NUMERIC DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Enable RLS on budgets table
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for budgets
CREATE POLICY "Users can view own budget" 
ON public.budgets 
FOR SELECT 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE id = budgets.user_id));

CREATE POLICY "Users can insert own budget" 
ON public.budgets 
FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE id = budgets.user_id));

CREATE POLICY "Users can update own budget" 
ON public.budgets 
FOR UPDATE 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE id = budgets.user_id));

CREATE POLICY "Users can delete own budget" 
ON public.budgets 
FOR DELETE 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE id = budgets.user_id));

-- Enable RLS on spending_limits table
ALTER TABLE public.spending_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for spending_limits
CREATE POLICY "Users can view own spending limits" 
ON public.spending_limits 
FOR SELECT 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE id = spending_limits.user_id));

CREATE POLICY "Users can insert own spending limits" 
ON public.spending_limits 
FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE id = spending_limits.user_id));

CREATE POLICY "Users can update own spending limits" 
ON public.spending_limits 
FOR UPDATE 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE id = spending_limits.user_id));

CREATE POLICY "Users can delete own spending limits" 
ON public.spending_limits 
FOR DELETE 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE id = spending_limits.user_id));

-- Add RLS policies for transactions (INSERT, UPDATE, DELETE)
CREATE POLICY "Users can insert own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own transactions" 
ON public.transactions 
FOR UPDATE 
USING (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own transactions" 
ON public.transactions 
FOR DELETE 
USING (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid()));

-- Add RLS policies for goals (INSERT, UPDATE, DELETE)
CREATE POLICY "Users can view own goals" 
ON public.goals 
FOR SELECT 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE id = goals.user_id));

CREATE POLICY "Users can insert own goals" 
ON public.goals 
FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE id = goals.user_id));

CREATE POLICY "Users can update own goals" 
ON public.goals 
FOR UPDATE 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE id = goals.user_id));

CREATE POLICY "Users can delete own goals" 
ON public.goals 
FOR DELETE 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE id = goals.user_id));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for budgets table
CREATE TRIGGER update_budgets_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for spending_limits table
CREATE TRIGGER update_spending_limits_updated_at
BEFORE UPDATE ON public.spending_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
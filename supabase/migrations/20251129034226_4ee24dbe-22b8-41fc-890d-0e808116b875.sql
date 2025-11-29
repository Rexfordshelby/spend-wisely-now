-- Badges and Achievements System
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges"
ON public.user_badges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view all available badges"
ON public.badges FOR SELECT
USING (true);

-- Streaks System
CREATE TABLE public.streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak"
ON public.streaks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
ON public.streaks FOR UPDATE
USING (auth.uid() = user_id);

-- Social Posts (Achievement Sharing)
CREATE TABLE public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('achievement', 'goal_completed', 'milestone', 'streak')),
  metadata JSONB,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view social posts"
ON public.social_posts FOR SELECT
USING (true);

CREATE POLICY "Users can create own posts"
ON public.social_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
ON public.social_posts FOR DELETE
USING (auth.uid() = user_id);

-- Group Goals
CREATE TABLE public.group_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  deadline DATE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.group_goal_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES group_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contribution NUMERIC DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(goal_id, user_id)
);

ALTER TABLE public.group_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_goal_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view group goals they're part of"
ON public.group_goals FOR SELECT
USING (
  auth.uid() = creator_id OR
  auth.uid() IN (SELECT user_id FROM group_goal_members WHERE goal_id = id)
);

CREATE POLICY "Users can create group goals"
ON public.group_goals FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can view group goal members"
ON public.group_goal_members FOR SELECT
USING (
  auth.uid() = user_id OR
  goal_id IN (SELECT id FROM group_goals WHERE creator_id = auth.uid())
);

CREATE POLICY "Users can join group goals"
ON public.group_goal_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Bills and Subscriptions
CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  category TEXT,
  recurring BOOLEAN DEFAULT false,
  recurrence_type TEXT CHECK (recurrence_type IN ('monthly', 'weekly', 'yearly', 'custom')),
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'paid', 'overdue')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'weekly')),
  next_billing_date DATE NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bills"
ON public.bills FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own subscriptions"
ON public.subscriptions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Chat History
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chat messages"
ON public.chat_messages FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Leaderboard (computed view)
CREATE TABLE public.leaderboard_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  total_score INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.leaderboard_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard"
ON public.leaderboard_scores FOR SELECT
USING (true);

-- Add recurring flag to transactions
ALTER TABLE public.transactions 
ADD COLUMN is_recurring BOOLEAN DEFAULT false,
ADD COLUMN recurrence_pattern TEXT;
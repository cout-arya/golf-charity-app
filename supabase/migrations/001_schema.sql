-- 001_schema.sql
-- Golf Charity Subscription Platform Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profiles
-- Extends the auth.users table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  charity_id UUID, -- References charities table
  charity_percentage NUMERIC DEFAULT 10.0 CHECK (charity_percentage >= 10.0 AND charity_percentage <= 100.0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: charities
CREATE TABLE IF NOT EXISTS public.charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  website TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to profiles now that charities exists
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_charity
  FOREIGN KEY (charity_id) REFERENCES public.charities(id) ON DELETE SET NULL;

-- Table: subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT CHECK (plan IN ('monthly', 'yearly')),
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
  stripe_sub_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: scores
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER CHECK (score >= 1 AND score <= 45) NOT NULL,
  played_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: draws
CREATE TABLE IF NOT EXISTS public.draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'simulated', 'published')),
  draw_type TEXT DEFAULT 'random' CHECK (draw_type IN ('random', 'algorithmic')),
  numbers integer[] NOT NULL, -- Array of 5 integers
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: prize_pools
CREATE TABLE IF NOT EXISTS public.prize_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_pool NUMERIC NOT NULL DEFAULT 0,
  match_5_pool NUMERIC NOT NULL DEFAULT 0, -- 40% (jackpot)
  match_4_pool NUMERIC NOT NULL DEFAULT 0, -- 35%
  match_3_pool NUMERIC NOT NULL DEFAULT 0, -- 25%
  jackpot_rollover NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: winners
CREATE TABLE IF NOT EXISTS public.winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  match_type INTEGER CHECK (match_type IN (3, 4, 5)) NOT NULL,
  prize_amount NUMERIC NOT NULL,
  proof_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: donations
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  charity_id UUID REFERENCES public.charities(id) ON DELETE SET NULL NOT NULL,
  amount NUMERIC NOT NULL,
  source TEXT CHECK (source IN ('subscription', 'independent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Row Level Security)
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Charities are readable by everyone, modifiable by admin
CREATE POLICY "Charities are viewable by everyone" ON public.charities FOR SELECT USING (true);
CREATE POLICY "Charities are modifiable by admins" ON public.charities FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Profiles readable/modifiable by owner or admin
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Scores readable/modifiable by owner or admin
CREATE POLICY "Users can view own scores" ON public.scores FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own scores" ON public.scores FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own scores" ON public.scores FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all scores" ON public.scores FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Subscriptions viewable by owner, manageable by admin/system
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Draws are viewable by everyone if published, else only by admins
CREATE POLICY "Published draws viewable by everyone" ON public.draws FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage all draws" ON public.draws FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Prize pools viewable by everyone if draw is published, else only admins
CREATE POLICY "Prize pools viewable by everyone" ON public.prize_pools FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.draws WHERE id = draw_id AND status = 'published')
);
CREATE POLICY "Admins can manage all prize pools" ON public.prize_pools FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Winners viewable by everyone if draw is published (maybe just user info mask)
-- For now, allow viewing winners of published draws.
CREATE POLICY "Winners viewable by everyone" ON public.winners FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.draws WHERE id = draw_id AND status = 'published')
);
CREATE POLICY "Users can update own winner proof" ON public.winners FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all winners" ON public.winners FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Donations viewable by owner or admin
CREATE POLICY "Users can view own donations" ON public.donations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all donations" ON public.donations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger to automatically create a profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 002_fix_rls_recursion.sql
-- Fixes the infinite recursion caused by evaluating the profiles table inside its own RLS policy

-- 1. Create a SECURITY DEFINER function to check admin status.
-- This bypasses RLS, preventing the infinite loop when checking auth.uid() against the profiles table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the recursive profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 3. Recreate them using the safe is_admin() function
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING ( public.is_admin() );
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING ( public.is_admin() );

-- 4. (Optional but recommended) Update other tables to use is_admin() for cleaner policies
DROP POLICY IF EXISTS "Charities are modifiable by admins" ON public.charities;
CREATE POLICY "Charities are modifiable by admins" ON public.charities FOR ALL USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can manage all scores" ON public.scores;
CREATE POLICY "Admins can manage all scores" ON public.scores FOR ALL USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR SELECT USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can manage all draws" ON public.draws;
CREATE POLICY "Admins can manage all draws" ON public.draws FOR ALL USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can manage all prize pools" ON public.prize_pools;
CREATE POLICY "Admins can manage all prize pools" ON public.prize_pools FOR ALL USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can manage all winners" ON public.winners;
CREATE POLICY "Admins can manage all winners" ON public.winners FOR ALL USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can manage all donations" ON public.donations;
CREATE POLICY "Admins can manage all donations" ON public.donations FOR ALL USING ( public.is_admin() );

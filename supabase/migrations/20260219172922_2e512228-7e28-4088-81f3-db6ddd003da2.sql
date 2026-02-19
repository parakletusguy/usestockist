
-- Step 1: Create enum and tables first (no policies yet)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, team_name)
);
ALTER TABLE public.user_teams ENABLE ROW LEVEL SECURITY;

-- Step 2: Create helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_team(_user_id uuid, _team_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_teams
    WHERE user_id = _user_id AND team_name = _team_name
  )
$$;

-- Step 3: RLS policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Step 4: RLS policies for user_teams
CREATE POLICY "Users can view own team assignments"
  ON public.user_teams FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage team assignments"
  ON public.user_teams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Step 5: Update daily_stock_sheets RLS policies
DROP POLICY IF EXISTS "Authenticated users can select daily_stock_sheets" ON public.daily_stock_sheets;
DROP POLICY IF EXISTS "Authenticated users can insert daily_stock_sheets" ON public.daily_stock_sheets;
DROP POLICY IF EXISTS "Authenticated users can update daily_stock_sheets" ON public.daily_stock_sheets;
DROP POLICY IF EXISTS "Authenticated users can delete daily_stock_sheets" ON public.daily_stock_sheets;

CREATE POLICY "Users can select own team stock sheets"
  ON public.daily_stock_sheets FOR SELECT TO authenticated
  USING (
    public.user_belongs_to_team(auth.uid(), retail_team_name)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert own team stock sheets"
  ON public.daily_stock_sheets FOR INSERT TO authenticated
  WITH CHECK (
    public.user_belongs_to_team(auth.uid(), retail_team_name)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can update own team stock sheets"
  ON public.daily_stock_sheets FOR UPDATE TO authenticated
  USING (
    public.user_belongs_to_team(auth.uid(), retail_team_name)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete stock sheets"
  ON public.daily_stock_sheets FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

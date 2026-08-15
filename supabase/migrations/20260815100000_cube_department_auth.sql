-- Migration: Cube Department Staff Authentication & Scoped Access
-- Date: 2026-08-15

-- 1. Update get_user_role() to recognise cube_staff
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    'viewer'
  );
$$;

-- 2. is_manager() re-declared
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() IN ('manager', 'admin');
$$;

-- 3. New helper: is_cube_staff()
CREATE OR REPLACE FUNCTION public.is_cube_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() = 'cube_staff';
$$;

-- 4. Update has_ledger_write_access() to include cube_staff
CREATE OR REPLACE FUNCTION public.has_ledger_write_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() IN ('manager', 'inventory', 'cube_staff');
$$;

-- 5. Department accessor from JWT
CREATE OR REPLACE FUNCTION public.get_user_department()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'department';
$$;

-- can write to specific department
CREATE OR REPLACE FUNCTION public.can_write_department(p_department text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_manager()
    OR public.get_user_role() = 'inventory'
    OR (public.is_cube_staff() AND p_department = 'Cube');
$$;

NOTIFY pgrst, 'reload schema';

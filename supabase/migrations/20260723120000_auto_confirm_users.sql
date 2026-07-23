-- Migration: Auto-confirm user emails upon signup
-- Automatically populates email_confirmed_at so users can sign in immediately
-- without being blocked by email confirmation delivery issues.

CREATE OR REPLACE FUNCTION public.handle_auto_confirm_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;

CREATE TRIGGER auto_confirm_user_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auto_confirm_user();

-- Confirm any existing unconfirmed users
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Seed a moderator role for a specific user — only inserts if the user exists in auth.users
INSERT INTO public.user_roles (user_id, role)
SELECT '2631c782-d2ab-4ca7-8d8f-d58383267c93', 'moderator'
WHERE EXISTS (
  SELECT 1 FROM auth.users WHERE id = '2631c782-d2ab-4ca7-8d8f-d58383267c93'
)
ON CONFLICT (user_id, role) DO NOTHING;
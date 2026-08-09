INSERT INTO public.user_roles (user_id, role)
VALUES ('2631c782-d2ab-4ca7-8d8f-d58383267c93', 'moderator')
ON CONFLICT (user_id, role) DO NOTHING;
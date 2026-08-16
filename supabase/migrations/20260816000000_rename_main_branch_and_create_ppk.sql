-- Migration: rename_main_branch_and_create_ppk_branch
-- 1. Rename existing Main Branch to 'BoxOffice Cinemas-GCM'
UPDATE public.branches
SET name = 'BoxOffice Cinemas-GCM'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 2. Ensure all existing users are assigned to BoxOffice Cinemas-GCM
INSERT INTO public.user_branches (user_id, branch_id, is_default)
SELECT id, '00000000-0000-0000-0000-000000000001'::uuid, true
FROM auth.users
ON CONFLICT (user_id, branch_id) DO UPDATE SET is_default = true;

-- 3. Create the second branch 'BoxOffice Cinemas-PPK'
INSERT INTO public.branches (name, is_active)
VALUES ('BoxOffice Cinemas-PPK', true)
ON CONFLICT (name) DO NOTHING;

-- Migration: Allow active branches to be read by authenticated and anon users
GRANT SELECT ON public.branches TO authenticated, anon;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'branches' AND policyname = 'Authenticated users view active branches') THEN
    DROP POLICY "Authenticated users view active branches" ON public.branches;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'branches' AND policyname = 'Anyone view active branches') THEN
    CREATE POLICY "Anyone view active branches" ON public.branches
      FOR SELECT TO authenticated, anon USING (is_active = true);
  END IF;
END $$;

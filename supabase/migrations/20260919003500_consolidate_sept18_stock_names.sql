-- Migration: Consolidate Sept 18 Stock Counts into Official Catalog Items
DO $$
BEGIN
  -- 1. Meat Pie (Official ID: '0aaff2a2-66df-4701-8fc3-6153f82c85d6', Duplicate: 'db57b7cf-3e62-4ec3-81e9-880992ac4646')
  DELETE FROM public.daily_stock_sheets WHERE date = '2026-09-18' AND item_id = '0aaff2a2-66df-4701-8fc3-6153f82c85d6'::uuid;
  UPDATE public.daily_stock_sheets 
  SET item_id = '0aaff2a2-66df-4701-8fc3-6153f82c85d6'::uuid
  WHERE date = '2026-09-18' AND item_id = 'db57b7cf-3e62-4ec3-81e9-880992ac4646'::uuid;
  DELETE FROM public.item_departments WHERE item_id = 'db57b7cf-3e62-4ec3-81e9-880992ac4646'::uuid;
  DELETE FROM public.items WHERE id = 'db57b7cf-3e62-4ec3-81e9-880992ac4646'::uuid;

  -- 2. Small Chops (Official ID: '45fb0ae0-a5a6-4445-a37e-d7dcf691ac54', Duplicate: '8c90097f-bfe9-4576-83c6-f71b51c37fba')
  DELETE FROM public.daily_stock_sheets WHERE date = '2026-09-18' AND item_id = '45fb0ae0-a5a6-4445-a37e-d7dcf691ac54'::uuid;
  UPDATE public.daily_stock_sheets 
  SET item_id = '45fb0ae0-a5a6-4445-a37e-d7dcf691ac54'::uuid
  WHERE date = '2026-09-18' AND item_id = '8c90097f-bfe9-4576-83c6-f71b51c37fba'::uuid;
  DELETE FROM public.item_departments WHERE item_id = '8c90097f-bfe9-4576-83c6-f71b51c37fba'::uuid;
  DELETE FROM public.items WHERE id = '8c90097f-bfe9-4576-83c6-f71b51c37fba'::uuid;

  -- 3. Schweppes Chapman Can (Official ID: 'e92eff3f-5dea-4164-a446-f3da7fae0827', Duplicate: '0b39d818-e00f-4445-9447-da690905ea33')
  DELETE FROM public.daily_stock_sheets WHERE date = '2026-09-18' AND item_id = 'e92eff3f-5dea-4164-a446-f3da7fae0827'::uuid;
  UPDATE public.daily_stock_sheets 
  SET item_id = 'e92eff3f-5dea-4164-a446-f3da7fae0827'::uuid
  WHERE date = '2026-09-18' AND item_id = '0b39d818-e00f-4445-9447-da690905ea33'::uuid;
  DELETE FROM public.item_departments WHERE item_id = '0b39d818-e00f-4445-9447-da690905ea33'::uuid;
  DELETE FROM public.items WHERE id = '0b39d818-e00f-4445-9447-da690905ea33'::uuid;

  -- 4. Straw (Official ID: 'b9928a9a-cfcc-40e5-9261-5c1dc7e3dcf1', Duplicate: '8941487d-f0a0-434f-a2ff-b6fed4ec2212')
  DELETE FROM public.daily_stock_sheets WHERE date = '2026-09-18' AND item_id = 'b9928a9a-cfcc-40e5-9261-5c1dc7e3dcf1'::uuid;
  UPDATE public.daily_stock_sheets 
  SET item_id = 'b9928a9a-cfcc-40e5-9261-5c1dc7e3dcf1'::uuid
  WHERE date = '2026-09-18' AND item_id = '8941487d-f0a0-434f-a2ff-b6fed4ec2212'::uuid;
  DELETE FROM public.item_departments WHERE item_id = '8941487d-f0a0-434f-a2ff-b6fed4ec2212'::uuid;
  DELETE FROM public.items WHERE id = '8941487d-f0a0-434f-a2ff-b6fed4ec2212'::uuid;

  -- 5. Take Away Bags (Official ID: '8354c4fb-d501-4a2c-b5bb-98c569ede6a4', Duplicate: 'e3326158-a091-465a-9c8e-5a00d66afaea')
  DELETE FROM public.daily_stock_sheets WHERE date = '2026-09-18' AND item_id = '8354c4fb-d501-4a2c-b5bb-98c569ede6a4'::uuid;
  UPDATE public.daily_stock_sheets 
  SET item_id = '8354c4fb-d501-4a2c-b5bb-98c569ede6a4'::uuid
  WHERE date = '2026-09-18' AND item_id = 'e3326158-a091-465a-9c8e-5a00d66afaea'::uuid;
  DELETE FROM public.item_departments WHERE item_id = 'e3326158-a091-465a-9c8e-5a00d66afaea'::uuid;
  DELETE FROM public.items WHERE id = 'e3326158-a091-465a-9c8e-5a00d66afaea'::uuid;

END $$;

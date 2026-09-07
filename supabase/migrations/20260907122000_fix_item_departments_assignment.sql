-- Migration: Backfill and sanitize item_departments junction
-- Date: 2026-09-07

-- 1. Ensure all items have at least one record in item_departments based on their items.department column
INSERT INTO public.item_departments (item_id, department)
SELECT id, department FROM public.items
WHERE id NOT IN (SELECT DISTINCT item_id FROM public.item_departments)
ON CONFLICT (item_id, department) DO NOTHING;

-- 2. Clean up specific items known to belong to Kitchen, Housekeeping, etc.
-- Kitchen items
INSERT INTO public.item_departments (item_id, department)
SELECT id, 'Kitchen' FROM public.items 
WHERE (name ILIKE '%kitchen glory%' OR name ILIKE '%raw corn%' OR category = 'Food')
ON CONFLICT (item_id, department) DO NOTHING;

-- If Kitchen items were mistakenly tagged ONLY as Retail, ensure Kitchen is assigned
-- Housekeeping items (Chafing Gel, Serviettes, Portion Nylon, POS Roll)
INSERT INTO public.item_departments (item_id, department)
SELECT id, 'Housekeeping' FROM public.items
WHERE (name ILIKE '%chafing gel%' OR name ILIKE '%portion nylon%' OR name ILIKE '%pos roll%')
ON CONFLICT (item_id, department) DO NOTHING;

-- Cube items
INSERT INTO public.item_departments (item_id, department)
SELECT id, 'Cube' FROM public.items
WHERE (name ILIKE '%chafing gel%' OR name ILIKE '%popcorn%' OR name ILIKE '%soda%' OR name ILIKE '%water%' OR name ILIKE '%serviette%' OR name ILIKE '%tissue%')
ON CONFLICT (item_id, department) DO NOTHING;

NOTIFY pgrst, 'reload schema';

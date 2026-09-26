-- Migration: Add Mixed Grill Shawarma and Beef Shawarma to Retail items
-- Date: 2026-09-25

-- 1. Insert items into public.items if they do not already exist
INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
SELECT 'Mixed Grill Shawarma', 'Food', 'Retail', 'pcs', 0, 3
WHERE NOT EXISTS (
  SELECT 1 FROM public.items WHERE lower(name) = lower('Mixed Grill Shawarma')
);

INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
SELECT 'Beef Shawarma', 'Food', 'Retail', 'pcs', 0, 3
WHERE NOT EXISTS (
  SELECT 1 FROM public.items WHERE lower(name) = lower('Beef Shawarma')
);

-- 2. Ensure item_departments mappings for Retail and Kitchen
INSERT INTO public.item_departments (item_id, department)
SELECT id, 'Retail' FROM public.items
WHERE lower(name) IN ('mixed grill shawarma', 'beef shawarma')
ON CONFLICT (item_id, department) DO NOTHING;

INSERT INTO public.item_departments (item_id, department)
SELECT id, 'Kitchen' FROM public.items
WHERE lower(name) IN ('mixed grill shawarma', 'beef shawarma')
ON CONFLICT (item_id, department) DO NOTHING;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

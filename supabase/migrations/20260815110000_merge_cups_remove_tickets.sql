-- Migration: Merge Smoothie Cups into Cups (Bar), remove ticket items
-- Date: 2026-08-15

-- 1. Update all inventory_transactions referencing Smoothie Cups -> Cups (Bar)
UPDATE public.inventory_transactions
SET item_id = (SELECT id FROM public.items WHERE name = 'Cups (Bar)' AND department = 'Bar' LIMIT 1)
WHERE item_id = (SELECT id FROM public.items WHERE name = 'Smoothie Cups' AND department = 'Bar' LIMIT 1);

-- 2. Update daily_stock_sheets referencing Smoothie Cups -> Cups (Bar)
UPDATE public.daily_stock_sheets
SET item_id = (SELECT id FROM public.items WHERE name = 'Cups (Bar)' AND department = 'Bar' LIMIT 1)
WHERE item_id = (SELECT id FROM public.items WHERE name = 'Smoothie Cups' AND department = 'Bar' LIMIT 1);

-- 3. Remove Smoothie Cups from item_departments junction
DELETE FROM public.item_departments
WHERE item_id = (SELECT id FROM public.items WHERE name = 'Smoothie Cups' AND department = 'Bar' LIMIT 1);

-- 4. Delete Smoothie Cups item
DELETE FROM public.items WHERE name = 'Smoothie Cups' AND department = 'Bar';

-- 5. Rename "Cups (Bar)" -> "Cups" for clarity
UPDATE public.items SET name = 'Cups' WHERE name = 'Cups (Bar)' AND department = 'Bar';

-- 6. Remove ticket items from item_departments junction
DELETE FROM public.item_departments
WHERE item_id IN (
  SELECT id FROM public.items WHERE name IN (
    'Regular Ticket', 'Gold Seat', 'Platinum Seat', 'VR Game',
    'Box-Signatr Access (Single)', 'Box-Signatr Access (Couple Seat)'
  )
);

-- 7. Remove ticket items from any transactions (should be zero, but clean up)
DELETE FROM public.inventory_transactions
WHERE item_id IN (
  SELECT id FROM public.items WHERE name IN (
    'Regular Ticket', 'Gold Seat', 'Platinum Seat', 'VR Game',
    'Box-Signatr Access (Single)', 'Box-Signatr Access (Couple Seat)'
  )
);

-- 8. Delete ticket items from catalog
DELETE FROM public.items WHERE name IN (
  'Regular Ticket', 'Gold Seat', 'Platinum Seat', 'VR Game',
  'Box-Signatr Access (Single)', 'Box-Signatr Access (Couple Seat)'
);

NOTIFY pgrst, 'reload schema';

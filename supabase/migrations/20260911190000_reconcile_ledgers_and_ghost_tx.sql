-- Migration: Reconcile ledgers and clean up orphan/ghost inventory_transactions
DELETE FROM public.inventory_transactions
WHERE type IN ('receive', 'issuance', 'transfer')
  AND metadata->>'ledger_id' IS NOT NULL
  AND (metadata->>'ledger_id')::uuid NOT IN (
    SELECT id FROM public.received_ledger
    UNION ALL
    SELECT id FROM public.issuance_ledger
    UNION ALL
    SELECT id FROM public.transfer_ledger
  );

UPDATE public.inventory_transactions it
SET quantity = rl.quantity,
    transaction_date = rl.date::timestamptz
FROM public.received_ledger rl
WHERE (it.metadata->>'ledger_id')::uuid = rl.id
  AND it.type = 'receive'
  AND (it.quantity != rl.quantity OR it.transaction_date::date != rl.date);

UPDATE public.inventory_transactions it
SET quantity = il.quantity,
    transaction_date = il.date::timestamptz
FROM public.issuance_ledger il
WHERE (it.metadata->>'ledger_id')::uuid = il.id
  AND it.type = 'issuance'
  AND (it.quantity != il.quantity OR it.transaction_date::date != il.date);

UPDATE public.inventory_transactions it
SET quantity = tl.quantity,
    transaction_date = tl.date::timestamptz
FROM public.transfer_ledger tl
WHERE (it.metadata->>'ledger_id')::uuid = tl.id
  AND it.type = 'transfer'
  AND (it.quantity != tl.quantity OR it.transaction_date::date != tl.date);

INSERT INTO public.inventory_transactions (item_id, type, quantity, transaction_date, department, branch_id, metadata)
SELECT 
  il.item_id,
  'issuance',
  il.quantity,
  il.date::timestamptz,
  'Retail',
  il.branch_id,
  jsonb_build_object(
    'recipient_group', il.recipient_group,
    'issued_by', il.issued_by,
    'ledger_id', il.id
  )
FROM public.issuance_ledger il
WHERE NOT EXISTS (
  SELECT 1 FROM public.inventory_transactions it
  WHERE it.type = 'issuance' AND (it.metadata->>'ledger_id')::uuid = il.id
);

INSERT INTO public.inventory_transactions (item_id, type, quantity, transaction_date, department, branch_id, metadata)
SELECT 
  rl.item_id,
  'receive',
  rl.quantity,
  rl.date::timestamptz,
  'Retail',
  rl.branch_id,
  jsonb_build_object(
    'supplier', rl.supplier,
    'invoice_number', rl.invoice_number,
    'ledger_id', rl.id
  )
FROM public.received_ledger rl
WHERE NOT EXISTS (
  SELECT 1 FROM public.inventory_transactions it
  WHERE it.type = 'receive' AND (it.metadata->>'ledger_id')::uuid = rl.id
);

UPDATE public.items 
SET unit_of_measure = 'pcs', updated_at = now()
WHERE id = '8354c4fb-d501-4a2c-b5bb-98c569ede6a4';

UPDATE public.daily_stock_sheets
SET close_qty = 0, open_qty = 0, remark = 'Zeroed prior count - restocked on Sept 11'
WHERE item_id = '8354c4fb-d501-4a2c-b5bb-98c569ede6a4' AND date >= '2026-09-01';

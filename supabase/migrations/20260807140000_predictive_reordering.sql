-- Migration: Predictive Automated Reordering Engine (Manager-Only)
-- Date: 2026-08-07

-- 1. Extend items table with lead time and safety buffer attributes
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 3 NOT NULL,
  ADD COLUMN IF NOT EXISTS safety_buffer_days INTEGER DEFAULT 2 NOT NULL,
  ADD COLUMN IF NOT EXISTS reorder_point NUMERIC DEFAULT 0;

-- 2. Create purchase_order_status Enum
DO $$ BEGIN
  CREATE TYPE public.purchase_order_status AS ENUM ('draft', 'approved', 'ordered', 'received', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Create purchase_orders table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  suggested_quantity NUMERIC NOT NULL,
  ordered_quantity NUMERIC,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  status public.purchase_order_status NOT NULL DEFAULT 'draft',
  reorder_reason TEXT,
  daily_velocity NUMERIC,
  days_to_stockout NUMERIC,
  supplier TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_item_id ON public.purchase_orders(item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_at ON public.purchase_orders(created_at);

-- 5. Enable Row-Level Security (RLS) & Manager Policies
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "purchase_orders_select" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_insert" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_update" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_delete" ON public.purchase_orders;

-- Managers only policies
CREATE POLICY "purchase_orders_select" ON public.purchase_orders 
  FOR SELECT TO authenticated 
  USING (public.is_manager());

CREATE POLICY "purchase_orders_insert" ON public.purchase_orders 
  FOR INSERT TO authenticated 
  WITH CHECK (public.is_manager());

CREATE POLICY "purchase_orders_update" ON public.purchase_orders 
  FOR UPDATE TO authenticated 
  USING (public.is_manager()) 
  WITH CHECK (public.is_manager());

CREATE POLICY "purchase_orders_delete" ON public.purchase_orders 
  FOR DELETE TO authenticated 
  USING (public.is_manager());

-- 6. Predictive Calculation Engine RPC Function
CREATE OR REPLACE FUNCTION public.calculate_predictive_reorders(p_lookback_days INT DEFAULT 30)
RETURNS TABLE (
  created_count INT,
  existing_count INT,
  analyzed_items_count INT
) AS $$
DECLARE
  v_created_count INT := 0;
  v_existing_count INT := 0;
  v_analyzed_items_count INT := 0;
  v_item RECORD;
  v_issuance_qty NUMERIC;
  v_tx_issuance_qty NUMERIC;
  v_total_issued NUMERIC;
  v_daily_velocity NUMERIC;
  v_current_stock NUMERIC;
  v_days_to_stockout NUMERIC;
  v_reorder_point NUMERIC;
  v_suggested_qty NUMERIC;
  v_existing_po_id UUID;
  v_lookback_interval INTERVAL;
BEGIN
  -- Security enforcement: Manager only
  IF NOT public.is_manager() THEN
    RAISE EXCEPTION 'Access Denied: Only managers can execute predictive reordering analysis.';
  END IF;

  v_lookback_interval := (p_lookback_days || ' days')::INTERVAL;

  -- Loop through all active items
  FOR v_item IN 
    SELECT 
      i.id, 
      i.name, 
      i.category, 
      i.department,
      i.unit_cost, 
      i.low_stock_threshold,
      COALESCE(i.lead_time_days, 3) as lead_time_days,
      COALESCE(i.safety_buffer_days, 2) as safety_buffer_days
    FROM public.items i
  LOOP
    v_analyzed_items_count := v_analyzed_items_count + 1;

    -- 1. Calculate issuance from issuance_ledger over lookback period
    SELECT COALESCE(SUM(quantity), 0)
    INTO v_issuance_qty
    FROM public.issuance_ledger
    WHERE item_id = v_item.id
      AND date >= (CURRENT_DATE - p_lookback_days);

    -- 2. Calculate issuance/sales from inventory_transactions over lookback period
    SELECT COALESCE(SUM(quantity), 0)
    INTO v_tx_issuance_qty
    FROM public.inventory_transactions
    WHERE item_id = v_item.id
      AND type IN ('sale', 'issuance', 'damage')
      AND transaction_date >= (now() - v_lookback_interval);

    v_total_issued := GREATEST(v_issuance_qty, v_tx_issuance_qty);
    v_daily_velocity := ROUND((v_total_issued / GREATEST(p_lookback_days, 1))::numeric, 2);

    -- 3. Get current closing stock from latest daily_stock_sheets
    SELECT COALESCE(close_qty, 0)
    INTO v_current_stock
    FROM public.daily_stock_sheets
    WHERE item_id = v_item.id
    ORDER BY date DESC, created_at DESC
    LIMIT 1;

    IF v_current_stock IS NULL THEN
      v_current_stock := 0;
    END IF;

    -- 4. Calculate Days to Stockout & Reorder Point
    IF v_daily_velocity > 0 THEN
      v_days_to_stockout := ROUND((v_current_stock / v_daily_velocity)::numeric, 1);
    ELSE
      v_days_to_stockout := 999;
    END IF;

    v_reorder_point := (v_item.lead_time_days + v_item.safety_buffer_days) * GREATEST(v_daily_velocity, 1);
    IF v_item.low_stock_threshold > v_reorder_point THEN
      v_reorder_point := v_item.low_stock_threshold;
    END IF;

    -- 5. Trigger draft purchase order if stock <= reorder_point
    IF v_current_stock <= v_reorder_point AND (v_daily_velocity > 0 OR v_current_stock = 0) THEN
      -- Check if active draft/approved/ordered PO exists for this item
      SELECT id INTO v_existing_po_id
      FROM public.purchase_orders
      WHERE item_id = v_item.id
        AND status IN ('draft', 'approved', 'ordered')
      LIMIT 1;

      IF v_existing_po_id IS NOT NULL THEN
        v_existing_count := v_existing_count + 1;
      ELSE
        -- Suggested quantity covers (lead_time + safety_buffer + 7 days reserve)
        v_suggested_qty := GREATEST(
          CEIL((v_item.lead_time_days + v_item.safety_buffer_days + 7) * GREATEST(v_daily_velocity, 1)),
          10
        );

        INSERT INTO public.purchase_orders (
          item_id,
          suggested_quantity,
          ordered_quantity,
          unit_cost,
          status,
          reorder_reason,
          daily_velocity,
          days_to_stockout,
          department,
          created_by
        ) VALUES (
          v_item.id,
          v_suggested_qty,
          v_suggested_qty,
          COALESCE(v_item.unit_cost, 0),
          'draft',
          CASE 
            WHEN v_days_to_stockout <= 3 THEN 'CRITICAL: Predicted stockout in ' || v_days_to_stockout || ' days (' || v_daily_velocity || ' units/day velocity)'
            WHEN v_days_to_stockout <= 7 THEN 'WARNING: Predicted stockout in ' || v_days_to_stockout || ' days (' || v_daily_velocity || ' units/day velocity)'
            ELSE 'REORDER POINT BREACHED: Current stock (' || v_current_stock || ') <= Reorder Point (' || v_reorder_point || ')'
          END,
          v_daily_velocity,
          v_days_to_stockout,
          v_item.department,
          auth.uid()
        );

        v_created_count := v_created_count + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_created_count, v_existing_count, v_analyzed_items_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

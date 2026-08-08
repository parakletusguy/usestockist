ALTER TABLE public.received_ledger ADD COLUMN IF NOT EXISTS department text;

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  suggested_quantity numeric NOT NULL DEFAULT 0,
  ordered_quantity numeric,
  unit_cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  reorder_reason text,
  daily_velocity numeric,
  days_to_stockout numeric,
  supplier text,
  department text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "po_select" ON public.purchase_orders;
CREATE POLICY "po_select" ON public.purchase_orders FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "po_insert" ON public.purchase_orders;
CREATE POLICY "po_insert" ON public.purchase_orders FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role));

DROP POLICY IF EXISTS "po_update" ON public.purchase_orders;
CREATE POLICY "po_update" ON public.purchase_orders FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role));

DROP POLICY IF EXISTS "po_delete" ON public.purchase_orders;
CREATE POLICY "po_delete" ON public.purchase_orders FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS set_purchase_orders_updated_at ON public.purchase_orders;
CREATE TRIGGER set_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.calculate_predictive_reorders(p_lookback_days integer DEFAULT 30)
RETURNS TABLE (created_count integer, existing_count integer, analyzed_items_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_created integer := 0;
  v_existing integer := 0;
  v_analyzed integer := 0;
  r record;
  v_start date := (current_date - p_lookback_days);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  FOR r IN
    SELECT
      i.id AS item_id,
      i.department,
      COALESCE(i.unit_cost, 0) AS unit_cost,
      COALESCE(i.low_stock_threshold, 0) AS threshold,
      COALESCE((SELECT SUM(d.sales_qty) FROM daily_stock_sheets d
                WHERE d.item_id = i.id AND d.date >= v_start), 0) AS total_sales,
      COALESCE((SELECT SUM(rl.quantity) FROM received_ledger rl WHERE rl.item_id = i.id), 0)
        - COALESCE((SELECT SUM(il.quantity) FROM issuance_ledger il WHERE il.item_id = i.id), 0)
        - COALESCE((SELECT SUM(tl.quantity) FROM transfer_ledger tl WHERE tl.item_id = i.id), 0)
        AS on_hand
    FROM items i
  LOOP
    v_analyzed := v_analyzed + 1;

    DECLARE
      v_velocity numeric := r.total_sales / GREATEST(p_lookback_days, 1);
      v_days numeric;
      v_suggested numeric;
    BEGIN
      IF v_velocity <= 0 THEN
        CONTINUE;
      END IF;

      v_days := GREATEST(r.on_hand, 0) / v_velocity;

      IF v_days > 7 THEN
        CONTINUE;
      END IF;

      IF EXISTS (SELECT 1 FROM purchase_orders po
                 WHERE po.item_id = r.item_id
                   AND po.status IN ('draft','approved','ordered')) THEN
        v_existing := v_existing + 1;
        CONTINUE;
      END IF;

      v_suggested := CEIL(GREATEST(v_velocity * 14 - GREATEST(r.on_hand, 0), 1));

      INSERT INTO purchase_orders (
        item_id, suggested_quantity, unit_cost, status, reorder_reason,
        daily_velocity, days_to_stockout, department
      ) VALUES (
        r.item_id, v_suggested, r.unit_cost, 'draft',
        'Projected stockout in ' || ROUND(v_days, 1) || ' days at ' || ROUND(v_velocity, 2) || '/day',
        ROUND(v_velocity, 4), ROUND(v_days, 2), r.department
      );

      v_created := v_created + 1;
    END;
  END LOOP;

  RETURN QUERY SELECT v_created, v_existing, v_analyzed;
END;
$$;

REVOKE ALL ON FUNCTION public.calculate_predictive_reorders(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calculate_predictive_reorders(integer) TO authenticated;
-- Migration: create get_visible_pins RPC to return pins that are currently visible
-- Relies on existing function is_pin_visible_now(pin_id uuid)

CREATE OR REPLACE FUNCTION public.get_visible_pins()
RETURNS SETOF public.pins
LANGUAGE sql
AS $$
  SELECT p.*
  FROM public.pins p
  WHERE p.status IN ('active','paid')
    AND p.status <> 'pending_payment'
    AND public.is_pin_visible_now(p.id)
  ORDER BY p.created_at DESC;
$$;

-- Grant execute to anon if you need to call from client (optional):
-- GRANT EXECUTE ON FUNCTION public.get_visible_pins() TO anon;

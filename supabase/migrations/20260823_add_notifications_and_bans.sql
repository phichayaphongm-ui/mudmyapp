-- Migration: add notifications table, user ban fields, visibility function, and report trigger
-- Backup your DB before running on production.

BEGIN;

-- 1) enable uuid generator if not present
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) notifications table
-- NOTE: Some projects use text ids for `users.id`. To avoid FK type errors,
-- we store `user_id` as text here and create an index. If your users.id is
-- uuid and you prefer a foreign key, change `user_id` to uuid and add the FK.
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  type text NOT NULL,
  payload jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- index to speed lookups by user_id
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- 3) add ban-related fields to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS ban_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_permanently_banned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_until timestamptz,
  ADD COLUMN IF NOT EXISTS ban_history jsonb DEFAULT '[]'::jsonb;

-- 4) function: is_pin_visible_now
-- If an existing function has different parameter names/types, drop it first
DROP FUNCTION IF EXISTS public.is_pin_visible_now(uuid);

CREATE OR REPLACE FUNCTION public.is_pin_visible_now(p_pin_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_show boolean;
  v_schedule jsonb;
  v_dow int := EXTRACT(dow FROM now())::int; -- 0=Sunday..6=Saturday
  v_start time;
  v_end time;
  v_in_day boolean;
BEGIN
  SELECT show_on_map, display_schedule INTO v_show, v_schedule
  FROM public.pins
  WHERE id = p_pin_id;

  IF v_show IS NULL THEN
    RETURN true; -- default visible if not set
  END IF;

  IF NOT v_show THEN
    RETURN false;
  END IF;

  IF v_schedule IS NULL THEN
    RETURN true;
  END IF;

  -- check day inclusion (schedule->'days' expected array of integers 0..6)
  v_in_day := EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(v_schedule->'days') d
    WHERE (d)::int = v_dow
  );

  IF NOT v_in_day THEN
    RETURN false;
  END IF;

  -- parse start/end times (HH24:MI)
  v_start := (v_schedule->>'start')::time;
  v_end := (v_schedule->>'end')::time;

  IF v_start <= v_end THEN
    RETURN now()::time >= v_start AND now()::time <= v_end;
  ELSE
    -- overnight window (e.g., 22:00 - 03:00)
    RETURN now()::time >= v_start OR now()::time <= v_end;
  END IF;
END;
$$;

-- 5) trigger function to handle reports -> expire pin, increment ban, insert notification
CREATE OR REPLACE FUNCTION public.handle_pin_reports()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  old_count int := COALESCE(array_length(OLD.reports,1),0);
  new_count int := COALESCE(array_length(NEW.reports,1),0);
  threshold int := 5;
  owner_id uuid := NEW.owner_id;
  new_ban_count int;
  is_permanent boolean;
  until_ts timestamptz;
BEGIN
  -- Only act when reports array changed
  IF NEW.reports IS DISTINCT FROM OLD.reports THEN
    IF new_count >= threshold AND old_count < threshold THEN
      -- expire the pin
      UPDATE public.pins
      SET status = 'expired',
          updated_at = now()
      WHERE id = NEW.id;

      -- increment user's ban_count
      UPDATE public.users
      SET ban_count = COALESCE(ban_count,0) + 1
      WHERE id = owner_id;

      SELECT ban_count INTO new_ban_count FROM public.users WHERE id = owner_id;

      is_permanent := new_ban_count >= 3;
      until_ts := CASE WHEN is_permanent THEN NULL ELSE now() + interval '7 days' END;

      -- update user's ban flags/history
      UPDATE public.users
      SET is_permanently_banned = is_permanent,
          banned_until = until_ts,
          ban_history = COALESCE(ban_history, '[]'::jsonb) || jsonb_build_array(
            jsonb_build_object(
              'reason', format('Pin %s reported %s times (auto-ban)', NEW.id, threshold),
              'bannedAt', now(),
              'until', CASE WHEN is_permanent THEN 'Permanent' ELSE (now() + interval '7 days')::text END
            )
          )
      WHERE id = owner_id;

      -- insert notification for owner
      INSERT INTO public.notifications (user_id, type, payload)
      VALUES (
        owner_id,
        'pin_reported',
        jsonb_build_object(
          'pinId', NEW.id,
          'reportCount', new_count,
          'message_th', format('หมุดของคุณถูกรายงาน %s ครั้ง และถูกระงับการใช้งานชั่วคราว', new_count),
          'autoBan', true
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 6) create trigger (AFTER UPDATE so cross-table updates are safe)
DROP TRIGGER IF EXISTS trg_handle_pin_reports ON public.pins;
CREATE TRIGGER trg_handle_pin_reports
AFTER UPDATE OF reports ON public.pins
FOR EACH ROW
WHEN (OLD.reports IS DISTINCT FROM NEW.reports)
EXECUTE FUNCTION public.handle_pin_reports();

COMMIT;

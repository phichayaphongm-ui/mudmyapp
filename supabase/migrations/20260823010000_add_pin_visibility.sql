-- Migration: add show_on_map and display_schedule to pins
-- 2026-08-23

-- 1) เพิ่มคอลัมน์เก็บสถานะแสดง/ซ่อน และตารางเวลา (jsonb)
ALTER TABLE public."pins"
ADD COLUMN IF NOT EXISTS show_on_map boolean DEFAULT true;

ALTER TABLE public."pins"
ADD COLUMN IF NOT EXISTS display_schedule jsonb;

-- 2) เติมค่าเริ่มต้นสำหรับเรคคอร์ดเก่า (ถาจำเป็น)
UPDATE public."pins"
SET show_on_map = true
WHERE show_on_map IS NULL;

-- 3) ตัวอย่างคำสั่งเปิด/ปิด และตั้งเวลา (ปรับ id ตามต้องการ)
-- ปิดการแสดงหมุดเฉพาะรายการ
-- UPDATE public."pins"
-- SET show_on_map = false
-- WHERE id = 'PUT_PIN_ID_HERE';

-- ตั้งตารางเวลา (ตัวอย่าง: จันทร์-ศุกร์ 08:00-17:00)
-- UPDATE public."pins"
-- SET display_schedule = jsonb_build_object(
--   'enabled', true,
--   'days', jsonb_build_array(1,2,3,4,5),  -- 0=Sunday .. 6=Saturday
--   'start', '08:00',
--   'end', '17:00'
-- )
-- WHERE id = 'PUT_PIN_ID_HERE';

-- ปิดการใช้งานตารางเวลา (ลบหรือตั้ง enabled=false)
-- UPDATE public."pins"
-- SET display_schedule = jsonb_build_object('enabled', false)
-- WHERE id = 'PUT_PIN_ID_HERE';

-- 4) ฟังก์ชันช่วยตรวจว่า “หมุดนี้ควรแสดงตอนนี้หรือไม่”
DROP FUNCTION IF EXISTS public.is_pin_visible_now(uuid);
CREATE OR REPLACE FUNCTION public.is_pin_visible_now(pin_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  r record;
  dow int := extract(dow from now())::int; -- 0 = Sunday .. 6 = Saturday
  now_time text := to_char(now(), 'HH24:MI');
BEGIN
  SELECT show_on_map, display_schedule INTO r FROM public."pins" WHERE id = pin_id;
  IF NOT FOUND THEN RETURN false; END IF;

  IF r.show_on_map IS FALSE THEN
    RETURN false;
  END IF;

  IF r.display_schedule IS NULL OR (r.display_schedule->>'enabled')::boolean IS NOT TRUE THEN
    RETURN true;
  END IF;

  -- check day
  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(r.display_schedule->'days') AS d WHERE d::int = dow
  ) THEN
    RETURN false;
  END IF;

  -- check time bounds (if fields present)
  IF (r.display_schedule->>'start') IS NULL OR (r.display_schedule->>'end') IS NULL THEN
    RETURN true;
  END IF;

  IF (r.display_schedule->>'start') <= now_time AND now_time <= (r.display_schedule->>'end') THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 5) ตัวอย่าง query เพื่อดึงเฉพาะหมุดที่ควรแสดงตอนนี้
-- SELECT *
-- FROM public."pins" p
-- WHERE COALESCE(p.show_on_map, true) = true
--   AND (
--     p.display_schedule IS NULL
--     OR (p.display_schedule->>'enabled')::boolean IS NOT TRUE
--     OR (
--       EXISTS (SELECT 1 FROM jsonb_array_elements_text(p.display_schedule->'days') AS d WHERE d::int = extract(dow from now())::int)
--       AND (p.display_schedule->>'start') <= to_char(now(),'HH24:MI')
--       AND to_char(now(),'HH24:MI') <= (p.display_schedule->>'end')
--     )
--   );

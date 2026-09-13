-- Restrict newly created or updated pins to Thailand's geographic bounding box.
-- NOT VALID preserves any legacy rows while enforcing the rule for new writes.
alter table public.pins
  drop constraint if exists pins_thailand_bounds;

alter table public.pins
  add constraint pins_thailand_bounds
  check (
    lat between 5.61 and 20.47
    and lng between 97.34 and 105.65
  ) not valid;

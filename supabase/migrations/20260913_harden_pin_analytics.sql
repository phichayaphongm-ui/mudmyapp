-- Harden pin analytics against direct inserts and rapid duplicate events.
-- Authenticated users use their auth id; anonymous visitors pass a browser session key.
alter table public.pin_events
  add column if not exists visitor_key text;

create index if not exists pin_events_dedupe_idx
  on public.pin_events (pin_id, type, visitor_key, created_at desc);

alter table public.pin_events
  drop constraint if exists pin_events_type_check;

alter table public.pin_events
  add constraint pin_events_type_check
  check (type in ('view', 'click'));

drop policy if exists "Anyone can insert pin events" on public.pin_events;

create or replace function public.record_pin_event(
  p_pin_id text,
  p_type text,
  p_visitor_key text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  effective_visitor_key text := coalesce(auth.uid()::text, nullif(left(trim(p_visitor_key), 128), ''));
  event_recorded boolean := false;
begin
  if p_type not in ('view', 'click') then
    raise exception 'Invalid analytics event type';
  end if;
  if effective_visitor_key is null then
    raise exception 'Visitor identity is required';
  end if;
  if not exists (
    select 1 from public.pins
    where id = p_pin_id and status in ('active', 'paid')
      and (expires_at is null or expires_at > now())
  ) then
    return false;
  end if;

  if not exists (
    select 1
    from public.pin_events
    where pin_id = p_pin_id
      and type = p_type
      and visitor_key = effective_visitor_key
      and created_at > now() - interval '10 minutes'
  ) then
    insert into public.pin_events (pin_id, type, visitor_key, timestamp)
    values (p_pin_id, p_type, effective_visitor_key, now());

    if p_type = 'view' then
      update public.pins set views = views + 1, updated_at = now() where id = p_pin_id;
    else
      update public.pins set clicks = clicks + 1, updated_at = now() where id = p_pin_id;
    end if;
    event_recorded := true;
  end if;

  return event_recorded;
end;
$$;

revoke all on function public.record_pin_event(text, text, text) from public;
grant execute on function public.record_pin_event(text, text, text) to anon, authenticated;

-- Counters must only be changed through record_pin_event.
revoke all on function public.increment_pin_views(text) from public;
revoke all on function public.increment_pin_clicks(text) from public;
revoke all on function public.increment_pin_views(text) from anon, authenticated;
revoke all on function public.increment_pin_clicks(text) from anon, authenticated;
revoke update (views, clicks) on public.pins from anon, authenticated;

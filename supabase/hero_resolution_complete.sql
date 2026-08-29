-- Mudmy: atomic emergency resolution and Hero thank-you history
-- Run this script in Supabase SQL Editor or apply it as a migration.

begin;

-- Keep the JSON history fields available for existing databases.
alter table public.users
  add column if not exists hero_cases_count integer not null default 0,
  add column if not exists hero_cases jsonb not null default '[]'::jsonb;

alter table public.pins
  add column if not exists hero_id text,
  add column if not exists thank_you_message text;

-- Do not allow a logged-in user to edit another user's pin. The client UI is
-- not a security boundary, so this must be enforced by RLS as well.
drop policy if exists "Authenticated users can update pins" on public.pins;
drop policy if exists "Owners can update their own pins" on public.pins;
create policy "Owners can update their own pins"
  on public.pins for update
  using (auth.uid()::text = owner_id)
  with check (auth.uid()::text = owner_id);

-- Close an emergency pin and append the Hero history in one transaction.
-- The row locks make retries/concurrent requests deterministic.
create or replace function public.resolve_emergency_pin(
  p_pin_id text,
  p_hero_id text,
  p_thank_you_message text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_pin public.pins%rowtype;
  target_hero public.users%rowtype;
  history_entry jsonb;
  thank_you text := left(trim(coalesce(p_thank_you_message, '')), 100);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into target_pin
  from public.pins
  where id = p_pin_id
  for update;

  if not found then
    raise exception 'Pin not found';
  end if;
  if target_pin.owner_id is distinct from auth.uid()::text then
    raise exception 'Only the pin owner can resolve this pin';
  end if;
  if target_pin.category <> 'emergency' then
    raise exception 'Only emergency pins can be resolved as hero cases';
  end if;
  if target_pin.status = 'resolved' then
    raise exception 'This pin has already been resolved';
  end if;
  if nullif(trim(coalesce(p_hero_id, '')), '') is null then
    raise exception 'A Hero must be selected';
  end if;
  if p_hero_id = target_pin.owner_id then
    raise exception 'A different Hero must be selected';
  end if;
  if thank_you = '' then
    raise exception 'A thank-you message is required';
  end if;

  select * into target_hero
  from public.users
  where id = p_hero_id
  for update;

  if not found then
    raise exception 'Hero not found';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(coalesce(target_hero.hero_cases, '[]'::jsonb)) item
    where item->>'pinId' = target_pin.id
  ) then
    raise exception 'This Hero case has already been recorded';
  end if;

  history_entry := jsonb_build_object(
    'pinId', target_pin.id,
    'title', target_pin.title,
    'description', coalesce(target_pin.description, ''),
    'category', target_pin.category,
    'helpedAt', now(),
    'district', coalesce(target_pin.district, ''),
    'province', coalesce(target_pin.province, ''),
    'thankedBy', coalesce(target_pin.owner_name, ''),
    'thankYouMessage', thank_you
  );

  update public.users
  set hero_cases_count = coalesce(target_hero.hero_cases_count, 0) + 1,
      hero_cases = coalesce(target_hero.hero_cases, '[]'::jsonb) || jsonb_build_array(history_entry),
      updated_at = now()
  where id = p_hero_id;

  update public.pins
  set status = 'resolved',
      hero_id = p_hero_id,
      thank_you_message = thank_you,
      updated_at = now()
  where id = target_pin.id;
end;
$$;

revoke all on function public.resolve_emergency_pin(text, text, text) from public;
grant execute on function public.resolve_emergency_pin(text, text, text) to authenticated;

commit;

-- Verification query: inspect Hero history and thank-you messages.
-- select id, nickname, hero_cases_count, hero_cases
-- from public.users
-- where hero_cases_count > 0
-- order by hero_cases_count desc;

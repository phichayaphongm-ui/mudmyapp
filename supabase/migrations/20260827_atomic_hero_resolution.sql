-- Resolve an emergency pin and record the hero case atomically.
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
  target_user public.users%rowtype;
  hero_case jsonb;
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
  if target_pin.owner_id <> auth.uid()::text then
    raise exception 'Only the pin owner can resolve this pin';
  end if;
  if target_pin.category <> 'emergency' then
    raise exception 'Only emergency pins can be resolved as hero cases';
  end if;
  if target_pin.status = 'resolved' then
    raise exception 'This pin has already been resolved';
  end if;
  if p_hero_id is null or p_hero_id = target_pin.owner_id then
    raise exception 'A different hero must be selected';
  end if;

  select * into target_user
  from public.users
  where id = p_hero_id
  for update;

  if not found then
    raise exception 'Hero not found';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(coalesce(target_user.hero_cases, '[]'::jsonb)) item
    where item->>'pinId' = target_pin.id
  ) then
    raise exception 'This hero case has already been recorded';
  end if;

  hero_case := jsonb_build_object(
    'pinId', target_pin.id,
    'title', target_pin.title,
    'description', coalesce(target_pin.description, ''),
    'category', target_pin.category,
    'helpedAt', now(),
    'district', coalesce(target_pin.district, ''),
    'province', coalesce(target_pin.province, ''),
    'thankedBy', coalesce(target_pin.owner_name, ''),
    'thankYouMessage', coalesce(p_thank_you_message, '')
  );

  update public.users
  set hero_cases_count = coalesce(target_user.hero_cases_count, 0) + 1,
      hero_cases = coalesce(target_user.hero_cases, '[]'::jsonb) || jsonb_build_array(hero_case),
      updated_at = now()
  where id = p_hero_id;

  update public.pins
  set status = 'resolved',
      hero_id = p_hero_id,
      thank_you_message = coalesce(p_thank_you_message, ''),
      updated_at = now()
  where id = target_pin.id;
end;
$$;

revoke all on function public.resolve_emergency_pin(text, text, text) from public;
grant execute on function public.resolve_emergency_pin(text, text, text) to authenticated;

drop policy if exists "Authenticated users can update pins" on public.pins;
create policy "Owners can update their own pins"
  on public.pins for update
  using (auth.uid()::text = owner_id)
  with check (auth.uid()::text = owner_id);
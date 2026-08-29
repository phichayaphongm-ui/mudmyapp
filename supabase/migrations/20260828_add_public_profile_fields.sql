-- Public profile fields for bio and per-section visibility.
-- Run in Supabase SQL Editor before using the profile settings.

alter table public.users
  add column if not exists bio text,
  add column if not exists profile_visibility text not null default 'public',
  add column if not exists show_phone boolean not null default true,
  add column if not exists show_email boolean not null default true,
  add column if not exists show_location boolean not null default true,
  add column if not exists show_line boolean not null default false,
  add column if not exists show_facebook boolean not null default false,
  add column if not exists show_pins boolean not null default true,
  add column if not exists show_hero_history boolean not null default true;

alter table public.users
  drop constraint if exists users_profile_visibility_check;

alter table public.users
  add constraint users_profile_visibility_check
  check (profile_visibility in ('public', 'private'));

update public.users
set profile_visibility = 'public'
where profile_visibility is null or profile_visibility not in ('public', 'private');

comment on column public.users.bio is 'Short public profile introduction';
comment on column public.users.show_pins is 'Whether public visitors can see this user''s pins';
comment on column public.users.show_hero_history is 'Whether public visitors can see this user''s hero history';

create or replace function public.get_public_user_profile(p_uid text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select case
    when u.profile_visibility = 'private' and auth.uid()::text is distinct from u.id then null
    else jsonb_build_object(
      'id', u.id,
      'name', u.name,
      'nickname', u.nickname,
      'avatar', u.avatar,
      'bio', u.bio,
      'profile_visibility', u.profile_visibility,
      'email', case when u.show_email and (u.profile_visibility = 'public' or auth.uid()::text = u.id) then u.email else null end,
      'phone', case when u.show_phone and (u.profile_visibility = 'public' or auth.uid()::text = u.id) then u.phone else null end,
      'line', case when u.show_line and (u.profile_visibility = 'public' or auth.uid()::text = u.id) then u.line else null end,
      'facebook', case when u.show_facebook and (u.profile_visibility = 'public' or auth.uid()::text = u.id) then u.facebook else null end,
      'province', case when u.show_location then u.province else null end,
      'plan', u.plan,
      'active_pins', u.active_pins,
      'rating', u.rating,
      'review_count', u.review_count,
      'hero_cases_count', u.hero_cases_count,
      'hero_cases', case when u.show_hero_history then u.hero_cases else '[]'::jsonb end,
      'created_at', u.created_at,
      'user_type', u.user_type,
      'show_pins', u.show_pins,
      'show_hero_history', u.show_hero_history,
      'show_line', u.show_line,
      'show_facebook', u.show_facebook,
      'show_email', u.show_email,
      'show_phone', u.show_phone,
      'show_location', u.show_location
    )
  end
  from public.users u
  where u.id = p_uid;
$$;

revoke all on function public.get_public_user_profile(text) from public;
grant execute on function public.get_public_user_profile(text) to anon, authenticated;

create or replace function public.get_public_user_pins(p_uid text)
returns setof public.pins
language sql
security definer
set search_path = public
as $$
  select p.*
  from public.pins p
  join public.users u on u.id = p.owner_id
  where p.owner_id = p_uid
    and p.status in ('active', 'paid')
    and (p.expires_at is null or p.expires_at > now())
    and (u.profile_visibility = 'public' or auth.uid()::text = u.id)
    and (u.show_pins or auth.uid()::text = u.id);
$$;

revoke all on function public.get_public_user_pins(text) from public;
grant execute on function public.get_public_user_pins(text) to anon, authenticated;

-- Final production hardening for Mudmy
-- This script should be reviewed and run in Supabase SQL Editor after backup.

-- ---------------------------------------------------------------------------
-- 1) USERS: keep private data protected
-- ---------------------------------------------------------------------------

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

-- Keep all private fields hidden from anonymous access
alter table public.users enable row level security;

drop policy if exists "Anyone can read user profiles" on public.users;
drop policy if exists "Users can read their own profile" on public.users;
drop policy if exists "Service role can read all users" on public.users;
drop policy if exists "Users can update their own profile" on public.users;
drop policy if exists "Users can insert their own profile" on public.users;

create policy "Users can read their own profile"
on public.users for select
using (auth.uid()::text = id);

create policy "Service role can read all users"
on public.users for select
using (auth.role() = 'service_role');

create policy "Users can update their own profile"
on public.users for update
using (auth.uid()::text = id)
with check (auth.uid()::text = id);

create policy "Users can insert their own profile"
on public.users for insert
with check (auth.uid()::text = id);

-- ---------------------------------------------------------------------------
-- 2) PUBLIC PROFILE: allowlist only
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- 3) PINS
-- ---------------------------------------------------------------------------

alter table public.pins enable row level security;

drop policy if exists "Anyone can read pins" on public.pins;
drop policy if exists "Authenticated users can create pins" on public.pins;
drop policy if exists "Owners can update their own pins" on public.pins;
drop policy if exists "Owners can delete their own pins" on public.pins;

create policy "Anyone can read pins"
on public.pins for select
using (true);

create policy "Authenticated users can create pins"
on public.pins for insert
with check (
  auth.role() = 'authenticated'
  and auth.uid()::text = owner_id
);

create policy "Owners can update their own pins"
on public.pins for update
using (auth.uid()::text = owner_id)
with check (auth.uid()::text = owner_id);

create policy "Owners can delete their own pins"
on public.pins for delete
using (auth.uid()::text = owner_id);

-- ---------------------------------------------------------------------------
-- 4) PIN EVENTS + NOTIFICATIONS
-- ---------------------------------------------------------------------------

create table if not exists public.pin_events (
  id uuid primary key default gen_random_uuid(),
  pin_id text not null,
  type text not null,
  timestamp timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.pin_events enable row level security;

drop policy if exists "Anyone can read pin events" on public.pin_events;
drop policy if exists "Authenticated users can insert pin events" on public.pin_events;
drop policy if exists "Anyone can insert pin events" on public.pin_events;

create policy "Anyone can read pin events"
on public.pin_events for select
using (true);

create policy "Authenticated users can insert pin events"
on public.pin_events for insert
with check (
  auth.role() = 'authenticated'
  and pin_id is not null
  and type in ('view', 'click')
);

create policy "Anyone can insert anonymous analytics events"
on public.pin_events for insert
with check (
  auth.role() = 'anon'
  and pin_id is not null
  and type in ('view', 'click')
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null,
  payload jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
drop policy if exists "Authenticated users can create notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;

create policy "Users can read own notifications"
on public.notifications for select
using (auth.uid()::text = user_id);

create policy "Authenticated users can create notifications"
on public.notifications for insert
with check (
  auth.role() = 'authenticated'
  and auth.uid()::text = user_id
);

create policy "Users can update own notifications"
on public.notifications for update
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

-- ---------------------------------------------------------------------------
-- 5) DETAILED REPORTS
-- ---------------------------------------------------------------------------

alter table public.detailed_reports enable row level security;

drop policy if exists "Service role can read all detailed reports" on public.detailed_reports;
drop policy if exists "Authenticated users can create detailed reports" on public.detailed_reports;

create policy "Service role can read all detailed reports"
on public.detailed_reports for select
using (auth.role() = 'service_role');

create policy "Authenticated users can create detailed reports"
on public.detailed_reports for insert
with check (
  auth.role() = 'authenticated'
  and auth.uid()::text = user_id
);

-- ---------------------------------------------------------------------------
-- 5) CONVERSATIONS / MESSAGES
-- ---------------------------------------------------------------------------

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Participants can read conversations" on public.conversations;
drop policy if exists "Authenticated users can create conversations" on public.conversations;
drop policy if exists "Participants can update conversations" on public.conversations;
drop policy if exists "Participants can read messages in conversation" on public.messages;
drop policy if exists "Participants can create messages in conversation" on public.messages;

create policy "Participants can read conversations"
on public.conversations for select
using (auth.uid()::text = any(participants));

create policy "Authenticated users can create conversations"
on public.conversations for insert
with check (
  auth.role() = 'authenticated'
  and auth.uid()::text = any(participants)
  and array_length(participants, 1) >= 2
);

create policy "Participants can update conversations"
on public.conversations for update
using (auth.uid()::text = any(participants));

create policy "Participants can read messages in conversation"
on public.messages for select
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and auth.uid()::text = any(c.participants)
  )
);

create policy "Participants can create messages in conversation"
on public.messages for insert
with check (
  auth.role() = 'authenticated'
  and sender_id = auth.uid()::text
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and auth.uid()::text = any(c.participants)
  )
);

-- ---------------------------------------------------------------------------
-- 6) FAVORITES / PAYMENTS / REVIEWS
-- ---------------------------------------------------------------------------

alter table public.favorites enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "Owners can read their own favorites" on public.favorites;
drop policy if exists "Owners can insert their own favorites" on public.favorites;
drop policy if exists "Owners can delete their own favorites" on public.favorites;
drop policy if exists "Owners can read their own payments" on public.payments;
drop policy if exists "Owners can insert their own payments" on public.payments;
drop policy if exists "Owners can update their own payments" on public.payments;
drop policy if exists "Anyone can read reviews" on public.reviews;
drop policy if exists "Authenticated users can create reviews" on public.reviews;

create policy "Owners can read their own favorites"
on public.favorites for select
using (auth.uid()::text = user_id);

create policy "Owners can insert their own favorites"
on public.favorites for insert
with check (
  auth.role() = 'authenticated'
  and auth.uid()::text = user_id
);

create policy "Owners can delete their own favorites"
on public.favorites for delete
using (auth.uid()::text = user_id);

create policy "Owners can read their own payments"
on public.payments for select
using (auth.uid()::text = user_id);

create policy "Owners can insert their own payments"
on public.payments for insert
with check (
  auth.role() = 'authenticated'
  and auth.uid()::text = user_id
);

create policy "Owners can update their own payments"
on public.payments for update
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

create policy "Anyone can read reviews"
on public.reviews for select
using (true);

create policy "Authenticated users can create reviews"
on public.reviews for insert
with check (
  auth.role() = 'authenticated'
  and auth.uid()::text = user_id
);

-- ---------------------------------------------------------------------------
-- 7) STORAGE: restrict public reads to approved media only
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('mudmy', 'mudmy', true)
on conflict (id) do nothing;

drop policy if exists "Public read access for non-chat files" on storage.objects;
drop policy if exists "Public read access for approved media files" on storage.objects;
drop policy if exists "Authenticated read access for chats" on storage.objects;
drop policy if exists "Owners can upload pin images" on storage.objects;
drop policy if exists "Owners can upload profile avatars" on storage.objects;
drop policy if exists "Authenticated users can upload review images" on storage.objects;
drop policy if exists "Authenticated users can upload chat images" on storage.objects;
drop policy if exists "Owners can delete pin images" on storage.objects;
drop policy if exists "Owners can delete profile avatars" on storage.objects;
drop policy if exists "Owners can update pin images" on storage.objects;
drop policy if exists "Owners can update profile avatars" on storage.objects;

create policy "Public read access for approved media files"
on storage.objects for select
using (
  bucket_id = 'mudmy'
  and auth.role() in ('anon', 'authenticated')
  and (storage.foldername(name))[1] in ('pins', 'profiles', 'reviews')
  and (storage.foldername(name))[2] is not null
  and (storage.foldername(name))[1] <> 'chats'
);

create policy "Authenticated read access for chats"
on storage.objects for select
using (
  bucket_id = 'mudmy'
  and (storage.foldername(name))[1] = 'chats'
  and auth.role() = 'authenticated'
);

create policy "Owners can upload pin images"
on storage.objects for insert
with check (
  bucket_id = 'mudmy'
  and (storage.foldername(name))[1] = 'pins'
  and (storage.foldername(name))[2] = auth.uid()::text
  and auth.role() = 'authenticated'
);

create policy "Owners can upload profile avatars"
on storage.objects for insert
with check (
  bucket_id = 'mudmy'
  and (storage.foldername(name))[1] = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
  and auth.role() = 'authenticated'
);

create policy "Authenticated users can upload review images"
on storage.objects for insert
with check (
  bucket_id = 'mudmy'
  and (storage.foldername(name))[1] = 'reviews'
  and auth.role() = 'authenticated'
);

create policy "Authenticated users can upload chat images"
on storage.objects for insert
with check (
  bucket_id = 'mudmy'
  and (storage.foldername(name))[1] = 'chats'
  and auth.role() = 'authenticated'
);

create policy "Owners can delete pin images"
on storage.objects for delete
using (
  bucket_id = 'mudmy'
  and (storage.foldername(name))[1] = 'pins'
  and (storage.foldername(name))[2] = auth.uid()::text
  and auth.role() = 'authenticated'
);

create policy "Owners can delete profile avatars"
on storage.objects for delete
using (
  bucket_id = 'mudmy'
  and (storage.foldername(name))[1] = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
  and auth.role() = 'authenticated'
);

create policy "Owners can update pin images"
on storage.objects for update
using (
  bucket_id = 'mudmy'
  and (storage.foldername(name))[1] = 'pins'
  and (storage.foldername(name))[2] = auth.uid()::text
  and auth.role() = 'authenticated'
);

create policy "Owners can update profile avatars"
on storage.objects for update
using (
  bucket_id = 'mudmy'
  and (storage.foldername(name))[1] = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
  and auth.role() = 'authenticated'
);

-- ---------------------------------------------------------------------------
-- 8) SECURITY NOTE: do not expose service role to frontend
-- ---------------------------------------------------------------------------
-- Keep SUPABASE_SERVICE_ROLE_KEY only in server-side trusted environments.
-- Do not ship it in the browser, mobile app, or public build artifacts.

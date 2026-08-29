-- ============================================================================
-- Supabase Schema for Mudmy
-- ============================================================================

-- Enable pgcrypto extension for gen_random_uuid()
create extension if not exists pgcrypto;

-- 1. USERS TABLE
create table if not exists public.users (
  id text primary key,
  name text not null,
  nickname text,
  email text,
  avatar text,
  phone text,
  line text,
  facebook text,
  bio text,
  profile_visibility text not null default 'public',
  show_phone boolean not null default true,
  show_email boolean not null default true,
  show_location boolean not null default true,
  show_line boolean not null default false,
  show_facebook boolean not null default false,
  show_pins boolean not null default true,
  show_hero_history boolean not null default true,
  plan text not null default 'general',
  active_pins integer not null default 0,
  rating numeric not null default 0,
  review_count integer not null default 0,
  hero_cases_count integer not null default 0,
  hero_cases jsonb not null default '[]'::jsonb,
  province text,
  fcm_token text,
  created_at timestamp with time zone not null default now(),
  blocked_users text[] not null default '{}'::text[],
  blocked_by text[] not null default '{}'::text[],
  banned_until timestamp with time zone,
  is_permanently_banned boolean not null default false,
  ban_count integer not null default 0,
  ban_history jsonb not null default '[]'::jsonb,
  user_type text not null default 'personal',
  business_name text,
  business_tax_id text,
  business_address text,
  business_category text,
  business_phone text,
  has_used_free_pin boolean not null default false,
  free_pin_id text,
  theme_color text not null default 'orange',
  updated_at timestamp with time zone not null default now()
);

-- Existing projects: add theme_color if the table already exists
alter table public.users add column if not exists theme_color text not null default 'orange';
alter table public.users add column if not exists bio text;
alter table public.users add column if not exists profile_visibility text not null default 'public';
alter table public.users add column if not exists show_phone boolean not null default true;
alter table public.users add column if not exists show_email boolean not null default true;
alter table public.users add column if not exists show_location boolean not null default true;
alter table public.users add column if not exists show_line boolean not null default false;
alter table public.users add column if not exists show_facebook boolean not null default false;
alter table public.users add column if not exists show_pins boolean not null default true;
alter table public.users add column if not exists show_hero_history boolean not null default true;

-- RLS for Users
alter table public.users enable row level security;

drop policy if exists "Anyone can read user profiles" on public.users;

create policy "Users can read their own profile"
  on public.users for select
  using (auth.uid()::text = id);

create policy "Service role can read all users"
  on public.users for select
  using (auth.role() = 'service_role');

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid()::text = id);

create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid()::text = id);

-- 2. PINS TABLE
create table if not exists public.pins (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  category text not null,
  description text,
  images text[] not null default '{}'::text[],
  contact jsonb not null default '{}'::jsonb,
  price numeric,
  price_label text,
  lat numeric not null,
  lng numeric not null,
  address text,
  district text,
  province text,
  owner_id text references public.users(id) on delete cascade,
  owner_name text,
  owner_avatar text,
  status text not null default 'active',
  plan text not null default 'general',
  featured boolean not null default false,
  hero_id text,
  thank_you_message text,
  views integer not null default 0,
  clicks integer not null default 0,
  created_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone,
  rating numeric not null default 0,
  review_count integer not null default 0,
  favorite_count integer not null default 0,
  pin_number text,
  reports text[] not null default '{}'::text[],
  radius numeric,
  owner_type text not null default 'personal',
  is_free_pin boolean not null default false,
  last_checked_in_at timestamp with time zone,
  updated_at timestamp with time zone not null default now()
);

-- RLS for Pins
alter table public.pins enable row level security;

create policy "Anyone can read pins"
  on public.pins for select
  using (true);

create policy "Authenticated users can create pins"
  on public.pins for insert
  with check (
    auth.role() = 'authenticated'
    and auth.uid()::text = owner_id
  );

drop policy if exists "Authenticated users can update pins" on public.pins;
create policy "Owners can update their own pins"
  on public.pins for update
  using (auth.uid()::text = owner_id)
  with check (auth.uid()::text = owner_id);

create policy "Owners can delete their own pins"
  on public.pins for delete
  using (auth.uid()::text = owner_id);

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
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into target_pin from public.pins where id = p_pin_id for update;
  if not found then raise exception 'Pin not found'; end if;
  if target_pin.owner_id <> auth.uid()::text then raise exception 'Only the pin owner can resolve this pin'; end if;
  if target_pin.category <> 'emergency' then raise exception 'Only emergency pins can be resolved as hero cases'; end if;
  if target_pin.status = 'resolved' then raise exception 'This pin has already been resolved'; end if;
  if p_hero_id is null or p_hero_id = target_pin.owner_id then raise exception 'A different hero must be selected'; end if;
  select * into target_user from public.users where id = p_hero_id for update;
  if not found then raise exception 'Hero not found'; end if;
  if exists (select 1 from jsonb_array_elements(coalesce(target_user.hero_cases, '[]'::jsonb)) item where item->>'pinId' = target_pin.id) then
    raise exception 'This hero case has already been recorded';
  end if;
  hero_case := jsonb_build_object('pinId', target_pin.id, 'title', target_pin.title, 'description', coalesce(target_pin.description, ''), 'category', target_pin.category, 'helpedAt', now(), 'district', coalesce(target_pin.district, ''), 'province', coalesce(target_pin.province, ''), 'thankedBy', coalesce(target_pin.owner_name, ''), 'thankYouMessage', coalesce(p_thank_you_message, ''));
  update public.users set hero_cases_count = coalesce(target_user.hero_cases_count, 0) + 1, hero_cases = coalesce(target_user.hero_cases, '[]'::jsonb) || jsonb_build_array(hero_case), updated_at = now() where id = p_hero_id;
  update public.pins set status = 'resolved', hero_id = p_hero_id, thank_you_message = coalesce(p_thank_you_message, ''), updated_at = now() where id = target_pin.id;
end;
$$;

revoke all on function public.resolve_emergency_pin(text, text, text) from public;
grant execute on function public.resolve_emergency_pin(text, text, text) to authenticated;

-- 3. PIN EVENTS TABLE (Analytics)
create table if not exists public.pin_events (
  id uuid primary key default gen_random_uuid(),
  pin_id text references public.pins(id) on delete cascade not null,
  type text not null,
  timestamp timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now()
);

-- RLS for Pin Events
alter table public.pin_events enable row level security;

create policy "Anyone can read pin events"
  on public.pin_events for select
  using (true);

create policy "Anyone can insert pin events"
  on public.pin_events for insert
  with check (true);

-- 4. DETAILED REPORTS TABLE
create table if not exists public.detailed_reports (
  id uuid primary key default gen_random_uuid(),
  pin_id text references public.pins(id) on delete cascade not null,
  user_id text references public.users(id) on delete cascade not null,
  reason text not null,
  details text,
  created_at timestamp with time zone not null default now()
);

-- RLS for Detailed Reports
alter table public.detailed_reports enable row level security;

create policy "Only admin or system can read detailed reports"
  on public.detailed_reports for select
  using (false); -- Adjust as needed for admin panel

create policy "Authenticated users can create detailed reports"
  on public.detailed_reports for insert
  with check (
    auth.role() = 'authenticated'
    and auth.uid()::text = user_id
  );

-- 5. CONVERSATIONS TABLE
create table if not exists public.conversations (
  id text primary key,
  participants text[] not null,
  participant_names jsonb not null default '{}'::jsonb,
  participant_avatars jsonb not null default '{}'::jsonb,
  pin_id text references public.pins(id) on delete set null,
  pin_title text,
  last_message text,
  last_message_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unread_count jsonb not null default '{}'::jsonb
);

-- RLS for Conversations
alter table public.conversations enable row level security;

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

-- 6. MESSAGES TABLE
create table if not exists public.messages (
  id text primary key,
  conversation_id text references public.conversations(id) on delete cascade not null,
  sender_id text references public.users(id) on delete cascade not null,
  sender_name text not null,
  sender_avatar text,
  text text,
  image text,
  created_at timestamp with time zone not null default now()
);

-- RLS for Messages
alter table public.messages enable row level security;

create policy "Participants can read messages in conversation"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c 
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
      select 1 from public.conversations c 
      where c.id = conversation_id 
      and auth.uid()::text = any(c.participants)
    )
  );

-- 7. FAVORITES TABLE
create table if not exists public.favorites (
  id text primary key, -- "userId_pinId"
  user_id text references public.users(id) on delete cascade not null,
  pin_id text references public.pins(id) on delete cascade not null,
  created_at timestamp with time zone not null default now()
);

-- RLS for Favorites
alter table public.favorites enable row level security;

create policy "Owners can read their own favorites"
  on public.favorites for select
  using (auth.uid()::text = user_id);

create policy "Owners can insert their own favorites"
  on public.favorites for insert
  with check (auth.uid()::text = user_id);

create policy "Owners can delete their own favorites"
  on public.favorites for delete
  using (auth.uid()::text = user_id);

-- 8. PAYMENTS TABLE
create table if not exists public.payments (
  id text primary key,
  user_id text references public.users(id) on delete cascade not null,
  pin_id text references public.pins(id) on delete set null,
  amount numeric not null,
  status text not null,
  method text not null,
  promptpay_ref text,
  created_at timestamp with time zone not null default now(),
  paid_at timestamp with time zone,
  updated_at timestamp with time zone not null default now()
);

-- RLS for Payments
alter table public.payments enable row level security;

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
  using (auth.uid()::text = user_id);

-- 9. REVIEWS TABLE
create table if not exists public.reviews (
  id text primary key,
  pin_id text references public.pins(id) on delete cascade not null,
  user_id text references public.users(id) on delete cascade not null,
  user_name text not null,
  user_avatar text,
  rating numeric not null,
  comment text,
  images text[] not null default '{}'::text[],
  created_at timestamp with time zone not null default now()
);

-- RLS for Reviews
alter table public.reviews enable row level security;

create policy "Anyone can read reviews"
  on public.reviews for select
  using (true);

create policy "Authenticated users can create reviews"
  on public.reviews for insert
  with check (
    auth.role() = 'authenticated'
    and auth.uid()::text = user_id
  );

-- ============================================================================
-- AUTH PROFILE INTEGRATION TRIGGER
-- ============================================================================

-- Function to automatically create a user profile when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (
    id, name, nickname, email, avatar, plan, active_pins, rating, review_count, hero_cases_count, user_type,
    business_name, business_tax_id, business_phone
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'User'),
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'avatar_url',
    'general',
    0,
    0,
    0,
    0,
    coalesce(new.raw_user_meta_data->>'user_type', 'personal'),
    new.raw_user_meta_data->>'business_name',
    new.raw_user_meta_data->>'business_tax_id',
    new.raw_user_meta_data->>'business_phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- STORAGE CONFIGURATION & BUCKET POLICIES
-- ============================================================================

-- Create the public bucket 'mudmy' if it doesn't exist
insert into storage.buckets (id, name, public)
values ('mudmy', 'mudmy', true)
on conflict (id) do nothing;

-- storage.objects policies for 'mudmy' bucket

-- 1. Restricted public read policy for approved media folders only
create policy "Public read access for approved media files"
  on storage.objects for select
  using (
    bucket_id = 'mudmy'
    and auth.role() in ('anon', 'authenticated')
    and (storage.foldername(name))[1] in ('pins', 'profiles', 'reviews')
    and (storage.foldername(name))[2] is not null
    and (storage.foldername(name))[1] <> 'chats'
  );

-- 2. Authenticated read policy for chats
create policy "Authenticated read access for chats"
  on storage.objects for select
  using (bucket_id = 'mudmy' and (storage.foldername(name))[1] = 'chats' and auth.role() = 'authenticated');

-- 3. Write policy for pins folder: only owner can write to pins/{userId}/...
create policy "Owners can upload pin images"
  on storage.objects for insert
  with check (
    bucket_id = 'mudmy' 
    and (storage.foldername(name))[1] = 'pins' 
    and (storage.foldername(name))[2] = auth.uid()::text 
    and auth.role() = 'authenticated'
  );

-- 4. Write policy for profiles folder: only owner can write to profiles/{userId}/...
create policy "Owners can upload profile avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'mudmy' 
    and (storage.foldername(name))[1] = 'profiles' 
    and (storage.foldername(name))[2] = auth.uid()::text 
    and auth.role() = 'authenticated'
  );

-- 5. Write policy for reviews: any authenticated user can upload
create policy "Authenticated users can upload review images"
  on storage.objects for insert
  with check (
    bucket_id = 'mudmy' 
    and (storage.foldername(name))[1] = 'reviews' 
    and auth.role() = 'authenticated'
  );

-- 6. Write policy for chats: any authenticated user can upload
create policy "Authenticated users can upload chat images"
  on storage.objects for insert
  with check (
    bucket_id = 'mudmy' 
    and (storage.foldername(name))[1] = 'chats' 
    and auth.role() = 'authenticated'
  );

-- 7. Delete policy for pins folder: only owner can delete pins/{userId}/...
create policy "Owners can delete pin images"
  on storage.objects for delete
  using (
    bucket_id = 'mudmy' 
    and (storage.foldername(name))[1] = 'pins' 
    and (storage.foldername(name))[2] = auth.uid()::text 
    and auth.role() = 'authenticated'
  );

-- 8. Delete policy for profiles folder: only owner can delete profiles/{userId}/...
create policy "Owners can delete profile avatars"
  on storage.objects for delete
  using (
    bucket_id = 'mudmy' 
    and (storage.foldername(name))[1] = 'profiles' 
    and (storage.foldername(name))[2] = auth.uid()::text 
    and auth.role() = 'authenticated'
  );

-- 9. Update policy for pins folder (allows image replacement)
create policy "Owners can update pin images"
  on storage.objects for update
  using (
    bucket_id = 'mudmy' 
    and (storage.foldername(name))[1] = 'pins' 
    and (storage.foldername(name))[2] = auth.uid()::text 
    and auth.role() = 'authenticated'
  );

-- 10. Update policy for profiles folder (allows avatar replacement)
create policy "Owners can update profile avatars"
  on storage.objects for update
  using (
    bucket_id = 'mudmy' 
    and (storage.foldername(name))[1] = 'profiles' 
    and (storage.foldername(name))[2] = auth.uid()::text 
    and auth.role() = 'authenticated'
  );

-- ============================================================================
-- FIX: detailed_reports read policy — allow service_role (admin backend)
-- ============================================================================

drop policy if exists "Only admin or system can read detailed reports" on public.detailed_reports;

create policy "Service role can read all detailed reports"
  on public.detailed_reports for select
  using (auth.role() = 'service_role');

-- ============================================================================
-- ATOMIC INCREMENT RPC FUNCTIONS (no race conditions)
-- ============================================================================

-- Increment pin views atomically
create or replace function increment_pin_views(pin_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update pins set views = views + 1, updated_at = now() where id = pin_id;
$$;

-- Increment pin clicks atomically
create or replace function increment_pin_clicks(pin_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update pins set clicks = clicks + 1, updated_at = now() where id = pin_id;
$$;

-- Grant execute to anon and authenticated roles
grant execute on function increment_pin_views(text) to anon, authenticated;
grant execute on function increment_pin_clicks(text) to anon, authenticated;

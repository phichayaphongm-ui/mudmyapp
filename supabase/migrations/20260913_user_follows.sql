-- User-to-user following relationships.
create table if not exists public.user_follows (
  follower_id text not null references public.users(id) on delete cascade,
  following_id text not null references public.users(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  primary key (follower_id, following_id),
  constraint user_follows_no_self_follow check (follower_id <> following_id)
);

create index if not exists user_follows_following_id_idx
  on public.user_follows (following_id);

create index if not exists user_follows_follower_id_idx
  on public.user_follows (follower_id);

alter table public.user_follows enable row level security;

drop policy if exists "Users can read their own follows" on public.user_follows;
create policy "Users can read their own follows"
  on public.user_follows for select
  using (auth.uid()::text = follower_id or auth.uid()::text = following_id);

drop policy if exists "Users can follow from their own account" on public.user_follows;
create policy "Users can follow from their own account"
  on public.user_follows for insert
  with check (auth.role() = 'authenticated' and auth.uid()::text = follower_id);

drop policy if exists "Users can unfollow from their own account" on public.user_follows;
create policy "Users can unfollow from their own account"
  on public.user_follows for delete
  using (auth.role() = 'authenticated' and auth.uid()::text = follower_id);

create or replace function public.toggle_user_follow(p_target_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer_id text := auth.uid()::text;
  is_now_following boolean;
  target_followers bigint;
  viewer_following bigint;
begin
  if viewer_id is null then raise exception 'Authentication required'; end if;
  if p_target_id is null or p_target_id = viewer_id then raise exception 'You cannot follow yourself'; end if;
  if not exists (select 1 from public.users where id = p_target_id) then raise exception 'User not found'; end if;

  if exists (select 1 from public.user_follows where follower_id = viewer_id and following_id = p_target_id) then
    delete from public.user_follows where follower_id = viewer_id and following_id = p_target_id;
    is_now_following := false;
  else
    insert into public.user_follows (follower_id, following_id)
    values (viewer_id, p_target_id)
    on conflict (follower_id, following_id) do nothing;
    is_now_following := true;
  end if;

  select count(*) into target_followers from public.user_follows where following_id = p_target_id;
  select count(*) into viewer_following from public.user_follows where follower_id = viewer_id;

  return jsonb_build_object(
    'is_following', is_now_following,
    'follower_count', target_followers,
    'following_count', viewer_following
  );
end;
$$;

revoke all on function public.toggle_user_follow(text) from public;
grant execute on function public.toggle_user_follow(text) to authenticated;

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
      'show_location', u.show_location,
      'follower_count', (select count(*) from public.user_follows f where f.following_id = u.id),
      'following_count', (select count(*) from public.user_follows f where f.follower_id = u.id),
      'is_following', (auth.uid() is not null and exists (
        select 1 from public.user_follows f
        where f.follower_id = auth.uid()::text and f.following_id = u.id
      ))
    )
  end
  from public.users u
  where u.id = p_uid;
$$;

revoke all on function public.get_public_user_profile(text) from public;
grant execute on function public.get_public_user_profile(text) to anon, authenticated;

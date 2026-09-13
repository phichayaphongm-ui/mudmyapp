-- New public media bucket for pins, profiles, and reviews.
-- The legacy mudmy bucket is left untouched so existing public URLs keep working.
insert into storage.buckets (id, name, public)
values ('mudmy-public', 'mudmy-public', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read access for new media files" on storage.objects;
create policy "Public read access for new media files"
  on storage.objects for select
  using (
    bucket_id = 'mudmy-public'
    and auth.role() in ('anon', 'authenticated')
    and (storage.foldername(name))[1] in ('pins', 'profiles', 'reviews')
    and (storage.foldername(name))[2] is not null
  );

drop policy if exists "Owners can upload new pin images" on storage.objects;
create policy "Owners can upload new pin images"
  on storage.objects for insert
  with check (
    bucket_id = 'mudmy-public'
    and (storage.foldername(name))[1] = 'pins'
    and (storage.foldername(name))[2] = auth.uid()::text
    and auth.role() = 'authenticated'
  );

drop policy if exists "Owners can upload new profile avatars" on storage.objects;
create policy "Owners can upload new profile avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'mudmy-public'
    and (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = auth.uid()::text
    and auth.role() = 'authenticated'
  );

drop policy if exists "Authenticated users can upload new review images" on storage.objects;
create policy "Authenticated users can upload new review images"
  on storage.objects for insert
  with check (
    bucket_id = 'mudmy-public'
    and (storage.foldername(name))[1] = 'reviews'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Owners can delete new pin images" on storage.objects;
create policy "Owners can delete new pin images"
  on storage.objects for delete
  using (
    bucket_id = 'mudmy-public'
    and (storage.foldername(name))[1] = 'pins'
    and (storage.foldername(name))[2] = auth.uid()::text
    and auth.role() = 'authenticated'
  );

drop policy if exists "Owners can delete new profile avatars" on storage.objects;
create policy "Owners can delete new profile avatars"
  on storage.objects for delete
  using (
    bucket_id = 'mudmy-public'
    and (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = auth.uid()::text
    and auth.role() = 'authenticated'
  );

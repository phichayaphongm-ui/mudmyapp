-- Keep new chat images private. Existing public chat URLs in the legacy bucket
-- are not changed by this migration.
insert into storage.buckets (id, name, public)
values ('mudmy-chats', 'mudmy-chats', false)
on conflict (id) do update set public = false;

drop policy if exists "Chat participants can upload private images" on storage.objects;
create policy "Chat participants can upload private images"
  on storage.objects for insert
  with check (
    bucket_id = 'mudmy-chats'
    and auth.role() = 'authenticated'
    and exists (
      select 1
      from public.conversations c
      where c.id = (storage.foldername(name))[1]
        and auth.uid()::text = any(c.participants)
    )
  );

drop policy if exists "Chat participants can read private images" on storage.objects;
create policy "Chat participants can read private images"
  on storage.objects for select
  using (
    bucket_id = 'mudmy-chats'
    and auth.role() = 'authenticated'
    and exists (
      select 1
      from public.conversations c
      where c.id = (storage.foldername(name))[1]
        and auth.uid()::text = any(c.participants)
    )
  );

drop policy if exists "Chat participants can delete private images" on storage.objects;
create policy "Chat participants can delete private images"
  on storage.objects for delete
  using (
    bucket_id = 'mudmy-chats'
    and auth.role() = 'authenticated'
    and exists (
      select 1
      from public.conversations c
      where c.id = (storage.foldername(name))[1]
        and auth.uid()::text = any(c.participants)
    )
  );

-- Media support for announcements, forum posts, and user avatars.
-- Run after existing migrations (>= 052_*).

-- 1) Add image_url columns
alter table public.announcements
add column if not exists image_url text;

alter table public.forum_posts
add column if not exists image_url text;

-- 2) Update forum_posts_view to expose image_url
create or replace view public.forum_posts_view as
select
  p.id,
  p.channel_id,
  p.title,
  p.excerpt,
  p.tag,
  p.is_anonymous,
  p.image_url,
  p.created_at,
  case
    when p.is_anonymous then null
    else p.author_id
  end as display_author_id,
  case
    when p.is_anonymous then null
    else up.full_name
  end as author_name,
  (select coalesce(sum(v.vote_value), 0) from public.forum_votes v where v.post_id = p.id) as score,
  (select count(*) from public.forum_comments c where c.post_id = p.id) as comment_count
from public.forum_posts p
left join public.user_profiles up on p.author_id = up.id;

-- 3) Admin delete policy for forum posts (needed for admin-only delete UI)
-- Uses public.is_admin(uuid) created in 051_announcements_rls_policies.sql
drop policy if exists forum_posts_delete_admin on public.forum_posts;
create policy forum_posts_delete_admin
on public.forum_posts
for delete to authenticated
using (public.is_admin(auth.uid()));

-- 4) Storage buckets (public-read, controlled write by RLS policies below)
-- Buckets:
-- - announcement-images: admin uploads announcement images
-- - forum-post-images: authenticated users upload images for their own posts
-- - user-avatars: authenticated users upload their own avatar
insert into storage.buckets (id, name, public)
values
  ('announcement-images', 'announcement-images', true),
  ('forum-post-images', 'forum-post-images', true),
  ('user-avatars', 'user-avatars', true)
on conflict (id) do update set public = excluded.public;

-- 5) Storage RLS policies
-- NOTE: Supabase enables RLS on storage.objects by default.
-- Allow anyone to read public files from these buckets.
drop policy if exists "Public read announcement images" on storage.objects;
create policy "Public read announcement images"
on storage.objects for select
using (bucket_id = 'announcement-images');

drop policy if exists "Public read forum post images" on storage.objects;
create policy "Public read forum post images"
on storage.objects for select
using (bucket_id = 'forum-post-images');

drop policy if exists "Public read user avatars" on storage.objects;
create policy "Public read user avatars"
on storage.objects for select
using (bucket_id = 'user-avatars');

-- Admin-only uploads for announcement images
drop policy if exists "Admin upload announcement images" on storage.objects;
create policy "Admin upload announcement images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'announcement-images'
  and public.is_admin(auth.uid())
);

drop policy if exists "Admin update announcement images" on storage.objects;
create policy "Admin update announcement images"
on storage.objects for update to authenticated
using (
  bucket_id = 'announcement-images'
  and public.is_admin(auth.uid())
)
with check (
  bucket_id = 'announcement-images'
  and public.is_admin(auth.uid())
);

-- Forum uploads: user can insert/update/delete objects under their own folder prefix:
-- e.g. forum_posts/<auth.uid>/...
drop policy if exists "User upload forum post images" on storage.objects;
create policy "User upload forum post images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'forum-post-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "User update forum post images" on storage.objects;
create policy "User update forum post images"
on storage.objects for update to authenticated
using (
  bucket_id = 'forum-post-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'forum-post-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "User delete forum post images" on storage.objects;
create policy "User delete forum post images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'forum-post-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Avatar uploads: user can manage objects under their own folder prefix:
-- e.g. avatars/<auth.uid>/...
drop policy if exists "User upload avatars" on storage.objects;
create policy "User upload avatars"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'user-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "User update avatars" on storage.objects;
create policy "User update avatars"
on storage.objects for update to authenticated
using (
  bucket_id = 'user-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'user-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "User delete avatars" on storage.objects;
create policy "User delete avatars"
on storage.objects for delete to authenticated
using (
  bucket_id = 'user-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);


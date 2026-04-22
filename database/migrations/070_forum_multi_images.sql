-- Multi-image support for forum posts (up to 5 images per post).
-- Run after 062_media_support_images_and_profiles.sql.

-- 1) Add image_urls array column
alter table public.forum_posts
add column if not exists image_urls text[] default '{}';

-- 2) Backfill: copy any existing image_url into the new array
update public.forum_posts
set image_urls = array[image_url]
where image_url is not null
  and (image_urls is null or image_urls = '{}');

-- 3) Drop and recreate forum_posts_view to expose image_urls
--    (CREATE OR REPLACE cannot reorder columns, so we drop first)
drop view if exists public.forum_posts_view;

create view public.forum_posts_view as
select
  p.id,
  p.channel_id,
  p.title,
  p.excerpt,
  p.tag,
  p.is_anonymous,
  p.image_url,
  p.image_urls,
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

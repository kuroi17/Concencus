-- Forum reports (so "Report" actually persists).
-- Run after 062_media_support_images_and_profiles.sql

create table if not exists public.forum_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_forum_reports_post_created
  on public.forum_reports (post_id, created_at desc);

create index if not exists idx_forum_reports_reporter
  on public.forum_reports (reporter_id);

alter table public.forum_reports enable row level security;

drop policy if exists forum_reports_insert_authenticated on public.forum_reports;
create policy forum_reports_insert_authenticated
on public.forum_reports
for insert to authenticated
with check (reporter_id = auth.uid());

drop policy if exists forum_reports_select_admin on public.forum_reports;
create policy forum_reports_select_admin
on public.forum_reports
for select to authenticated
using (public.is_admin(auth.uid()));


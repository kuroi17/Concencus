-- Saved/bookmarked posts for users.
-- Each user can save any forum post for quick access from their profile.

create table if not exists public.saved_posts (
    user_id uuid not null references auth.users(id) on delete cascade,
    post_id uuid not null references public.forum_posts(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, post_id)
);

alter table public.saved_posts enable row level security;

-- Users can only read their own saved posts
drop policy if exists saved_posts_select on public.saved_posts;
create policy saved_posts_select on public.saved_posts
  for select to authenticated using (auth.uid() = user_id);

-- Users can only insert their own saved posts
drop policy if exists saved_posts_insert on public.saved_posts;
create policy saved_posts_insert on public.saved_posts
  for insert to authenticated with check (auth.uid() = user_id);

-- Users can only delete their own saved posts
drop policy if exists saved_posts_delete on public.saved_posts;
create policy saved_posts_delete on public.saved_posts
  for delete to authenticated using (auth.uid() = user_id);

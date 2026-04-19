create table if not exists public.user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (follower_id <> following_id),
  unique (follower_id, following_id)
);

create index if not exists idx_user_follows_follower on public.user_follows (follower_id);
create index if not exists idx_user_follows_following on public.user_follows (following_id);
create index if not exists idx_user_follows_created_at on public.user_follows (created_at desc);

alter table public.user_follows enable row level security;

drop policy if exists user_follows_select_authenticated on public.user_follows;
create policy user_follows_select_authenticated
on public.user_follows
for select
using (auth.role() = 'authenticated');

drop policy if exists user_follows_insert_self on public.user_follows;
create policy user_follows_insert_self
on public.user_follows
for insert
with check (follower_id = auth.uid());

drop policy if exists user_follows_delete_self on public.user_follows;
create policy user_follows_delete_self
on public.user_follows
for delete
using (follower_id = auth.uid());

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_follows'
  ) then
    alter publication supabase_realtime add table public.user_follows;
  end if;
end $$;

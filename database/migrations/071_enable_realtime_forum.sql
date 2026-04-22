-- Enable Supabase Realtime for forum tables.
-- Without this, the frontend postgres_changes subscriptions in ForumBoard
-- will never fire because the tables aren't in the publication.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'forum_posts'
  ) then
    alter publication supabase_realtime add table public.forum_posts;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'forum_votes'
  ) then
    alter publication supabase_realtime add table public.forum_votes;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'forum_comments'
  ) then
    alter publication supabase_realtime add table public.forum_comments;
  end if;
end $$;

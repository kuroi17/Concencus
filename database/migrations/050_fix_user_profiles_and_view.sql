-- 1. Create a trigger to automatically create a user profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.user_profiles (id, full_name, campus_role)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', 'Unknown User'), 
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Update the forum_posts_view to include the author's name
DROP VIEW IF EXISTS public.forum_posts_view;
CREATE VIEW public.forum_posts_view AS
SELECT 
    p.id,
    p.channel_id,
    p.title,
    p.excerpt,
    p.tag,
    p.is_anonymous,
    p.created_at,
    CASE 
        WHEN p.is_anonymous THEN NULL 
        ELSE p.author_id 
    END as display_author_id,
    CASE 
        WHEN p.is_anonymous THEN NULL 
        ELSE up.full_name 
    END as author_name,
    (SELECT COALESCE(SUM(v.vote_value), 0) FROM public.forum_votes v WHERE v.post_id = p.id) as score,
    (SELECT COUNT(*) FROM public.forum_comments c WHERE c.post_id = p.id) as comment_count
FROM public.forum_posts p
LEFT JOIN public.user_profiles up ON p.author_id = up.id;

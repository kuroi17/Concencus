create or replace function public.is_admin(user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles p
    where p.id = user_uuid
      and p.campus_role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated, anon;

alter table public.announcements enable row level security;

drop policy if exists announcements_select_all on public.announcements;
create policy announcements_select_all
on public.announcements
for select
using (true);

drop policy if exists announcements_insert_admin on public.announcements;
create policy announcements_insert_admin
on public.announcements
for insert to authenticated
with check (
  author_id = auth.uid()
  and public.is_admin(auth.uid())
);

drop policy if exists announcements_update_admin on public.announcements;
create policy announcements_update_admin
on public.announcements
for update to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists announcements_delete_admin on public.announcements;
create policy announcements_delete_admin
on public.announcements
for delete to authenticated
using (public.is_admin(auth.uid()));

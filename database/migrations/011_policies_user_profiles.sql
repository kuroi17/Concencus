drop policy if exists user_profiles_select_authenticated on public.user_profiles;
create policy user_profiles_select_authenticated
on public.user_profiles
for select
using (auth.role() = 'authenticated');

drop policy if exists user_profiles_insert_self on public.user_profiles;
create policy user_profiles_insert_self
on public.user_profiles
for insert
with check (id = auth.uid());

drop policy if exists user_profiles_update_self on public.user_profiles;
create policy user_profiles_update_self
on public.user_profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

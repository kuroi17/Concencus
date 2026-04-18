drop policy if exists dm_conversations_select_participants on public.dm_conversations;
create policy dm_conversations_select_participants
on public.dm_conversations
for select
using (public.is_dm_participant(id, auth.uid()));

drop policy if exists dm_conversations_insert_creator_participant on public.dm_conversations;
create policy dm_conversations_insert_creator_participant
on public.dm_conversations
for insert
with check (
  created_by = auth.uid()
  and (participant_one = auth.uid() or participant_two = auth.uid())
  and participant_one <> participant_two
);

drop policy if exists dm_conversations_update_participants on public.dm_conversations;
create policy dm_conversations_update_participants
on public.dm_conversations
for update
using (public.is_dm_participant(id, auth.uid()))
with check (public.is_dm_participant(id, auth.uid()));

drop policy if exists dm_messages_select_participants on public.dm_messages;
create policy dm_messages_select_participants
on public.dm_messages
for select
using (public.is_dm_participant(conversation_id, auth.uid()));

drop policy if exists dm_messages_insert_sender_member on public.dm_messages;
create policy dm_messages_insert_sender_member
on public.dm_messages
for insert
with check (
  sender_id = auth.uid()
  and public.is_dm_participant(conversation_id, auth.uid())
  and exists (
    select 1
    from public.dm_conversations c
    where c.id = conversation_id
      and (
        (c.participant_one = sender_id and c.participant_two = recipient_id)
        or (c.participant_two = sender_id and c.participant_one = recipient_id)
      )
  )
);

drop policy if exists dm_messages_update_sender_only on public.dm_messages;
create policy dm_messages_update_sender_only
on public.dm_messages
for update
using (sender_id = auth.uid() and public.is_dm_participant(conversation_id, auth.uid()))
with check (sender_id = auth.uid() and public.is_dm_participant(conversation_id, auth.uid()));

drop policy if exists dm_messages_delete_sender_only on public.dm_messages;
create policy dm_messages_delete_sender_only
on public.dm_messages
for delete
using (sender_id = auth.uid());

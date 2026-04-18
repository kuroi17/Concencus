drop policy if exists dm_read_receipts_select_participants on public.dm_read_receipts;
create policy dm_read_receipts_select_participants
on public.dm_read_receipts
for select
using (public.is_dm_participant(conversation_id, auth.uid()));

drop policy if exists dm_read_receipts_insert_self on public.dm_read_receipts;
create policy dm_read_receipts_insert_self
on public.dm_read_receipts
for insert
with check (
  user_id = auth.uid()
  and public.is_dm_participant(conversation_id, auth.uid())
);

drop policy if exists dm_read_receipts_update_self on public.dm_read_receipts;
create policy dm_read_receipts_update_self
on public.dm_read_receipts
for update
using (
  user_id = auth.uid()
  and public.is_dm_participant(conversation_id, auth.uid())
)
with check (
  user_id = auth.uid()
  and public.is_dm_participant(conversation_id, auth.uid())
);

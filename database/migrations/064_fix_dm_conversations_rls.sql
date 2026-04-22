-- Fix DM conversation RLS helper to avoid recursive/blocked selects.
-- Run after 010_enable_rls_and_helpers.sql and 012_policies_dm_conversations.sql

create or replace function public.is_dm_participant(conversation_uuid uuid, user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.dm_conversations c
    where c.id = conversation_uuid
      and (c.participant_one = user_uuid or c.participant_two = user_uuid)
  );
$$;

revoke all on function public.is_dm_participant(uuid, uuid) from public;
grant execute on function public.is_dm_participant(uuid, uuid) to authenticated;

-- Ensure authenticated users can select their conversations (explicit, avoids anon confusion)
drop policy if exists dm_conversations_select_participants on public.dm_conversations;
create policy dm_conversations_select_participants
on public.dm_conversations
for select to authenticated
using (public.is_dm_participant(id, auth.uid()));


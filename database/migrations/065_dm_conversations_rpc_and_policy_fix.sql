-- Fix DM conversation creation by moving UUID ordering into SQL (least/greatest),
-- and simplifying the select policy to avoid helper-function edge cases.
-- Run after 002_create_dm_conversations.sql and 010/012 policies.

-- 1) Make SELECT policy simple and robust
drop policy if exists dm_conversations_select_participants on public.dm_conversations;
create policy dm_conversations_select_participants
on public.dm_conversations
for select to authenticated
using (participant_one = auth.uid() or participant_two = auth.uid());

-- 2) Make INSERT policy require correct ordering + creator is participant
drop policy if exists dm_conversations_insert_creator_participant on public.dm_conversations;
create policy dm_conversations_insert_creator_participant
on public.dm_conversations
for insert to authenticated
with check (
  created_by = auth.uid()
  and (participant_one = auth.uid() or participant_two = auth.uid())
  and participant_one <> participant_two
  and participant_one < participant_two
);

-- 3) RPC: create or get a conversation with correct ordering.
create or replace function public.create_or_get_dm_conversation(p_target_user_id uuid)
returns public.dm_conversations
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_p1 uuid;
  v_p2 uuid;
  v_row public.dm_conversations;
begin
  if v_me is null then
    raise exception 'Not authenticated';
  end if;

  if p_target_user_id is null or p_target_user_id = v_me then
    raise exception 'Invalid target user';
  end if;

  v_p1 := least(v_me, p_target_user_id);
  v_p2 := greatest(v_me, p_target_user_id);

  insert into public.dm_conversations (participant_one, participant_two, created_by)
  values (v_p1, v_p2, v_me)
  on conflict (participant_one, participant_two) do nothing;

  select *
    into v_row
  from public.dm_conversations
  where participant_one = v_p1 and participant_two = v_p2
  limit 1;

  return v_row;
end;
$$;

revoke all on function public.create_or_get_dm_conversation(uuid) from public;
grant execute on function public.create_or_get_dm_conversation(uuid) to authenticated;


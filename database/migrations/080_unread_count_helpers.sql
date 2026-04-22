-- ──────────────────────────────────────────────────────────────────────────────
-- 080_unread_count_helpers.sql
-- Adds a Supabase RPC to compute unread message counts per conversation for a
-- given user. The dm_read_receipts INSERT/UPDATE policies already exist from
-- migration 014, so only the function is added here.
-- ──────────────────────────────────────────────────────────────────────────────

-- Returns one row per conversation that has unread messages for p_user_id.
-- "Unread" means: message was NOT sent by the user AND the message was created
-- after the user's last read_at timestamp (or they have no receipt at all).
create or replace function public.get_unread_counts(p_user_id uuid)
returns table(conversation_id uuid, unread_count bigint)
language sql
security definer
stable
as $$
  select
    c.id                   as conversation_id,
    count(m.id)::bigint    as unread_count
  from public.dm_conversations c
  join public.dm_messages m
    on  m.conversation_id = c.id
    and m.deleted_at      is null
    and m.sender_id       <> p_user_id
  left join public.dm_read_receipts r
    on  r.conversation_id = c.id
    and r.user_id         = p_user_id
  where
    (c.participant_one = p_user_id or c.participant_two = p_user_id)
    and (r.read_at is null or m.created_at > r.read_at)
  group by c.id;
$$;

-- Grant execute to authenticated users (anon cannot call it)
grant execute on function public.get_unread_counts(uuid) to authenticated;

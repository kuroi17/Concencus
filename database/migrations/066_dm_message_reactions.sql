-- Messenger-like reactions for DM messages.
-- Run after DM migrations (>= 003_create_dm_messages.sql, 010_enable_rls_and_helpers.sql, 013_policies_dm_messages.sql)

create extension if not exists pgcrypto;

create table if not exists public.dm_message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.dm_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 12),
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

create index if not exists idx_dm_message_reactions_message
  on public.dm_message_reactions (message_id);

alter table public.dm_message_reactions enable row level security;

drop policy if exists dm_message_reactions_select_participants on public.dm_message_reactions;
create policy dm_message_reactions_select_participants
on public.dm_message_reactions
for select to authenticated
using (
  exists (
    select 1
    from public.dm_messages m
    where m.id = message_id
      and public.is_dm_participant(m.conversation_id, auth.uid())
  )
);

drop policy if exists dm_message_reactions_insert_self on public.dm_message_reactions;
create policy dm_message_reactions_insert_self
on public.dm_message_reactions
for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.dm_messages m
    where m.id = message_id
      and public.is_dm_participant(m.conversation_id, auth.uid())
  )
);

drop policy if exists dm_message_reactions_update_self on public.dm_message_reactions;
create policy dm_message_reactions_update_self
on public.dm_message_reactions
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists dm_message_reactions_delete_self on public.dm_message_reactions;
create policy dm_message_reactions_delete_self
on public.dm_message_reactions
for delete to authenticated
using (user_id = auth.uid());


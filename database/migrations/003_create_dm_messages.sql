create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  client_message_id text,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  unique (sender_id, client_message_id)
);

create index if not exists idx_dm_messages_conversation on public.dm_messages (conversation_id, created_at desc);
create index if not exists idx_dm_messages_recipient on public.dm_messages (recipient_id, created_at desc);

create or replace function public.sync_dm_conversation_latest_message()
returns trigger
language plpgsql
as $$
begin
  update public.dm_conversations
  set latest_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_dm_messages_sync_latest on public.dm_messages;
create trigger trg_dm_messages_sync_latest
after insert on public.dm_messages
for each row
execute function public.sync_dm_conversation_latest_message();

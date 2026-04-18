create table if not exists public.dm_read_receipts (
  conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_message_id uuid references public.dm_messages(id) on delete set null,
  read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists idx_dm_read_receipts_user on public.dm_read_receipts (user_id, read_at desc);

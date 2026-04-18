create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.dm_conversations (
  id uuid primary key default gen_random_uuid(),
  participant_one uuid not null references auth.users(id) on delete cascade,
  participant_two uuid not null references auth.users(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  latest_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (participant_one <> participant_two),
  check (participant_one < participant_two),
  unique (participant_one, participant_two)
);

create index if not exists idx_dm_conversations_p1 on public.dm_conversations (participant_one);
create index if not exists idx_dm_conversations_p2 on public.dm_conversations (participant_two);
create index if not exists idx_dm_conversations_latest on public.dm_conversations (latest_message_at desc nulls last);

drop trigger if exists trg_dm_conversations_updated_at on public.dm_conversations;
create trigger trg_dm_conversations_updated_at
before update on public.dm_conversations
for each row
execute function public.set_row_updated_at();

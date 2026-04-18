create or replace function public.is_dm_participant(conversation_uuid uuid, user_uuid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.dm_conversations c
    where c.id = conversation_uuid
      and (c.participant_one = user_uuid or c.participant_two = user_uuid)
  );
$$;

alter table public.user_profiles enable row level security;
alter table public.dm_conversations enable row level security;
alter table public.dm_messages enable row level security;
alter table public.dm_read_receipts enable row level security;

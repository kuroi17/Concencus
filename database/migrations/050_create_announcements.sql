create extension if not exists pgcrypto;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  excerpt text not null check (char_length(trim(excerpt)) > 0),
  tag text not null default 'General',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  unit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_announcements_channel_created
  on public.announcements (channel_id, created_at desc);

create index if not exists idx_announcements_author
  on public.announcements (author_id);

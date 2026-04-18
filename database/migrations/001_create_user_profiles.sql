create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  campus_role text not null default 'student' check (campus_role in ('student', 'faculty', 'admin')),
  block text,
  sr_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_full_name on public.user_profiles (lower(full_name));
create index if not exists idx_user_profiles_role on public.user_profiles (campus_role);

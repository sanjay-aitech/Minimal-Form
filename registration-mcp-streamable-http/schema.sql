-- Run this in the Supabase SQL editor
create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  email text not null unique,
  dob date not null,
  created_at timestamptz not null default now()
);

-- Service-role key bypasses RLS, but enabling it blocks anon access by default
alter table registrations enable row level security;

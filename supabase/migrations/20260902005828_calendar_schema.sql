-- Google Calendar integration (read-only v1: freebusy only). Three
-- tables split by trust level.

-- Athlete-readable, service-role-writable only.
create table public.calendar_connection (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profile(id) on delete cascade,
  provider text not null check (provider in ('google')),
  status text not null default 'connected' check (status in ('connected', 'disconnected')),
  google_calendar_id text not null default 'primary',
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  unique (athlete_id, provider)
);

alter table public.calendar_connection enable row level security;

create policy "athletes can view their own calendar connections"
  on public.calendar_connection
  for select
  using (auth.uid() = athlete_id);

-- Short-lived, single-use correlation row for the OAuth callback.
-- Athletes may insert their own; only the service role reads/deletes.
create table public.calendar_connection_request (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profile(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.calendar_connection_request enable row level security;

create policy "athletes can create their own calendar connection request"
  on public.calendar_connection_request
  for insert
  with check (auth.uid() = athlete_id);

-- OAuth tokens. RLS enabled with zero policies on purpose: only the
-- service role can read or write.
create table public.calendar_oauth_token (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.calendar_connection(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  unique (connection_id)
);

alter table public.calendar_oauth_token enable row level security;

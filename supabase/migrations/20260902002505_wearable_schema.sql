-- Provider-independent wearable schema. Apple HealthKit is the only
-- provider with app code behind it as of this migration.

create table public.wearable_connection (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profile(id) on delete cascade,
  provider text not null check (provider in ('apple_health', 'garmin', 'coros', 'strava', 'zwift', 'google_health_connect')),
  status text not null default 'connected' check (status in ('connected', 'disconnected')),
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (athlete_id, provider)
);

alter table public.wearable_connection enable row level security;

create policy "athletes manage their own wearable connections"
  on public.wearable_connection
  for all
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

-- One row per athlete per calendar day per source; the unique
-- constraint makes a re-sync an idempotent upsert.
create table public.recovery_signal (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profile(id) on delete cascade,
  signal_date date not null,
  resting_hr_bpm integer,
  hrv_ms numeric,
  sleep_duration_min integer,
  source text not null default 'apple_health' check (source in ('apple_health', 'garmin', 'coros', 'manual')),
  created_at timestamptz not null default now(),
  unique (athlete_id, signal_date, source)
);

alter table public.recovery_signal enable row level security;

create policy "athletes manage their own recovery signals"
  on public.recovery_signal
  for all
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

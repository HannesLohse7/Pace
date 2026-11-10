-- Pace core schema (v1).

create extension if not exists "pgcrypto";

-- One row per authenticated user, 1:1 with auth.users.
create table athlete_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null,
  date_of_birth date,
  sex text check (sex in ('male', 'female', 'unspecified')),
  ftp_watts integer,
  threshold_pace_sec_per_km integer,
  css_pace_sec_per_100m integer,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table race (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athlete_profile(id) on delete cascade,
  name text not null,
  race_date date not null,
  distance text not null check (distance in ('sprint', 'olympic', '70.3', 'ironman', 'other')),
  location text,
  priority text not null default 'A' check (priority in ('A', 'B', 'C')),
  created_at timestamptz not null default now()
);

create table training_plan (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athlete_profile(id) on delete cascade,
  race_id uuid references race(id) on delete set null,
  start_date date not null,
  end_date date not null,
  weeks integer not null,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now()
);

create table training_phase (
  id uuid primary key default gen_random_uuid(),
  training_plan_id uuid not null references training_plan(id) on delete cascade,
  athlete_id uuid not null references athlete_profile(id) on delete cascade,
  name text not null check (name in ('Base', 'Build', 'Peak', 'Taper')),
  start_date date not null,
  end_date date not null,
  sequence integer not null
);

create table workout (
  id uuid primary key default gen_random_uuid(),
  training_plan_id uuid references training_plan(id) on delete cascade,
  athlete_id uuid not null references athlete_profile(id) on delete cascade,
  scheduled_date date not null,
  discipline text not null check (discipline in ('swim', 'bike', 'run', 'strength', 'rest')),
  title text not null,
  planned_duration_min integer,
  intensity text,
  planned_tss numeric,
  planned_calories integer,
  description text,
  equipment text[] not null default '{}',
  pace_target text,
  cadence_target text,
  status text not null default 'planned' check (status in ('planned', 'completed', 'missed')),
  sequence_in_day integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table workout_step (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workout(id) on delete cascade,
  athlete_id uuid not null references athlete_profile(id) on delete cascade,
  phase text not null check (phase in ('warmup', 'mainset', 'cooldown')),
  description text not null
);

create table workout_target_zone (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workout(id) on delete cascade,
  athlete_id uuid not null references athlete_profile(id) on delete cascade,
  target_type text not null check (target_type in ('hr', 'power')),
  zone text not null,
  zone_name text not null,
  range text not null,
  sequence integer not null default 0
);

create table workout_completion (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workout(id) on delete cascade,
  athlete_id uuid not null references athlete_profile(id) on delete cascade,
  completed_at timestamptz not null default now(),
  actual_duration_min integer,
  actual_tss numeric,
  actual_calories integer,
  perceived_effort integer check (perceived_effort between 1 and 10),
  notes text,
  source text not null default 'manual' check (source in ('manual', 'wearable_import')),
  created_at timestamptz not null default now()
);

create index workout_athlete_date_idx on workout (athlete_id, scheduled_date);
create index workout_completion_workout_idx on workout_completion (workout_id);

-- RLS: every table scoped to the owning athlete via auth.uid().
alter table athlete_profile enable row level security;
alter table race enable row level security;
alter table training_plan enable row level security;
alter table training_phase enable row level security;
alter table workout enable row level security;
alter table workout_step enable row level security;
alter table workout_target_zone enable row level security;
alter table workout_completion enable row level security;

create policy "athlete manages own profile" on athlete_profile
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "athlete manages own races" on race
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);

create policy "athlete manages own plans" on training_plan
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);

create policy "athlete manages own phases" on training_phase
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);

create policy "athlete manages own workouts" on workout
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);

create policy "athlete manages own workout steps" on workout_step
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);

create policy "athlete manages own target zones" on workout_target_zone
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);

create policy "athlete manages own completions" on workout_completion
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);

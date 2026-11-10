-- engine_version: names which version of the adaptation engine made a
-- given adaptation_event's decision. Readable by every athlete, written
-- only by migrations or service-role code.
create table engine_version (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  description text not null,
  released_at timestamptz not null default now()
);

alter table engine_version enable row level security;

create policy "authenticated can read engine versions"
  on engine_version for select
  to authenticated
  using (true);

-- adaptation_event: append-only audit trail of every change to an
-- athlete's plan or workouts, by the engine or by manual override.
create table adaptation_event (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athlete_profile(id) on delete cascade,
  training_plan_id uuid references training_plan(id) on delete cascade,
  workout_id uuid references workout(id) on delete cascade,
  -- Null for manual overrides; set only when the engine made the change.
  engine_version_id uuid references engine_version(id) on delete set null,
  trigger_type text not null check (
    trigger_type in (
      'missed_workout',
      'calendar_conflict',
      'extra_time',
      'poor_recovery',
      'illness',
      'travel',
      'race_date_change',
      'manual_move',
      'other'
    )
  ),
  summary text not null,
  reasoning text,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create index adaptation_event_athlete_created_idx
  on adaptation_event (athlete_id, created_at desc);
create index adaptation_event_workout_idx
  on adaptation_event (workout_id)
  where workout_id is not null;

alter table adaptation_event enable row level security;

-- Insert + select only, deliberately: no update/delete policy means
-- every row is append-only once written.
create policy "athletes create their own adaptation events"
  on adaptation_event for insert
  to authenticated
  with check (auth.uid() = athlete_id);

create policy "athletes read their own adaptation events"
  on adaptation_event for select
  to authenticated
  using (auth.uid() = athlete_id);

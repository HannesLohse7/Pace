# Database

## Core data objects

Research-recommended minimum production-grade objects:

- `athlete_profile`
- `race`
- `training_plan`
- `training_phase`
- `workout`
- `workout_step`
- `calendar_connection`
- `calendar_event_snapshot`
- `availability_rule`
- `wearable_connection`
- `activity_import`
- `recovery_signal`
- `workout_completion`
- `adaptation_event`
- `engine_version`

**`adaptation_event` is essential, not optional** — it's the audit trail of what changed, why, and which engine version made the decision. Directly required by the AI rule that the system must always explain its reasoning, and by the legal need to justify any automated change to a user's plan.

`adaptation_event` and `engine_version` are built (`adaptation_audit_schema` migration, 2026-09-01) — see below. `wearable_connection` and `recovery_signal` are built too (`wearable_schema` migration, 2026-09-02), and so is `calendar_connection` (`calendar_schema` migration, 2026-09-02, plus two tables not on this original list at all — see below for why). `calendar_event_snapshot`, `availability_rule`, `activity_import` are still deferred; none of those features exist yet, so there's nothing real to back.

### `adaptation_event`

One row per change to an athlete's plan or workouts — whether computed by the adaptation engine or entered directly as a manual override ("I'm sick," "move this workout," etc.). `athlete_id`, optional `training_plan_id`/`workout_id` (whichever the change actually touched), optional `engine_version_id` (**null for manual overrides** — an athlete-initiated change isn't a decision any engine version made, so there's nothing honest to attribute it to), a `trigger_type` (`missed_workout` / `calendar_conflict` / `extra_time` / `poor_recovery` / `illness` / `travel` / `race_date_change` / `manual_move` / `other`), a `summary` (short, athlete-facing), optional `reasoning` (longer explanation), optional `before_state`/`after_state` (jsonb snapshots of whatever was affected).

**Real writers as of 2026-09-01** (`lib/adaptation/logAdaptationEvent.ts` is the one insert path every one of these goes through): `features/overrides/services/reportOverride.ts` (the 4 general "what's going on" reports — `illness`/`travel`/`poor_recovery`/`extra_time`), `features/training/hooks/useReorderWorkout.ts` (`manual_move` — both Training's drag-reorder and Workout Detail's explicit "Move this workout" action, which share this one mutation), and `lib/adaptation/engine/adaptAfterMissedWorkout.ts` (`missed_workout` — the v1 adaptation engine's own trim of a later workout, see below). `engine_version_id` is null on every manual-caller row, and real (`v1`'s id) on every engine-caller row — the first writer this schema has ever seen actually set it.

**Real readers as of 2026-09-01**: `features/training/services/fetchWorkoutHistory.ts` — Workout Detail's HISTORY section, one workout's own events (`eq('workout_id', ...)`), newest first. `features/coach/services/fetchRecentAdaptationEvents.ts` — Coach's opening transcript, the athlete's events across every workout (`eq('athlete_id', ...)`), newest first, capped at 15. Both read `id`/`summary`/`reasoning`/`created_at`; `trigger_type` needs no display mapping since `summary` is already the athlete-facing sentence. `reasoning` renders in both (shown only when present) — the engine is the first writer to ever set it to something real (a longer explanation of its own trim), manual callers still leave it `null`, so their history rows render as a single line.

RLS is deliberately **insert + select only** — not the `for all` pattern the rest of this schema uses. This is an audit trail, not a live-editable record; letting an athlete update or delete their own adaptation history would defeat the reason the table exists. No update/delete policy means RLS blocks both outright, so every row is append-only once written.

### `engine_version`

Reference table naming which version of the adaptation engine's rule set made a given `adaptation_event`'s decision — `version` (unique), `description`, `released_at`. Not athlete-owned: every authenticated athlete can read it (it's referenced by their own `adaptation_event` rows), but only migrations or the engine's own service-role code can write it. Has its first real row as of 2026-09-01 — `v1`, inserted directly via a data migration (`seed_engine_version_v1`, applied through the Supabase MCP tools, not the app) rather than the app itself, since the table can't be written from app code by design. `lib/adaptation/engine/getEngineVersionId.ts` looks it up by `version` at runtime rather than hardcoding its id.

### `training_phase` — new real reader (added 2026-09-01)

Already written by `lib/planGenerator/generatePlan.ts` (`name` is CHECK-constrained to exactly `'Base'` / `'Build'` / `'Peak'` / `'Taper'` — confirmed against the live constraint, not just the generator's own `PhaseName` type). `lib/adaptation/guardrails/checkTaperLoadGuardrail.ts` is a new reader: given a calendar date, checks whether it falls within an athlete's `Taper` phase (`start_date`/`end_date` bounds) to decide whether a load-increasing reschedule should be blocked. No schema change — just a new consumer of data that was already real.

### `wearable_connection` and `recovery_signal` (added 2026-09-02)

`wearable_connection`: one row per athlete/provider (`unique(athlete_id, provider)`), `provider` CHECK-constrained to `'apple_health' | 'garmin' | 'coros' | 'strava' | 'zwift' | 'google_health_connect'`, `status` (`'connected' | 'disconnected'`, default `'connected'`), `connected_at`, `last_synced_at`. `recovery_signal`: one row per athlete/day/source (`unique(athlete_id, signal_date, source)`), `resting_hr_bpm` (integer), `hrv_ms` (numeric), `sleep_duration_min` (integer, nullable — column exists for a future sleep-analysis reader, unpopulated by any writer today), `source` CHECK-constrained to a narrower `'apple_health' | 'garmin' | 'coros' | 'manual'` (only providers that actually supply recovery biometrics — Strava/Zwift are pure activity sources and don't belong here). Both follow the standard `for all using/with check (auth.uid() = athlete_id)` RLS pattern. As with every other CHECK constraint in this schema, these values aren't reflected in Supabase's generated TypeScript types (`provider`/`status`/`source` come back as plain `string`) — `lib/wearables/types.ts` re-declares them as real union types for app code to use instead.

**Real writer as of 2026-09-02**: `lib/wearables/syncAppleHealthRecoverySignals.ts`, called from onboarding's Wearables step (`useConnectAppleHealth` hook) — the only real path today, and it only ever writes `provider`/`source = 'apple_health'`. The Garmin/COROS/Strava/Zwift/Google Health Connect CHECK values exist for a provider-independent shape (per API.md's note that this matters strategically ahead of Garmin/COROS API approval) but have no writer yet. No reader anywhere yet — nothing in the app displays `wearable_connection`/`recovery_signal` data today; onboarding's own toggle state (whether the Wearables step shows "Connected") comes from a successful sync call succeeding, not from reading these tables back.

### `calendar_connection`, `calendar_connection_request`, `calendar_oauth_token` (added 2026-09-02)

Google Calendar's connect flow, split into three tables by trust level — the first OAuth-token-bearing integration this schema has, which needed a much tighter RLS posture than the athlete-owned default used everywhere else. Full architecture reasoning (why an Edge Function has to be in the loop at all) is in docs/ROADMAP.md; this section is just the shape.

`calendar_connection`: one row per athlete/provider (`unique(athlete_id, provider)`), `provider` CHECK-constrained to `'google'` only today, `status` (`'connected' | 'disconnected'`), `google_calendar_id` (default `'primary'`), `connected_at`, `last_synced_at`. Athlete-**readable** (`for select using (auth.uid() = athlete_id)`) but deliberately **not** athlete-writable — no insert/update/delete policy for `authenticated` at all, since a client shouldn't be able to fabricate its own "connected" status without a real OAuth exchange completing. Only the service role (the Edge Functions below) ever writes it.

`calendar_connection_request`: a short-lived, single-use correlation row — `athlete_id`, `created_at`, nothing else. Athletes can `insert` their own row (`with check (auth.uid() = athlete_id)`) but have no select/update/delete policy on it at all; the row's id becomes Google's `state` parameter, and `google-calendar-oauth-callback` is the only thing that ever reads or deletes it (it does both, immediately, single-use). This exists because Google's redirect back is an unauthenticated third-party request — it can't carry a Supabase JWT, so this is how the callback recovers which athlete an exchange belongs to without trusting a client-supplied id outright.

`calendar_oauth_token`: `connection_id` (unique, FK to `calendar_connection`), `access_token`, `refresh_token`, `expires_at`, `updated_at`. RLS is enabled but has **zero policies at all** — not even for the token's own athlete. This is stricter than every other table in this schema on purpose: unlike `wearable_connection` (which stores no secrets, since HealthKit's auth lives entirely on-device), a leaked refresh token here is a real, usable credential against the athlete's actual Google account outside of Pace entirely. Only Edge Functions running with the service role key ever touch this table. `get_advisors` flags this as an `rls_enabled_no_policy` INFO-level lint — expected and accepted, not a gap to fix; it's exactly the design.

**Real writers/callers as of 2026-09-02**: `supabase/functions/google-calendar-oauth-callback` (public endpoint, `verify_jwt` disabled — writes `calendar_connection` + `calendar_oauth_token` on a successful token exchange), `supabase/functions/google-calendar-freebusy` (authenticated; the one real read capability — checks busy/free blocks for a time window, refreshing the stored access token first if it's expired), `supabase/functions/google-calendar-disconnect` (authenticated; revokes the token with Google for real, then deletes the `calendar_oauth_token` row and flips `calendar_connection.status` to `'disconnected'`). `features/calendar/services/calendarConnectionRequest.ts` is the one client-side writer of `calendar_connection_request`. No UI reads `google-calendar-freebusy`'s output yet — see docs/ROADMAP.md.

## RLS & security

Established pattern for athlete-owned tables: `for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id)` (or `= id` for `athlete_profile`). `adaptation_event` deviates deliberately (insert+select only — see above). `engine_version` is read-only to authenticated users, write-only via service role.

**`adaptation_event` tamper-evidence — answered (2026-09-02), recommendation not yet applied.** The real threat RLS already closes: an authenticated athlete rewriting or deleting their own history through the app's normal API surface (no update/delete policy exists, so PostgREST refuses both, full stop). What RLS *can't* close, by construction, is the service role and the project's Postgres owner — both bypass RLS entirely, so "does this need protection beyond RLS" really means "against those two." True tamper-evidence against a compromised service-role key or a malicious superuser (hash-chained rows, an external write-once log) is real engineering, and disproportionate for an MVP with no regulatory audit requirement yet — this is postponed for the same reason CTL/ATL/TSB dashboards and the coach marketplace are (see ROADMAP.md's "Explicitly postponed"), not because the question doesn't matter.

The one thing that *is* proportionate now: a database-level trigger that unconditionally rejects `UPDATE`/`DELETE` on `adaptation_event`, as defense-in-depth against an *accidental* regression rather than a hostile one — this table is the one place in the schema that deliberately deviates from the athlete-owned `for all` default (see above), which makes it exactly the table a future contributor could accidentally "fix" back to the default pattern by copy-pasting it, not noticing the deviation was the point. RLS alone doesn't protect against that; a trigger that fires regardless of which policy is active would. Recommended, not yet applied (a schema change to the live project, so it's queued for the user to approve rather than pushed unilaterally):

```sql
create or replace function reject_adaptation_event_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'adaptation_event is append-only; % is not permitted', tg_op;
end;
$$;

create trigger adaptation_event_append_only
  before update or delete on adaptation_event
  for each row execute function reject_adaptation_event_mutation();
```

## Migrations

**Filled in (2026-09-02)** — documenting the convention every migration applied so far already follows, not introducing a new one:

- **Naming**: Supabase's own default shape, `<timestamp>_<snake_case_description>.sql` (`20260901181603_adaptation_audit_schema`, etc. — see the live list via `list_migrations`), applied through the Supabase MCP tools rather than a local Supabase CLI. Within that, three description patterns have emerged in practice: `<domain>_schema` for a migration that creates a related group of tables (`core_schema`, `adaptation_audit_schema`, `wearable_schema`, `calendar_schema`), `seed_<table>_<value>` for a data-only insert into a reference table (`seed_engine_version_v1`), and `create_<object>` for a single new object that isn't a table (`create_waitlist_signups_by_day_view`). A new migration should fit one of these three, or make the case for a fourth explicitly rather than inventing an ad hoc name.
- **Rollback plan**: there is no down-migration mechanism in this workflow — `apply_migration` (the tool every migration above went through) applies forward-only SQL with no paired `.down.sql`, and nothing here uses the Supabase CLI's local migration files where a hand-written down-migration would even have somewhere to live. The real rollback plan is therefore **write a new forward migration that reverses the change** (drop the column/table just added, restore the previous constraint, etc.) rather than "undo" the original one — which also means every migration should be written so a reversal is actually possible: prefer additive changes (a new nullable column, a new table) over destructive ones (dropping/renaming a column still read by shipped app code) wherever the schema change allows it, since an additive migration's reversal is a clean drop, while a destructive one's reversal may have already lost data a rollback can't reconstruct. Nothing in this project's history so far has needed a real rollback — this is the plan for when one does.

## Related

- [ARCHITECTURE.md](ARCHITECTURE.md) — how these objects fit the overall system
- [API.md](API.md) — external data sources that feed `activity_import` / `recovery_signal` / `calendar_event_snapshot`

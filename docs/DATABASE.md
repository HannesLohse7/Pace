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

`adaptation_event` and `engine_version` are built (`adaptation_audit_schema` migration, 2026-09-01) — see below. `calendar_connection`, `calendar_event_snapshot`, `availability_rule`, `wearable_connection`, `activity_import`, `recovery_signal` are still deferred; none of those features exist yet, so there's nothing real to back.

### `adaptation_event`

One row per change to an athlete's plan or workouts — whether computed by the adaptation engine or entered directly as a manual override ("I'm sick," "move this workout," etc.). `athlete_id`, optional `training_plan_id`/`workout_id` (whichever the change actually touched), optional `engine_version_id` (**null for manual overrides** — an athlete-initiated change isn't a decision any engine version made, so there's nothing honest to attribute it to), a `trigger_type` (`missed_workout` / `calendar_conflict` / `extra_time` / `poor_recovery` / `illness` / `travel` / `race_date_change` / `manual_move` / `other`), a `summary` (short, athlete-facing), optional `reasoning` (longer explanation), optional `before_state`/`after_state` (jsonb snapshots of whatever was affected).

**Real writers as of 2026-09-01** (`lib/adaptation/logAdaptationEvent.ts` is the one insert path every one of these goes through): `features/overrides/services/reportOverride.ts` (the 4 general "what's going on" reports — `illness`/`travel`/`poor_recovery`/`extra_time`), `features/training/hooks/useReorderWorkout.ts` (`manual_move` — both Training's drag-reorder and Workout Detail's explicit "Move this workout" action, which share this one mutation), and `lib/adaptation/engine/adaptAfterMissedWorkout.ts` (`missed_workout` — the v1 adaptation engine's own trim of a later workout, see below). `engine_version_id` is null on every manual-caller row, and real (`v1`'s id) on every engine-caller row — the first writer this schema has ever seen actually set it.

**Real readers as of 2026-09-01**: `features/training/services/fetchWorkoutHistory.ts` — Workout Detail's HISTORY section, one workout's own events (`eq('workout_id', ...)`), newest first. `features/coach/services/fetchRecentAdaptationEvents.ts` — Coach's opening transcript, the athlete's events across every workout (`eq('athlete_id', ...)`), newest first, capped at 15. Both read `id`/`summary`/`reasoning`/`created_at`; `trigger_type` needs no display mapping since `summary` is already the athlete-facing sentence. `reasoning` renders in both (shown only when present) — the engine is the first writer to ever set it to something real (a longer explanation of its own trim), manual callers still leave it `null`, so their history rows render as a single line.

RLS is deliberately **insert + select only** — not the `for all` pattern the rest of this schema uses. This is an audit trail, not a live-editable record; letting an athlete update or delete their own adaptation history would defeat the reason the table exists. No update/delete policy means RLS blocks both outright, so every row is append-only once written.

### `engine_version`

Reference table naming which version of the adaptation engine's rule set made a given `adaptation_event`'s decision — `version` (unique), `description`, `released_at`. Not athlete-owned: every authenticated athlete can read it (it's referenced by their own `adaptation_event` rows), but only migrations or the engine's own service-role code can write it. Has its first real row as of 2026-09-01 — `v1`, inserted directly via a data migration (`seed_engine_version_v1`, applied through the Supabase MCP tools, not the app) rather than the app itself, since the table can't be written from app code by design. `lib/adaptation/engine/getEngineVersionId.ts` looks it up by `version` at runtime rather than hardcoding its id.

### `training_phase` — new real reader (added 2026-09-01)

Already written by `lib/planGenerator/generatePlan.ts` (`name` is CHECK-constrained to exactly `'Base'` / `'Build'` / `'Peak'` / `'Taper'` — confirmed against the live constraint, not just the generator's own `PhaseName` type). `lib/adaptation/guardrails/checkTaperLoadGuardrail.ts` is a new reader: given a calendar date, checks whether it falls within an athlete's `Taper` phase (`start_date`/`end_date` bounds) to decide whether a load-increasing reschedule should be blocked. No schema change — just a new consumer of data that was already real.

## RLS & security

Established pattern for athlete-owned tables: `for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id)` (or `= id` for `athlete_profile`). `adaptation_event` deviates deliberately (insert+select only — see above). `engine_version` is read-only to authenticated users, write-only via service role. 🟡 **TODO:** broader audit considerations (e.g. whether `adaptation_event` needs tamper-evidence beyond RLS) not yet designed.

## Migrations

🟡 **TODO:** Naming conventions and rollback plan not yet decided.

## Related

- [ARCHITECTURE.md](ARCHITECTURE.md) — how these objects fit the overall system
- [API.md](API.md) — external data sources that feed `activity_import` / `recovery_signal` / `calendar_event_snapshot`

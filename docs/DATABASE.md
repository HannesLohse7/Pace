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

## RLS & security

🟡 **TODO:** Policy strategy and audit considerations not yet designed.

## Migrations

🟡 **TODO:** Naming conventions and rollback plan not yet decided.

## Related

- [ARCHITECTURE.md](ARCHITECTURE.md) — how these objects fit the overall system
- [API.md](API.md) — external data sources that feed `activity_import` / `recovery_signal` / `calendar_event_snapshot`

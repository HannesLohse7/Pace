# Migrations

These eight files are the migration history of the live Supabase project
(`nttuahswduqupiykguhk`), copied out of `supabase_migrations.schema_migrations`
on 2026-11-10. File names use the live versions, so the Supabase CLI treats
them as already applied.

Every SQL statement is as applied. The long explanatory comments were
shortened; the full reasoning is in `docs/DATABASE.md`.

Correction to `docs/DATABASE.md`: `workout_completion` was created by
`core_schema`, not by hand. The later `workout_completion_unique_workout`
migration only added the unique constraint.

New migrations go here first, then get applied to the project.

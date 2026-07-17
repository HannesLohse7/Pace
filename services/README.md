# services

The intended data-access seam between UI components and data sources — mock data today, Supabase later — so swapping one for the other means changing this layer, not every screen that consumes it.

Nothing lives here yet: Milestone 1 features import mock data directly (e.g. `features/home/data/mockHomeData.ts`), which is fine at the current scale. This folder should be populated before Supabase integration lands, not after, so screens are never rewritten to "add" the seam retroactively.

Empty as of Milestone 1; scaffolded per `docs/ARCHITECTURE.md`.

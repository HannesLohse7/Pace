# Architecture

## High-level architecture

Confirmed (research-validated): React Native + Expo + TypeScript + Supabase + NativeWind is appropriate for a solo founder — minimizes platform duplication, gives managed build/deploy tooling (EAS), and keeps iteration speed high.

- Mobile app (React Native / Expo / Expo Router)
- Supabase (Postgres + Auth + Edge Functions + Realtime)
- Adaptive engine: **deterministic, versioned, unit-testable rules** running as a Supabase Edge Function — not freeform AI generation. AI is used only to explain decisions in plain language.
- Integrations: Calendar (Google Calendar primary, Apple EventKit local), Wearables (Apple HealthKit first, then Strava, Garmin, COROS, Health Connect) — see [API.md](API.md)

## Key flows

- **Authentication** — Supabase Auth, email/password + Sign in with Apple first (Google later)
- **Calendar sync** — Google Calendar free/busy + write-back, Apple EventKit local; **never overwrite existing user events**
- **Training plan generation** — deterministic rules from race date, distance, availability, recovery
- **Plan adaptation loop** — rules-based guardrails: no unsafe load spikes, no stacking missed workouts, no taper disruption, no hidden changes; every change logged to an `adaptation_event` audit trail (see [DATABASE.md](DATABASE.md))

## Folder structure (feature-first)

```
app/
features/
  training/
  calendar/
  workouts/
  onboarding/
  progress/
shared/
  components/
  hooks/
  types/
  utils/
services/
lib/
  supabase/
server/
  functions/
```

Matches [PROJECT_RULES.md](PROJECT_RULES.md) (components/hooks/services/types/screens/utils separation; business logic out of UI).

## State management & data fetching

- Zustand for local UI/session state
- TanStack Query for server state (plan/calendar/workout caching + sync)
- Offline: MVP is read-only offline for today/this week + queued completion events; conflict-aware offline editing is a v2 concern

## Observability

- PostHog — activation, retention, funnels, feature flags
- Sentry — crash/error monitoring, release tracking
- Full KPI list and North Star metric are tracked in the team's Notion workspace (Metrics Dashboard)

## Source

Findings from `Pace MVP Research Report.md` (ingested 2026-07-16).

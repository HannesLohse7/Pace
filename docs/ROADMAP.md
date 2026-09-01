# Roadmap

## Status (as of 2026-09-01)

All 5 of the original MVP milestone screens are now built, running entirely on local mock data with no backend: Home Dashboard, Training Calendar (with hand-built drag-to-reorder), Workout Detail, AI Coach (scripted replies, no real LLM), and Progress. Onboarding (9 steps) and Profile are built too.

This gives two items below a real, navigable *screen* — #5 Daily workout page and #6 Progress tracking — but not their underlying substance: there's no adaptation audit trail behind Workout Detail's "why this changed," and no real computed fitness/consistency data behind Progress. None of #1–4 or #7–10 (the adaptive engine, calendar/wearable integrations, audit trail, safety guardrails) have been started. Everything in **Now** below still describes real, unstarted work, not something already underway — this status note doesn't change the priority order, it just makes clear what "built" actually means so far.

### Backend (added 2026-09-01)

A live Supabase project now backs this app (see [DATABASE.md](DATABASE.md) for the schema as actually built, vs. the target list there). What's real:

- `core_schema` migration: `athlete_profile`, `race`, `training_plan`, `training_phase`, `workout`, `workout_step`, `workout_target_zone`, `workout_completion` — all RLS-scoped to `auth.uid()`.
- `adaptation_audit_schema` migration (added 2026-09-01): `adaptation_event` + `engine_version` — the audit trail behind Workout Detail's future "why this changed" and Progress's future trend data. See [DATABASE.md](DATABASE.md) for the shape and the RLS reasoning (append-only by design, not the schema's usual `for all` pattern). Nothing writes to these tables yet — that starts with #8 (manual overrides) and #11 (the engine itself).
- `calendar_connection`, `wearable_connection`, `activity_import`, `recovery_signal` are still deferred — none of those features exist yet, so there's nothing real to back.
- `lib/supabase/client.ts` — a real client, session persisted via AsyncStorage.
- Onboarding's Account step now calls real Supabase Auth (`signUp`) and, when a session comes back immediately, inserts a real `athlete_profile` row (and a `race` row if a goal/race was set).

**Sign-in + session-gated routing (added 2026-09-01):** `app/index.tsx` now checks `supabase.auth.getSession()` (plus `onAuthStateChange` to stay current) before redirecting — a signed-in athlete lands in `/(tabs)`, everyone else goes to onboarding. Welcome's "I already have an account" link now goes to a new `/sign-in` route (`features/auth/screens/SignInScreen.tsx`, email/password via `signInWithPassword`) instead of doing nothing. Not yet handled: a session that exists but has no matching `athlete_profile` row (e.g. an unconfirmed signup that later got a session some other way) still lands in `/(tabs)` rather than being routed to finish onboarding — there's no real case that hits this today, but it's a gap once onboarding can be abandoned mid-flow with a session already issued.

What's explicitly **not** done, and is a real product decision before going further, not an oversight:

- **Email confirmation.** This project's default Supabase Auth settings likely require it, which means `signUp()` often won't return a session immediately — no session means no `athlete_profile`/`race` row yet (RLS correctly blocks that), and there's nowhere for that athlete to land afterward until they sign in for real (now possible, see above) once confirmed — or until confirmation is turned off in the dashboard. Still not confirmed done on the user's side.
- **Home/Training/Coach/Progress still read local mock data**, not this schema. Wiring them up is a bigger, cross-cutting change (a data-fetching pattern, loading/error states, and reconciling the screens' already-formatted display types with normalized rows) that deserves its own explicit go-ahead rather than a silent rewrite.

### Marketing waitlist (added 2026-09-01)

- `supabase/functions/waitlist` (Edge Function, JSON API only — `GET` → `{count}`, `POST` → `{position, alreadyIn}`) plus a `waitlist_signups` table (anon-insert-only RLS, no public read). Both work and are live.
- **The page itself isn't publicly reachable yet.** This project's Supabase gateway coerces every non-JSON response — Edge Functions and public Storage objects alike — down to `text/plain` before it reaches a browser, so neither can serve real, renderable HTML from this project's own domain (a deliberate anti-XSS guardrail, not a bug worth working around). The on-brand page is fully built at `supabase/functions/waitlist/static-site/index.html` and already calls the JSON API correctly — it just needs an actual static-file host (GitHub Pages, Cloudflare Pages, Vercel, Netlify — any of them). See the current-repo-state note in the Pace project for what's needed to finish this.

## Now (0–4 weeks) — build first

Research-validated (`Pace MVP Research Report`, ingested 2026-07-16):

1. Adaptive scheduling engine v1 — missed workout, calendar conflict, extra time, poor recovery, illness/travel block, race-date change
2. Google Calendar + Apple EventKit — conflict detection, Pace workout write-back, never overwrite existing events
3. Apple HealthKit read integration — workouts, sleep, resting HR, HRV if available
4. Race-based plan generation — Sprint/Olympic first, then 70.3/full as templates mature
5. Daily workout page — purpose, duration, intensity, sport, steps, explanation
6. Progress tracking — consistency, completed sessions, weekly load trend, upcoming focus
7. Adaptation audit trail — every plan change stored with before/after, reason, engine version
8. Manual override inputs — "I'm sick," "I'm traveling," "I slept poorly," "I have extra time," "move this workout"
9. Strava import/export — after Apple Health
10. Safety guardrails — load spike limits, taper protection, injury/illness rest recommendations

## Next (1–3 months)

- Garmin + COROS API applications (apply early; postponed as *live* integrations until approved — see [API.md](API.md))
- Plan explainability refinements
- Coaching insights
- Subscription/entitlement system (design now, don't monetize yet)
- Beta with 20–40 working adult triathletes (Sprint/Olympic/70.3) to validate adaptation trust before monetization

## Later (3–12 months)

- Google Health Connect (Android)
- Outlook Calendar (only if beta demand is high)
- Native watch complications
- Team / coach mode
- Multisport expansion
- Partnerships

## Explicitly postponed

Coach marketplace, social feed/community, nutrition/meal planning, FTP estimation, advanced CTL/ATL/TSB dashboards, AI-generated plans without deterministic guardrails — consistent with the MVP exclusions in [PROJECT_RULES.md](PROJECT_RULES.md).

# API

## Internal API surface

**Filled in (2026-09-02) — this was never actually a gap in the running app, just an undocumented one.** There is no hand-built internal REST API, and there was never a plan to build one: the client talks to Supabase directly for everything Auth/Users/Plans/Workouts/Metrics-shaped. Two real layers, not one:

1. **Direct PostgREST access to RLS-scoped tables** — the large majority of reads and writes. `athlete_profile`, `race`, `training_plan`, `training_phase`, `workout`, `workout_step`, `workout_target_zone`, `adaptation_event` (insert+select only, see DATABASE.md), `wearable_connection`, `recovery_signal` are all read (and, where the athlete owns the row, written) straight from `features/*/services/*.ts` via the Supabase client — no server-side route sits in between. RLS *is* the authorization layer for this surface; there's no separate "API design" step because Postgres's row-level policies already are the access-control decision.
2. **Supabase Edge Functions, only where PostgREST genuinely can't do the job** — specifically, anything needing a secret the client must never hold (a Google OAuth client secret, a stored refresh token) or a privileged write a client shouldn't be trusted to make honestly (flipping `calendar_connection.status` to `'connected'` without a real token exchange happening). As of 2026-09-02: `waitlist` (public), `google-calendar-oauth-callback` (public — see below for why), `google-calendar-freebusy` (authenticated), `google-calendar-disconnect` (authenticated). Every one of these is documented in DATABASE.md alongside the table(s) it's the sole writer/reader of.

**Auth** doesn't get its own function at all — `supabase.auth.*` (signUp/signInWithPassword/signOut/getSession/onAuthStateChange) is Supabase's own built-in auth API, called directly from the client (`lib/supabase/useSession.ts`, `features/onboarding/screens/GeneratingScreen.tsx`, `features/profile/screens/ProfileScreen.tsx`'s Sign Out). Nothing in this app wraps it in a custom endpoint, and nothing should — there's no logic to add in front of it today.

The "Expected surface: Auth, Users, Plans, Workouts, Calendar, Wearables, Metrics" line above predates any of this being built and reads like a traditional REST-API-first plan; it's superseded, not extended, by what actually shipped. A genuinely new Edge Function only gets added when a specific feature needs one of the two reasons above — the list isn't designed ahead of time, it grows one real need at a time, same as it has so far.

## Conventions

**Filled in (2026-09-02),** describing the pattern every Edge Function above already follows, not a new policy being imposed on them:

- **Naming**: kebab-case, `<domain>-<action>` (`google-calendar-oauth-callback`, `google-calendar-freebusy`, `google-calendar-disconnect`) — the slug doubles as the URL path (`/functions/v1/<slug>`), so it needs to read as a route on its own with no separate versioning segment (see Versioning below).
- **Auth**: `verify_jwt: true` (Supabase checks the caller's JWT before the function code runs at all) is the default for anything called from inside the signed-in app — `google-calendar-freebusy` and `google-calendar-disconnect` both use it, and a new authenticated function should too rather than re-implementing that check by hand. `verify_jwt: false` is the deliberate exception, only for an endpoint that must be reachable by a caller who structurally cannot hold a Supabase session: `waitlist` (called before signup exists) and `google-calendar-oauth-callback` (Google's own redirect, which can't carry a Supabase JWT). A `false` function still has to authenticate its request somehow — the callback does it via `calendar_connection_request`'s single-use correlation row (see DATABASE.md) rather than trusting the request at face value; a future `verify_jwt: false` function should have an equally concrete answer to "how does this know who/what it's really talking to," not skip the question because the JWT check is off.
- **Request/response shape**: JSON in, JSON out — a plain object on success (`{count}` / `{position, alreadyIn}` for waitlist; `{busy: [...]}` for freebusy), `{error: string}` on failure, both with `content-type: application/json` set explicitly. **This is a hard rule, not a style preference**: this project's Supabase gateway coerces any *non*-JSON response body (an HTML success/error page, notably) down to `text/plain` before it reaches a browser — a real, twice-confirmed bug class (see ROADMAP.md's Google Calendar sections) that broke the OAuth callback's original HTML confirmation pages on a real device even though `WebFetch` showed them rendering fine. The fix pattern that came out of that — `google-calendar-oauth-callback` now issues a 302 redirect to a static HTML page hosted on GitHub Pages instead of returning HTML itself — is the template for any future function that needs to hand a *browser* (not the app) something other than JSON: redirect to a static page, don't return a hand-rolled body.
- **Versioning**: none, deliberately, for the same reason there's no route design — every function so far is small, single-purpose, and has exactly one caller (a specific screen or hook) that gets updated in the same change as the function itself when its contract changes. A breaking change is an atomic client+function deploy, not a compatibility problem two independently-versioned deployments need to negotiate. Revisit this if a function ever gets a second, independently-deployed caller — nothing here yet does.
- **Pagination**: none of today's functions return a collection large enough to need it (`freebusy`'s `busy` array is bounded by the query window; `waitlist`'s `POST` returns one athlete's own position, not a list). The one place pagination-shaped logic exists at all is a plain SQL `limit`/`order by` inside a PostgREST query from the client (Coach's recent-adaptation-events fetch caps at 15) — not an Edge Function concern yet.
- **Idempotency**: not designed as a formal mechanism (no idempotency-key header anywhere) because nothing today has a duplicate-request cost worth guarding against — `calendar_connection_request` rows are single-use and deleted on first read rather than idempotency-keyed, and every other write is a Postgres upsert or a plain owned-row insert where a duplicate is either harmless or already prevented by a `unique` constraint (`wearable_connection`'s `unique(athlete_id, provider)`, etc.). Would need real design (a request-id table, most likely) before a function does something non-idempotent with real-world side effects worth double-submission protection — nothing here does yet.

## External integrations (research-backed)

### Calendar

| Provider | Notes | MVP status |
|---|---|---|
| Google Calendar API | REST, Events resource (start/end, recurrence, transparency, attendees, working location, focus time). Freebusy: `POST /calendar/v3/freeBusy`. Quota: 10,000 req/min/project, 600 req/min/user/project. | **v1 shipped 2026-09-02 — freebusy conflict-checking only.** Connect/disconnect real and live; full event read/write deferred (needs a "sensitive" OAuth scope + Google's app-verification review — `calendar.freebusy` alone is non-sensitive and skips that). See docs/ROADMAP.md and docs/DATABASE.md for the OAuth architecture and schema. |
| Apple EventKit | Local/on-device only (not a server API). `EKEventStore` requires explicit access request. Supports recurring events, alarms, change notifications. | **Build first**, for iOS local calendar visibility/write-back. Keep canonical plan in Supabase so the app reasons consistently without EventKit access. |
| Microsoft Graph (Outlook) | `calendar:getSchedule` for free/busy; 130,000 req/10s global app limit; personal MS accounts not supported for getSchedule. | **Postponed** unless beta demand is high — enterprise/admin consent adds disproportionate complexity for MVP value. |

**Hard rule: never overwrite existing user calendar events.** Conflict detection = free/busy + existing-event overlap check.

### Wearables (priority order)

| Priority | Provider | Notes |
|---|---|---|
| 1 | Apple HealthKit | Fastest iOS path, user-permissioned, no business approval, aggregates Garmin/COROS/Oura/Apple Watch data. Anchored object queries return only new/deleted items since last fetch. |
| 2 | Strava API | OAuth 2.0 per-athlete. Rate limit: 200 req/15min & 2,000/day default (400/15min & 4,000/day upgraded). Webhooks notify on activity create/delete/field changes; callback must return 200 OK within 2s. |
| 3 | Garmin Health/Activity API | Best triathlete device source, but commercial use requires a license fee and is approval-gated. Apply immediately, don't block MVP on approval. |
| 4 | COROS API | Gated, discretionary per-application review; no published rate limits/data types. Apply early, treat as v2 unless approved quickly. |
| 5 | Google Health Connect | Android only; defer to v2 if launching iOS-first. Design the provider abstraction now so this slots in later. |

**Architectural implication:** build a provider-independent wearable schema/abstraction before integrating every provider — Garmin/COROS gating makes this strategically important, not just clean code. This is now built (`wearable_connection`/`recovery_signal`, see DATABASE.md) with priority 1 (Apple HealthKit) as the one real provider (resting HR + HRV, added 2026-09-02) — see ROADMAP.md for the Expo Go → dev client caveat still blocking real-device verification, and for why sleep wasn't included in v1.

## Source

Pace MVP Research Report, §4–5 Calendar & Wearable Integrations (ingested 2026-07-16).

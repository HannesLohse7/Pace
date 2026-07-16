# API

## Internal API surface

🟡 **TODO:** internal route design not started. Expected surface: Auth, Users, Plans, Workouts, Calendar, Wearables, Metrics.

## Conventions

🟡 **TODO:** versioning strategy, error format, pagination, idempotency — not yet decided.

## External integrations (research-backed)

### Calendar

| Provider | Notes | MVP status |
|---|---|---|
| Google Calendar API | REST, Events resource (start/end, recurrence, transparency, attendees, working location, focus time). Freebusy: `POST /calendar/v3/freeBusy`. Quota: 10,000 req/min/project, 600 req/min/user/project. | **Primary — build first.** Reliable free/busy + read/write + recurring events. |
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

**Architectural implication:** build a provider-independent wearable schema/abstraction before integrating every provider — Garmin/COROS gating makes this strategically important, not just clean code.

## Source

Pace MVP Research Report, §4–5 Calendar & Wearable Integrations (ingested 2026-07-16).

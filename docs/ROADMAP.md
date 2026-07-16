# Roadmap

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

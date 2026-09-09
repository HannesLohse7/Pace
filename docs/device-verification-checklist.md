# Real-Device Verification Checklist

Everything below is real, shipped code that has only been `tsc`/`eslint`/`prettier`-verified — none of it has run on an actual phone yet. This list exists because three of these items specifically call out that gap in ROADMAP.md, plus one new item from today's training-load round. Go in order; each section says what you need before you can even attempt it.

Check off each row as you go (`[x]`) and note the actual result, not just pass/fail — "worked" vs. "worked but the badge flashed twice" are both useful, and this doc is meant to be updated in place, not rewritten.

**Update (2026-09-06): plain Expo Go is no longer usable for any of this, not just section 1.** Expo Go only ever supports the current SDK, and it auto-updated to SDK 57 on the test device while Pace is pinned to SDK 54 — "Project is incompatible with this version of Expo Go." This isn't Pace-specific and isn't fixable by changing app code; it means every section below now needs the same custom dev client that section 1 already required for HealthKit, not just section 1. We're building that dev client now (Apple Developer Program + EAS Build, since there's no Mac available locally for a plain `expo run:ios`) — once it's installed, run `npx expo start --dev-client` and open the project through that installed app instead of Expo Go, and every section below applies exactly as written.

---

## 1. Apple HealthKit sync (resting HR + HRV)

**Why this is first**: it's the most infrastructure-blocked item — the other three run in Expo Go today; this one structurally cannot.

**Prerequisites (none of this exists yet — confirm each before starting):**
- [ ] Apple Developer Program membership (paid tier — HealthKit's entitlement generally requires it, not the free tier)
- [ ] A custom dev client built (`eas build --profile development` or `expo run:ios`) — HealthKit is a native module (`@kingstinct/react-native-healthkit`) and cannot run inside Expo Go at all
- [ ] A physical iOS device with real Health app data — the Simulator has no real HealthKit store, so this can't be faked

**Steps:**
1. [ ] Install the dev client build on the device (not Expo Go)
2. [ ] Go through onboarding to the Wearables step, tap "Apple Health"
3. [ ] Confirm the iOS HealthKit permission sheet actually appears (not a silent failure) — grant read access to Resting Heart Rate and Heart Rate Variability
4. [ ] Confirm the Wearables screen shows "Connected" only after a genuine successful sync — not optimistically before the sync call resolves
5. [ ] In Supabase, check `wearable_connection` has a real row for this athlete (`provider = 'apple_health'`, `status = 'connected'`)
6. [ ] Check `recovery_signal` has rows for roughly the last 7 days, `source = 'apple_health'`, with plausible `resting_hr_bpm`/`hrv_ms` values matching what the Health app itself shows for the same days
7. [ ] Deny the permission sheet on a second test (fresh install, or revoke in iOS Settings first) and confirm the app shows an honest inline error — not "Connected" and not a silent no-op
8. [ ] Revoke HealthKit access from iOS Settings (Settings → Privacy → Health → Pace) after a successful connection, then reopen the app — confirm nothing crashes and the UI doesn't still claim "Connected" indefinitely without re-checking

**Known gap, not a bug to chase**: sleep data (`sleep_duration_min`) is never populated — this was deliberately deferred (see ROADMAP.md). Don't expect it to appear.

---

## 2. Training's pull-to-refresh vs. drag-to-reorder

**Why this matters**: Training's rows carry a long-press-activated drag gesture (`Gesture.Pan()`, scoped to a small handle icon) layered over the same scrollable list that now also has pull-to-refresh (`RefreshControl`). They look orthogonal on paper — one needs a long press on a specific icon, the other a plain pull from scroll position zero — but Training's drag-reorder has already gone through three real-device-bug-driven rewrites in this project's history, which is reason enough to check rather than assume.

**Steps (real device or simulator is fine here — no native module involved):**
1. [ ] Open Training with at least 2-3 workouts in the current week
2. [ ] Pull down from the very top of the list — confirm the refresh spinner appears and a refetch actually happens (not just a cosmetic spinner)
3. [ ] Long-press a workout row's drag handle and drag it to another day — confirm the drag activates cleanly and doesn't also trigger a pull-to-refresh
4. [ ] Try dragging starting from *just above* the handle, and from the row but not the handle — confirm neither accidentally triggers a refresh or a stuck/ghost drag
5. [ ] Mid-drag, try to pull down (two-finger or fast gesture) — confirm the drag isn't interrupted or corrupted by the scroll view trying to refresh underneath it
6. [ ] Drop a dragged workout onto another real workout (swap) and onto an empty rest day (move) — confirm both complete, the list updates, and a subsequent pull-to-refresh doesn't revert or duplicate anything
7. [ ] Repeat on both iOS and Android if both are targets — gesture conflicts are a common place for platform divergence

---

## 3. Profile "Sign Out" redirect

**Why this matters**: it calls `supabase.auth.signOut()` then explicitly `router.replace('/')` — the explicit redirect matters because nothing else re-checks session state once mounted (the tabs layout has no session guard; only root `app/index.tsx` does). If this is wrong, a signed-out athlete could get stuck looking at a dead tab bar instead of landing on onboarding/sign-in.

**Steps:**
1. [ ] Sign in normally, land in the tab bar
2. [ ] Go to Profile, tap "Sign Out"
3. [ ] Confirm you land on the Welcome/onboarding screen (not a blank screen, not still inside the tab bar, not a crash)
4. [ ] Confirm you can't navigate back into the tabs with the hardware/gesture back action after signing out
5. [ ] Sign back in and confirm a completely normal session (no stale cached data from before sign-out — e.g. old Progress/Training data flashing before the real fetch completes)
6. [ ] Force-quit the app while signed out, relaunch — confirm it lands on Welcome/sign-in again, not a stale signed-in state

---

## 4. Training-load: "Mark complete" + fitness trend (new, added 2026-09-06)

**Why this is here**: brand new this round, never touched a real device or even a real Supabase round-trip against live data (only `tsc`/`eslint`/`prettier`-checked). Not on the original punch list, but it's now the newest untested surface and belongs in the same pass.

**Steps:**
1. [ ] Open a non-rest, non-completed workout in Workout Detail, tap "Mark complete"
2. [ ] Tap an effort chip (1-10), enter a duration, tap Save — confirm it actually saves (no silent failure) and the status badge updates to "Completed" without needing a manual refresh
3. [ ] Reopen the same workout — confirm "Mark complete" no longer appears (it's now `'completed'`) and the badge persists after a full app restart
4. [ ] Try saving with no effort selected, and with an empty/zero/negative duration — confirm the inline validation messages appear and nothing gets written to `workout_completion`
5. [ ] Log completions for at least 2 different days, then open Progress — confirm the "FITNESS TREND" section switches from the "log your first workout" note to an actual chart once there are 2+ weekly points (a single day's log within the current week may not be enough — see `MIN_FITNESS_POINTS` in `buildProgressViewModel.ts`)
6. [ ] In Supabase, spot-check one `workout_completion` row's `actual_tss` equals `actual_duration_min × perceived_effort` for what you entered
7. [ ] Try marking the same workout complete a second time via two rapid taps (double-tap Save) — confirm it doesn't create a duplicate `workout_completion` row (the `unique(workout_id)` constraint should reject the second insert; confirm the UI shows a reasonable error rather than a silent hang)

---

## Reporting back

For each section, the useful summary is: what you did, what actually happened, and anything that didn't match the "expected" description above — not just a checkmark. If something fails, the actual error message/screenshot matters more than a description of it.

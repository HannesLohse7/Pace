# Sign-out navigation bug — handoff for local debugging

## The bug

Tapping **Sign Out** on Profile does not take the athlete back to onboarding.
After tapping it:

- Profile reverts to showing mock data (the name "Alex Rivera") instead of
  navigating away.
- Every other tab (Home, Training, Coach, Progress) shows a loading spinner
  that spins forever and never resolves.
- The athlete is stuck inside the (now signed-out) tab navigator indefinitely.

**Expected:** tapping Sign Out should land the athlete on
`/(onboarding)/splash`, the same place a signed-out cold launch goes via
`app/index.tsx`'s root gate.

## Everything already tried, in order (read before changing anything —
each of these was a real, confirmed bug, but none alone fixed the actual
symptom above)

1. **Double-navigation race.** `ProfileScreen.tsx`'s `handleSignOut` used to
   call `router.replace('/')` itself, *and* `app/(tabs)/_layout.tsx` had its
   own redirect guard reacting to the same sign-out. Both firing raced and
   produced a flicker. Fixed: `handleSignOut` now only calls
   `supabase.auth.signOut()` (wrapped in try/catch/finally so a rejected
   promise can't leave `isSigningOut` stuck true forever) and does not
   navigate itself. `(tabs)/_layout.tsx` is meant to be the sole navigator
   on sign-out.

2. **`<Redirect>` possibly re-firing.** Replaced expo-router's declarative
   `<Redirect href="/" />` in `(tabs)/_layout.tsx` with an imperative,
   `useRef`-guarded `useEffect` + `router.replace('/')`, so it can fire at
   most once per mount regardless of `useFocusEffect` focus/blur semantics.
   Real hardening, did not fix the underlying issue by itself.

3. **Per-component session desync (real bug, real fix).**
   `lib/supabase/useSession.tsx` (renamed from `.ts` — it now contains JSX)
   used to give EVERY component that called `useSession()` its own
   independent `getSession()` call and its own independent
   `onAuthStateChange` subscription — despite its own doc comment claiming
   to be a shared "single source of truth." During sign-out several
   consumers mount/unmount in quick succession and could transiently
   disagree about whether a session existed at the same real moment.
   Fixed by converting it into a real `SessionContext` + `SessionProvider`,
   mounted once in `app/_layout.tsx` around the entire route tree. Every
   existing call site (`app/index.tsx`, `(tabs)/_layout.tsx`, every tab
   screen, `ProfileScreen.tsx`) still calls `useSession()` exactly the same
   way — only where the subscription lives changed.

4. **React Navigation crash (real bug, real fix).**
   `(tabs)/_layout.tsx` used to conditionally `return null` instead of
   `<Tabs>` once session went null, AT THE SAME TIME the `useEffect` was
   independently calling `router.replace('/')`. Confirmed via an on-device
   error overlay: "Maximum update depth exceeded" with a stack trace
   through react-navigation's internal `PreventRemoveProvider.js` — five
   tab screens unmounting at once (each wraps content in its own
   `PreventRemoveProvider`), while the router was also mid-navigation,
   cascaded parent `setState` calls past React's nested-update limit.
   Fixed by always rendering `<Tabs>` unconditionally; `router.replace('/')`
   is now the ONLY thing that ever removes `(tabs)` from the tree.

5. **"Couldn't load" flashing on every tab.** Home/Training/Coach/Progress
   all had `if (isLoading) {spinner} if (isError || !data) {error}`. A
   *disabled* query (no `athleteId`, i.e. no session) isn't "loading" in
   react-query v5's terms, so it fell into the error branch and showed a
   scary "Couldn't load, try again" message during the moment session goes
   null. Changed each screen's first check to
   `if (isLoading || !athleteId) {spinner}`.

## Current state — the actual unresolved bug

After fix #5, sign-out still does not navigate the athlete out of `(tabs)`.
Profile falls back to its mock name (expected side effect of the real-name
query being disabled with no session — this part is working as designed),
and every other tab now shows the *correct* spinner from fix #5 — but that
spinner never resolves, because nothing is actually completing the
redirect. The athlete is stuck permanently inside a signed-out `(tabs)` tree.

This means `app/(tabs)/_layout.tsx`'s redirect effect is either:
- not firing at all,
- firing but `router.replace('/')` is not successfully navigating, or
- navigating, but something sends the athlete straight back into `(tabs)`.

This has NOT been root-caused yet. All five fixes above were real and are
worth keeping, but none of them explain why the actual navigation-away
still isn't happening.

## Relevant files (repo root: this checkout)

- `app/(tabs)/_layout.tsx` — the redirect guard: ref-guarded `useEffect` +
  `router.replace('/')`; renders `<Tabs>` unconditionally (see fix #4's
  doc comment inside this file for the crash history).
- `app/index.tsx` — root gate: `<Redirect href={session ? '/(tabs)' :
  '/(onboarding)/splash'} />`; also resets `useOnboardingStore` on the way
  into onboarding.
- `app/_layout.tsx` — root layout, wraps the whole `<Stack>` in
  `SessionProvider`.
- `lib/supabase/useSession.tsx` — `SessionProvider` + `useSession()`. ⚠️
  **Check whether `lib/supabase/useSession.ts` (old extension) still exists
  on disk** — if both files exist, Metro's module resolution could be
  picking either one unpredictably, which would look exactly like an
  intermittent/flaky version of this bug.
- `features/profile/screens/ProfileScreen.tsx` — `handleSignOut` (near line
  138–180).
- `features/home/screens/HomeScreen.tsx`,
  `features/training/screens/TrainingScreen.tsx`,
  `features/coach/screens/CoachScreen.tsx`,
  `features/progress/screens/ProgressScreen.tsx` — each has the
  `isLoading || !athleteId` spinner guard from fix #5.

## Suggested next steps

1. **Confirm there's no duplicate `useSession.ts`/`useSession.tsx` pair.**
   Delete the old `.ts` if it's still there. This alone might be the whole
   bug if it's still present.

2. **Add temporary `console.log` instrumentation** and reproduce with the
   Metro terminal visible (sign in → sign out):
   - Inside `SessionProvider`'s `onAuthStateChange` callback — log the
     event type and whether `nextSession` is null.
   - Inside `(tabs)/_layout.tsx`'s `useEffect` — log `isLoading`,
     `!!session`, and `hasRedirected.current` on every run, and log
     immediately before/after calling `router.replace('/')`.
   - Inside `app/index.tsx` — log `isLoading`/`!!session` on every render,
     and log right before rendering `<Redirect>`.

   This should show definitively: does the effect run at all? Does it
   actually call `replace`? Does `app/index.tsx` ever mount again
   afterward? If it does mount, does IT see a truthy session (which would
   mean a NEW, different context bug) or null (which would mean the
   `<Redirect>` itself isn't working)?

3. **Rule out a stale build.** Do a full `npx expo start --dev-client
   --tunnel --clear` and fully relaunch the app (not just a JS reload) —
   `(tabs)/_layout.tsx`/`app/_layout.tsx` are root-level files; make sure
   the change actually landed.

4. **Isolate the navigation call from sign-out entirely.** Temporarily add
   a plain button next to Sign Out that calls ONLY `router.replace('/')`
   with no `supabase.auth.signOut()` involved. If that alone doesn't
   navigate correctly, the bug is in routing/navigation, not auth. If it
   does navigate correctly, the bug is specifically in what happens to
   session state during/after `signOut()`.

5. Consider logging `usePathname()` / `useSegments()` before and after
   tapping Sign Out to see exactly what route Expo Router thinks it's on.

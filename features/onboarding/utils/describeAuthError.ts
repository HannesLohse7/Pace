/**
 * Turns a Supabase Auth error into copy an athlete can act on, without
 * leaking implementation detail for the cases that matter (a duplicate
 * email is the one an athlete will actually hit while testing this).
 *
 * Moved here 2026-09-09 from `GeneratingScreen.tsx`, which used to be
 * the only place `supabase.auth.signUp()` was called. Account creation
 * moved to `AccountScreen.tsx` the same day (real-device testing showed
 * a duplicate email wasn't reported until the very end of onboarding,
 * since that's when the account was actually created) — this helper
 * moved with it.
 */
export function describeAuthError(message: string): string {
  if (/already registered|already exists|already been registered/i.test(message)) {
    return 'An account with this email already exists.';
  }
  return message;
}

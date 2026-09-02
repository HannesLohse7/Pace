/**
 * Builds the Google OAuth consent URL for connecting a Google Calendar
 * read (freebusy-only) connection. Pure — no side effects, easy to unit
 * test, same split as `lib/planGenerator/generatePlan.ts`.
 *
 * `scope` is deliberately the narrowest one Google offers for this job —
 * `calendar.freebusy` — matching this app's own "Pace reads your busy
 * blocks — never event details" promise on the Calendar onboarding
 * screen. It's also classified "non-sensitive" by Google (unlike
 * `calendar.readonly`/`calendar.events`), which means this app doesn't
 * need to go through Google's OAuth app verification review to use it —
 * a real, practical reason to keep v1 scoped this narrow, not just a
 * privacy nicety. Write-back (a later round, see docs/ROADMAP.md) will
 * need a sensitive scope and will need that review.
 *
 * `redirect_uri` must exactly match both the "Authorized redirect URI"
 * configured on the Google Cloud OAuth client and the `REDIRECT_URI`
 * computed inside `supabase/functions/google-calendar-oauth-callback` —
 * derived from the same `EXPO_PUBLIC_SUPABASE_URL` the rest of the app
 * already uses, rather than hand-typed twice, so the two can't drift.
 */

const GOOGLE_AUTHORIZE_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const FREEBUSY_SCOPE = 'https://www.googleapis.com/auth/calendar.freebusy';

function getClientId(): string {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      'Missing EXPO_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID — copy .env.example to .env and fill in the value from the Google Cloud Console OAuth client.',
    );
  }
  return clientId;
}

export function getGoogleCalendarRedirectUri(): string {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL — see .env.example.');
  }
  return `${supabaseUrl}/functions/v1/google-calendar-oauth-callback`;
}

/**
 * @param state The id of a `calendar_connection_request` row the caller
 * has already inserted (see `createCalendarConnectionRequest.ts`) — the
 * one way the unauthenticated OAuth callback can recover which athlete
 * this exchange belongs to.
 */
export function buildGoogleCalendarAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: getClientId(),
    redirect_uri: getGoogleCalendarRedirectUri(),
    scope: FREEBUSY_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${GOOGLE_AUTHORIZE_ENDPOINT}?${params.toString()}`;
}

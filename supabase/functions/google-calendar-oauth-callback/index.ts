// Google Calendar OAuth callback — the one step of the whole connect flow
// that has to live server-side, and the reason this is an Edge Function
// instead of client code. See docs/ROADMAP.md for the full architecture
// writeup; short version: Expo Go can't register a custom URL scheme, so
// there's no way for Google to redirect straight back into the app the
// way a native OAuth flow normally would (and the old workaround for
// that, Expo's `auth.expo.io` proxy, is now flagged as an actual
// security risk, not just deprecated). Routing the whole exchange
// through a plain HTTPS callback sidesteps that entirely — no custom
// scheme, no dev client — and is arguably the more secure design anyway,
// since it means the phone never handles the OAuth client secret or the
// athlete's refresh token at all.
//
// `verify_jwt` is disabled for this function (see the deploy call), and
// that's deliberate, not an oversight: Google's redirect is an
// unauthenticated request from a third party — it cannot carry a
// Supabase JWT. This function implements its own single-use,
// short-expiry authentication instead: `state` is the id of a
// `calendar_connection_request` row the athlete's own authenticated
// client created (RLS: insert-only, own row) right before opening the
// consent screen. This function is the only thing that can ever read or
// delete that row (no select/delete policy exists for `authenticated`),
// so a forged `state` value just fails the lookup below.
//
// GET ?code=...&state=<connection_request id>  (or ?error=... on decline)
// Always ends by redirecting to a small static confirmation page — this
// loads inside a system browser the athlete opened from the app, not
// inside Pace itself.
//
// This used to render its own HTML directly (`return new Response(html,
// {headers: {'content-type': 'text/html'}})`), and it looked right in
// every check this project could run against it pre-launch — WebFetch
// against the live function returned exactly the intended HTML for both
// the `?error=access_denied` and expired-link paths. It wasn't until a
// real phone hit it in a real browser that the actual bug showed up:
// this project's Supabase gateway coerces every non-JSON Edge Function
// response down to `text/plain` before it reaches a browser — the same
// reason the waitlist page had to be moved to GitHub Pages instead of
// being served from Supabase directly (see docs/ROADMAP.md) — so what
// rendered as a real page in WebFetch's markdown conversion showed up on
// a real device as raw HTML source text. A redirect has no body for
// that coercion to mangle, only a `Location` header, so this now
// redirects to a static page (`static-site/calendar-connected.html`,
// deployed to the same GitHub Pages site as the waitlist) instead of
// returning HTML itself. The OAuth exchange and the DB writes below are
// unchanged and still happen entirely server-side, before the redirect —
// this only changes how the outcome is displayed afterward.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET')!;

// Must exactly match the redirect_uri used to build the authorize URL
// client-side (`lib/calendar/googleCalendarAuthUrl.ts`) and the
// "Authorized redirect URI" configured on the Google Cloud OAuth client
// — Google rejects the exchange otherwise. This project's Edge
// Functions are already live at this exact URL shape (confirmed by the
// working `waitlist` function), so this isn't a guess.
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-calendar-oauth-callback`;

// The static confirmation page this function hands off to — same site,
// same deploy mechanism as the waitlist page (see docs/ROADMAP.md's
// "Deploy note": this source lives under supabase/ on `main`, the live
// site is served from the separate `gh-pages` branch, so a copy step is
// still needed to actually publish it there).
const STATIC_SITE_URL = 'https://hanneslohse7.github.io/Pace/calendar-connected.html';

// Defense in depth on top of "single use" (the request row is deleted
// the moment it's read, below): reject a request row that's suspiciously
// old, in case a delete somehow didn't happen on a prior attempt.
const REQUEST_MAX_AGE_MS = 10 * 60 * 1000;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// `status` is one of a small fixed set the static page knows how to
// render (`connected` | `declined` | `expired` | `missing` | `failed`)
// — see calendar-connected.html's own OUTCOMES map. Deliberately not
// passing Google's own free-text error string or anything else
// user/attacker-influenced through as a query param: the static page
// never needs more than "which of these five things happened."
function redirectToOutcome(status: string): Response {
  return Response.redirect(`${STATIC_SITE_URL}?status=${status}`, 302);
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  if (oauthError) {
    // The athlete declined on Google's consent screen — not a bug. The
    // specific reason Google sent (e.g. "access_denied") is logged here
    // for debugging but not forwarded to the static page — see
    // redirectToOutcome's own comment for why.
    console.log('[google-calendar-oauth-callback] oauth error from Google:', oauthError);
    return redirectToOutcome('declined');
  }

  if (!code || !state) {
    return redirectToOutcome('missing');
  }

  const { data: request, error: fetchError } = await supabaseAdmin
    .from('calendar_connection_request')
    .select('id, athlete_id, created_at')
    .eq('id', state)
    .maybeSingle();

  if (fetchError || !request) {
    return redirectToOutcome('expired');
  }

  // Single-use: delete immediately, regardless of what happens next below.
  await supabaseAdmin.from('calendar_connection_request').delete().eq('id', state);

  const ageMs = Date.now() - new Date(request.created_at).getTime();
  if (ageMs > REQUEST_MAX_AGE_MS) {
    return redirectToOutcome('expired');
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    console.error(
      '[google-calendar-oauth-callback] token exchange failed:',
      tokenResponse.status,
      await tokenResponse.text(),
    );
    return redirectToOutcome('failed');
  }

  const tokens = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
  };

  // Google only returns a refresh_token when access_type=offline is set
  // on the authorize URL (it is, see googleCalendarAuthUrl.ts) — treated
  // as a hard failure rather than silently saving an access-only
  // connection, since an access-only connection would stop working the
  // moment the short-lived access_token expires (under an hour), with no
  // way to renew it.
  if (!tokens.refresh_token) {
    console.error(
      '[google-calendar-oauth-callback] no refresh_token in token response, scope:',
      tokens.scope,
    );
    return redirectToOutcome('failed');
  }

  const nowIso = new Date().toISOString();
  const expiresAtIso = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const { data: connection, error: connectionError } = await supabaseAdmin
    .from('calendar_connection')
    .upsert(
      {
        athlete_id: request.athlete_id,
        provider: 'google',
        status: 'connected',
        connected_at: nowIso,
        last_synced_at: nowIso,
      },
      { onConflict: 'athlete_id,provider' },
    )
    .select('id')
    .single();

  if (connectionError || !connection) {
    console.error(
      '[google-calendar-oauth-callback] connection upsert failed:',
      connectionError?.message,
    );
    return redirectToOutcome('failed');
  }

  const { error: tokenUpsertError } = await supabaseAdmin.from('calendar_oauth_token').upsert(
    {
      connection_id: connection.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAtIso,
    },
    { onConflict: 'connection_id' },
  );

  if (tokenUpsertError) {
    console.error(
      '[google-calendar-oauth-callback] token upsert failed:',
      tokenUpsertError.message,
    );
    return redirectToOutcome('failed');
  }

  return redirectToOutcome('connected');
});

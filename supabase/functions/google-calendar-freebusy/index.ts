// Checks an athlete's Google Calendar busy/free blocks for a given time
// window — the one real capability this v1 integration offers callers
// (see docs/ROADMAP.md: write-back and full event details are
// deliberately out of scope for now). Authenticated (verify_jwt stays
// enabled, unlike the OAuth callback) — the caller is Pace's own app,
// carrying the athlete's real Supabase session.
//
// POST { timeMin: string; timeMax: string } (RFC3339, e.g. a workout's
// scheduled window) -> { busy: { start: string; end: string }[] }
// or { error: string } on failure (never a fabricated empty result — a
// failed check should read as "couldn't check," not "clear").

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET')!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const JSON_HEADERS = { 'content-type': 'application/json' };

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS });
}

interface GoogleTokenRow {
  connection_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

/** Refreshes the stored access token if it's expired (or close to it) and persists the new one. Returns the access token to actually use for the freebusy call. */
async function getFreshAccessToken(token: GoogleTokenRow): Promise<string | null> {
  const expiresInMs = new Date(token.expires_at).getTime() - Date.now();
  const STILL_VALID_BUFFER_MS = 60_000; // refresh a minute early rather than racing an expiry mid-request
  if (expiresInMs > STILL_VALID_BUFFER_MS) return token.access_token;

  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!refreshResponse.ok) {
    console.error(
      '[google-calendar-freebusy] token refresh failed:',
      refreshResponse.status,
      await refreshResponse.text(),
    );
    return null;
  }

  const refreshed = (await refreshResponse.json()) as { access_token: string; expires_in: number };
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  await supabaseAdmin
    .from('calendar_oauth_token')
    .update({
      access_token: refreshed.access_token,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('connection_id', token.connection_id);

  return refreshed.access_token;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return jsonError('Method not allowed', 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonError('Missing Authorization header', 401);

  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await supabaseUser.auth.getUser(authHeader.replace('Bearer ', ''));

  if (!user) return jsonError('Not authenticated', 401);

  const body = await req.json().catch(() => null);
  const timeMin = typeof body?.timeMin === 'string' ? body.timeMin : null;
  const timeMax = typeof body?.timeMax === 'string' ? body.timeMax : null;
  if (!timeMin || !timeMax) return jsonError('timeMin and timeMax are required', 400);

  const { data: connection, error: connectionError } = await supabaseAdmin
    .from('calendar_connection')
    .select('id, google_calendar_id, status')
    .eq('athlete_id', user.id)
    .eq('provider', 'google')
    .maybeSingle();

  if (connectionError) {
    console.error('[google-calendar-freebusy] connection lookup failed:', connectionError.message);
    return jsonError('Something went wrong looking up your connection.', 500);
  }
  if (!connection || connection.status !== 'connected') {
    return jsonError('Google Calendar is not connected.', 409);
  }

  const { data: token, error: tokenError } = await supabaseAdmin
    .from('calendar_oauth_token')
    .select('connection_id, access_token, refresh_token, expires_at')
    .eq('connection_id', connection.id)
    .maybeSingle();

  if (tokenError || !token) {
    console.error('[google-calendar-freebusy] token lookup failed:', tokenError?.message);
    return jsonError('Something went wrong looking up your connection.', 500);
  }

  const accessToken = await getFreshAccessToken(token);
  if (!accessToken) {
    return jsonError('Could not refresh your Google connection — try reconnecting.', 502);
  }

  const freebusyResponse = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: connection.google_calendar_id }],
    }),
  });

  if (!freebusyResponse.ok) {
    console.error(
      '[google-calendar-freebusy] freebusy query failed:',
      freebusyResponse.status,
      await freebusyResponse.text(),
    );
    return jsonError('Could not check your calendar right now.', 502);
  }

  const freebusyResult = (await freebusyResponse.json()) as {
    calendars: Record<
      string,
      { busy: { start: string; end: string }[]; errors?: { reason: string }[] }
    >;
  };

  const calendarResult = freebusyResult.calendars[connection.google_calendar_id];
  if (!calendarResult || (calendarResult.errors && calendarResult.errors.length > 0)) {
    console.error('[google-calendar-freebusy] calendar-level error:', calendarResult?.errors);
    return jsonError('Could not check your calendar right now.', 502);
  }

  // Best-effort — a failed timestamp update shouldn't fail a check that
  // otherwise succeeded.
  await supabaseAdmin
    .from('calendar_connection')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', connection.id);

  return new Response(JSON.stringify({ busy: calendarResult.busy }), { headers: JSON_HEADERS });
});

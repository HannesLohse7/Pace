// Disconnects an athlete's Google Calendar connection for real: revokes
// the stored token with Google (not just a local status flip — unlike
// Apple HealthKit, whose permissions can only be revoked from iOS
// Settings, Google's OAuth grant genuinely can be revoked from here), then
// deletes the token row and marks the connection `disconnected`.
// Authenticated — verify_jwt stays enabled.
//
// POST (no body) -> { ok: true } or { error: string }

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const JSON_HEADERS = { 'content-type': 'application/json' };

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS });
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

  const { data: connection, error: connectionError } = await supabaseAdmin
    .from('calendar_connection')
    .select('id')
    .eq('athlete_id', user.id)
    .eq('provider', 'google')
    .maybeSingle();

  if (connectionError) {
    console.error(
      '[google-calendar-disconnect] connection lookup failed:',
      connectionError.message,
    );
    return jsonError('Something went wrong.', 500);
  }
  if (!connection) {
    // Already disconnected (or never connected) — treat as success rather
    // than an error, since the athlete's desired end state is met either way.
    return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
  }

  const { data: token } = await supabaseAdmin
    .from('calendar_oauth_token')
    .select('refresh_token')
    .eq('connection_id', connection.id)
    .maybeSingle();

  if (token) {
    // Revoking the refresh token invalidates the whole grant on Google's
    // side, not just the token string itself — best-effort: a failed
    // revoke call shouldn't block disconnecting inside Pace, since the
    // athlete has already asked to disconnect and any leftover access
    // token expires on its own within the hour regardless.
    const revokeResponse = await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: token.refresh_token }),
    });
    if (!revokeResponse.ok) {
      console.error(
        '[google-calendar-disconnect] Google revoke call failed:',
        revokeResponse.status,
      );
    }
  }

  await supabaseAdmin.from('calendar_oauth_token').delete().eq('connection_id', connection.id);
  const { error: updateError } = await supabaseAdmin
    .from('calendar_connection')
    .update({ status: 'disconnected' })
    .eq('id', connection.id);

  if (updateError) {
    console.error('[google-calendar-disconnect] status update failed:', updateError.message);
    return jsonError('Something went wrong.', 500);
  }

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
});

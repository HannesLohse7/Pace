// Pace waitlist JSON API. The visual page lives at Supabase Storage
// (supabase/functions/waitlist/static-site/index.html, uploaded via the
// `seed-storage` one-off script) — NOT served from this function.
//
// Why the split: this project's Edge Functions gateway coerces any
// non-JSON Content-Type (text/html included) down to text/plain before
// it reaches the browser — confirmed by direct test, not documented
// anywhere obvious, but consistent across every response shape tried.
// Likely a deliberate guardrail against a function serving live,
// cookie-bearing HTML under a domain that also carries this project's
// Auth endpoints. JSON passes through untouched, so this function stays
// a plain JSON API and the static page's own <script> calls it with
// fetch() — same-origin, no CORS needed.
//
// GET  -> { count }
// POST -> { position, alreadyIn } or { error } (uses the service role
//          key to bypass RLS for both the insert and the count read —
//          the anon-insert-only policy on waitlist_signups is what a
//          direct REST/anon-key caller would hit instead).
//
// Deploy: mcp__Supabase__deploy_edge_function (project nttuahswduqupiykguhk).

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const JSON_HEADERS = { 'content-type': 'application/json' };

async function getSignupCount(): Promise<number> {
  const { count } = await supabaseAdmin
    .from('waitlist_signups')
    .select('*', { count: 'exact', head: true });
  return count ?? 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'GET') {
    const count = await getSignupCount();
    return new Response(JSON.stringify({ count }), { headers: JSON_HEADERS });
  }

  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase();
    const distanceInterest = String(body.distance_interest ?? '');
    const source = String(body.source ?? 'landing');

    if (!email || !EMAIL_PATTERN.test(email)) {
      return new Response(JSON.stringify({ error: 'Enter a valid email address.' }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const { error: insertError } = await supabaseAdmin.from('waitlist_signups').insert({
      email,
      distance_interest: distanceInterest || null,
      source: source || null,
    });

    // 23505 = unique_violation — this email already joined. Treated as a
    // friendly success, not an error: same confirmation either way.
    const alreadyIn = insertError?.code === '23505';
    if (insertError && !alreadyIn) {
      console.error('[waitlist] insert failed:', insertError.message);
      return new Response(
        JSON.stringify({ error: 'Something went wrong — try again in a moment.' }),
        { status: 500, headers: JSON_HEADERS },
      );
    }

    const position = await getSignupCount();
    return new Response(JSON.stringify({ position, alreadyIn }), { headers: JSON_HEADERS });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: JSON_HEADERS,
  });
});

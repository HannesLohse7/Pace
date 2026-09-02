import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase/client';

/**
 * Creates the short-lived correlation row the OAuth callback Edge
 * Function needs to know which athlete a Google redirect belongs to —
 * see `supabase/functions/google-calendar-oauth-callback/index.ts` for
 * why this exists. RLS only allows inserting your own row (no
 * select/update/delete — see docs/DATABASE.md), so the returned id is
 * the only thing the caller can do with it: pass it as the `state`
 * param on the Google authorize URL.
 *
 * The id is generated client-side (`Crypto.randomUUID()`) rather than
 * left to the table's `default gen_random_uuid()` and read back via
 * `.insert().select()` — that was the original approach, and it was a
 * real bug, not just unnecessary: `calendar_connection_request` has no
 * SELECT policy at all (by design, see docs/DATABASE.md), so PostgREST's
 * RETURNING clause can't see the row it just inserted for this role.
 * With `.single()` expecting exactly one object back, that 0-row result
 * reads as an error to PostgREST, which rolls back the whole insert —
 * so the row silently never existed, `createCalendarConnectionRequest`
 * always threw, and Connect always failed after "Waiting for Google…"
 * for every athlete, regardless of session/env state. Supplying the id
 * ourselves means there's nothing to read back — a plain insert with no
 * `.select()` needs only the INSERT policy, which is exactly what this
 * table grants.
 */
export async function createCalendarConnectionRequest(athleteId: string): Promise<string> {
  const id = Crypto.randomUUID();
  const { error } = await supabase
    .from('calendar_connection_request')
    .insert({ id, athlete_id: athleteId });

  if (error) {
    throw error;
  }
  return id;
}

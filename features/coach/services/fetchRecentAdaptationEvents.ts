import { supabase } from '@/lib/supabase/client';
import type { Tables } from '@/lib/supabase/types';

export type RecentAdaptationEvent = Pick<
  Tables<'adaptation_event'>,
  'id' | 'summary' | 'reasoning' | 'created_at'
>;

/**
 * No pagination/"load more" yet — a single reasonably-sized page is
 * enough for v1's "recent changes" framing; revisit if Coach ever needs
 * a full scrollable history rather than a recap.
 */
const RECENT_EVENT_LIMIT = 15;

/**
 * Coach's version of `features/training/services/fetchWorkoutHistory.ts`
 * (#16) — same table, same shape, but across every workout the athlete
 * has rather than one. `trigger_type` still needs no display mapping
 * (`summary` is already the athlete-facing sentence, per
 * docs/DATABASE.md), so this reads exactly the same three columns.
 */
export async function fetchRecentAdaptationEvents(
  athleteId: string,
): Promise<RecentAdaptationEvent[]> {
  const { data, error } = await supabase
    .from('adaptation_event')
    .select('id, summary, reasoning, created_at')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false })
    .limit(RECENT_EVENT_LIMIT);

  if (error) throw error;
  return data ?? [];
}

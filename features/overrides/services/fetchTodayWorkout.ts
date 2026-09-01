import { supabase } from '@/lib/supabase/client';
import type { Tables } from '@/lib/supabase/types';
import { toIsoDate } from '@/shared/utils/date';

export type WorkoutRow = Tables<'workout'>;

/** The athlete's real workout scheduled for today, if any — null on a rest day (or before a plan exists). Used by `ReportOverrideScreen.tsx` to know what (if anything) an illness/travel/poor-sleep report should mark missed. */
export async function fetchTodayWorkout(athleteId: string): Promise<WorkoutRow | null> {
  const { data, error } = await supabase
    .from('workout')
    .select('*')
    .eq('athlete_id', athleteId)
    .eq('scheduled_date', toIsoDate(new Date()))
    .maybeSingle();
  if (error) throw error;
  return data;
}

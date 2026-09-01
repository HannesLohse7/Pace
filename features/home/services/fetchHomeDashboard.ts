import { supabase } from '@/lib/supabase/client';
import type { Tables } from '@/lib/supabase/types';
import { addDays, mondayOnOrBefore, toIsoDate } from '@/shared/utils/date';

export type WorkoutRow = Tables<'workout'>;

export interface HomeDashboardData {
  athleteFirstName: string;
  /** Null when the athlete has no active plan yet -- see generateTrainingPlan's own scope notes (Sprint/Olympic only, for now). */
  plan: { startDate: string; endDate: string; weeks: number } | null;
  race: { name: string; raceDate: string } | null;
  todayWorkout: WorkoutRow | null;
  /** This calendar week's (Mon-Sun) workouts, todayWorkout included. */
  weekWorkouts: WorkoutRow[];
  /** Up to 3 workouts strictly after today, nearest first. */
  upcomingWorkouts: WorkoutRow[];
}

/**
 * One round trip's worth of Home Dashboard data for one athlete. Kept
 * framework-agnostic (no React) on purpose, same reasoning as
 * lib/planGenerator/generatePlan.ts -- `features/home/hooks/useHomeDashboard.ts`
 * is the only thing that knows this is used inside a TanStack Query hook.
 */
export async function fetchHomeDashboard(athleteId: string): Promise<HomeDashboardData> {
  const today = new Date();
  const todayIso = toIsoDate(today);
  const weekStartIso = toIsoDate(mondayOnOrBefore(today));
  const weekEndIso = toIsoDate(addDays(mondayOnOrBefore(today), 6));
  // Wide enough to cover "this week" plus a few days into next week, so
  // there's always a handful of upcoming sessions to show even on a
  // Saturday/Sunday.
  const fetchWindowEndIso = toIsoDate(addDays(today, 14));

  const [profileResult, planResult, workoutResult] = await Promise.all([
    supabase.from('athlete_profile').select('display_name').eq('id', athleteId).maybeSingle(),
    supabase
      .from('training_plan')
      .select('*')
      .eq('athlete_id', athleteId)
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('workout')
      .select('*')
      .eq('athlete_id', athleteId)
      .gte('scheduled_date', weekStartIso)
      .lte('scheduled_date', fetchWindowEndIso)
      .order('scheduled_date', { ascending: true })
      .order('sequence_in_day', { ascending: true }),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (planResult.error) throw planResult.error;
  if (workoutResult.error) throw workoutResult.error;

  let race: HomeDashboardData['race'] = null;
  if (planResult.data?.race_id) {
    const raceResult = await supabase
      .from('race')
      .select('name, race_date')
      .eq('id', planResult.data.race_id)
      .maybeSingle();
    if (raceResult.error) throw raceResult.error;
    if (raceResult.data) {
      race = { name: raceResult.data.name, raceDate: raceResult.data.race_date };
    }
  }

  const workouts = workoutResult.data ?? [];
  const todayWorkout = workouts.find((w) => w.scheduled_date === todayIso) ?? null;
  const weekWorkouts = workouts.filter(
    (w) => w.scheduled_date >= weekStartIso && w.scheduled_date <= weekEndIso,
  );
  const upcomingWorkouts = workouts.filter((w) => w.scheduled_date > todayIso).slice(0, 3);

  const firstName = profileResult.data?.display_name.trim().split(/\s+/)[0];

  return {
    athleteFirstName: firstName || 'there',
    plan: planResult.data
      ? {
          startDate: planResult.data.start_date,
          endDate: planResult.data.end_date,
          weeks: planResult.data.weeks,
        }
      : null,
    race,
    todayWorkout,
    weekWorkouts,
    upcomingWorkouts,
  };
}

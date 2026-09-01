import { supabase } from '@/lib/supabase/client';

/**
 * Thrown (as `new Error(TAPER_LOAD_GUARDRAIL_ERROR)`) by
 * `useReorderWorkout.ts` when a reschedule is blocked by this
 * guardrail, so callers can recognize *why* a mutation failed and show
 * an athlete-facing explanation instead of a generic error — see
 * `WorkoutDetailScreen.tsx`'s "Move this workout" error handling.
 */
export const TAPER_LOAD_GUARDRAIL_ERROR = 'TAPER_LOAD_GUARDRAIL';

export interface TaperLoadCheck {
  athleteId: string;
  /** ISO 'YYYY-MM-DD' — the calendar day whose total planned load might change. */
  date: string;
  /** That day's total planned duration before the mutation. */
  beforeMin: number;
  /** That day's total planned duration after the mutation. */
  afterMin: number;
}

/**
 * v1 safety guardrail (per-user decision, 2026-09-01: "duration-based
 * caps only" — the one signal every generated workout reliably has, no
 * TSS/CTL/ATL/TSB data exists to detect a real load spike, and Progress
 * already placeholders honestly for exactly that reason). Scope,
 * deliberately narrow: **during a `Taper` phase, no mutation in this
 * app may increase a calendar day's total planned duration.** Real
 * coaches actively protect taper from added load — moving a training
 * day onto what was a scheduled rest day, or swapping in a longer
 * session, works against the entire point of tapering.
 *
 * Treats a day's "total planned duration" as its one real workout's own
 * duration — the plan generator (`generatePlan.ts`) never schedules
 * more than one real workout per calendar day today, so per-workout and
 * per-day totals are the same thing in practice; this would need to sum
 * across same-day workouts if that ever changes.
 *
 * Only ever blocks an *increase* — a decrease or no-op always passes,
 * regardless of phase. Outside a Taper phase (or when the date falls
 * outside every known phase — before a plan starts, after a race),
 * nothing is blocked; this guardrail has no opinion on Base/Build/Peak
 * load, on purpose (out of scope, see ROADMAP.md).
 *
 * Used by `useReorderWorkout.ts` for manual reschedules (drag-reorder,
 * "Move this workout"). The v1 adaptation engine
 * (`lib/adaptation/engine/adaptAfterMissedWorkout.ts`) doesn't call this
 * — it's structurally incapable of increasing a workout's duration in
 * the first place (see that file's own guard), so there's nothing for
 * this check to catch there.
 */
export async function violatesTaperLoadGuardrail({
  athleteId,
  date,
  beforeMin,
  afterMin,
}: TaperLoadCheck): Promise<boolean> {
  if (afterMin <= beforeMin) return false;

  const { data, error } = await supabase
    .from('training_phase')
    .select('id')
    .eq('athlete_id', athleteId)
    .eq('name', 'Taper')
    .lte('start_date', date)
    .gte('end_date', date)
    .maybeSingle();

  return !error && Boolean(data);
}

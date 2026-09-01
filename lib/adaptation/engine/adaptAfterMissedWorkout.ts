import { logAdaptationEvent } from '@/lib/adaptation/logAdaptationEvent';
import { supabase } from '@/lib/supabase/client';
import { addDays, fromIsoDate, mondayOnOrBefore, toIsoDate } from '@/shared/utils/date';

import { getEngineVersionId } from './getEngineVersionId';

export interface MissedWorkoutInput {
  athleteId: string;
  /** ISO 'YYYY-MM-DD' — the missed workout's own scheduled date, used to find the rest of *its* calendar week. */
  scheduledDate: string;
}

function roundToNearest5(minutes: number): number {
  return Math.max(5, Math.round(minutes / 5) * 5);
}

/**
 * Adaptation engine v1 — deliberately one rule, not a general
 * replanner (per-user decision, 2026-09-01: "rule-based v1, missed
 * workout / illness-travel / poor-recovery only"). Called right after
 * `features/overrides/services/reportOverride.ts` marks today's
 * workout `missed` for illness, travel, or poor recovery — the only 3
 * places in the app a workout's status becomes `missed` today, so
 * "reacts to a missed workout" and "reacts to those 3 reports" are the
 * same thing in practice.
 *
 * The rule, deliberately conservative: **don't try to make up the lost
 * session.** Redistributing a missed workout's volume onto other days
 * this week (compressing, doubling up) is exactly the kind of thing
 * that can turn one missed day into overreaching, and this app's only
 * safety guardrail (ROADMAP.md #15, `checkTaperLoadGuardrail.ts`) is
 * narrowly scoped to taper protection — not a general check this rule
 * could lean on. Instead, the next remaining `planned` workout *this
 * calendar week* gets its
 * `planned_duration_min` trimmed by ~20% (floored at 15 min, rounded to
 * the nearest 5 — same rounding convention `lib/planGenerator/
 * generatePlan.ts` uses) — an "ease back in" adjustment that's safe by
 * construction: it only ever removes load, never adds it, regardless of
 * whether that next session was easy or hard. Deliberately not
 * discipline-aware or intensity-aware: `workout.intensity` is free text
 * written only by the plan generator's own templates ('Threshold (Z4)',
 * 'Easy (Z1-Z2)', etc.), not a CHECK-constrained enum — pattern-matching
 * it to classify "hard" vs "easy" would be exactly the kind of fragile,
 * unreliable inference this app avoids elsewhere (see `workoutMapping.ts`'s
 * *real* CHECK-constrained-column gotcha for the pattern this app does
 * trust). Duration is the one signal every generated workout reliably
 * has.
 *
 * No-ops (returns `{ adjustedWorkoutId: null }`) rather than adjusting
 * anything when: the engine version can't be looked up (an unmigrated
 * environment — see `getEngineVersionId.ts`), there's no remaining
 * `planned` workout later this same week, that workout has no
 * `planned_duration_min` to trim, or the 20% trim rounds back to the
 * original value (already at the 15-minute floor). Never throws — this
 * runs as a best-effort follow-up to an athlete action that already
 * succeeded (their report was logged, today's workout is already
 * `missed`), so a failure here is logged and swallowed, not surfaced.
 *
 * `trimmed >= original` is checked below and treated as a no-op — this
 * is what makes the engine structurally incapable of ever increasing a
 * workout's duration, which is also why
 * `lib/adaptation/guardrails/checkTaperLoadGuardrail.ts` (added
 * 2026-09-01, #15) doesn't need to check the engine's own output: there
 * is nothing for that guardrail to catch here. It exists to catch
 * *manual* reschedules instead (`useReorderWorkout.ts`), and as a
 * backstop for any future engine version that isn't as conservative as
 * this one.
 */
export async function adaptAfterMissedWorkout({
  athleteId,
  scheduledDate,
}: MissedWorkoutInput): Promise<{ adjustedWorkoutId: string | null }> {
  try {
    const engineVersionId = await getEngineVersionId();
    if (!engineVersionId) return { adjustedWorkoutId: null };

    const weekStart = mondayOnOrBefore(fromIsoDate(scheduledDate));
    const weekEndIso = toIsoDate(addDays(weekStart, 6));

    const { data: candidate, error: candidateError } = await supabase
      .from('workout')
      .select('id, title, training_plan_id, planned_duration_min')
      .eq('athlete_id', athleteId)
      .eq('status', 'planned')
      .gt('scheduled_date', scheduledDate)
      .lte('scheduled_date', weekEndIso)
      .order('scheduled_date', { ascending: true })
      .order('sequence_in_day', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (candidateError || !candidate || candidate.planned_duration_min == null) {
      return { adjustedWorkoutId: null };
    }

    const original = candidate.planned_duration_min;
    const trimmed = Math.max(15, roundToNearest5(original * 0.8));
    if (trimmed >= original) return { adjustedWorkoutId: null };

    const { error: updateError } = await supabase
      .from('workout')
      .update({ planned_duration_min: trimmed })
      .eq('id', candidate.id);
    if (updateError) return { adjustedWorkoutId: null };

    await logAdaptationEvent({
      athleteId,
      triggerType: 'missed_workout',
      summary: `Shortened "${candidate.title}" to ease back in after a missed workout.`,
      reasoning:
        'Trimmed by about 20% instead of redistributing the lost session elsewhere this week — reduces load after a disruption rather than adding to it.',
      trainingPlanId: candidate.training_plan_id,
      workoutId: candidate.id,
      beforeState: { planned_duration_min: String(original) },
      afterState: { planned_duration_min: String(trimmed) },
      engineVersionId,
    });

    return { adjustedWorkoutId: candidate.id };
  } catch (err) {
    console.warn('[adaptAfterMissedWorkout] skipped:', err);
    return { adjustedWorkoutId: null };
  }
}

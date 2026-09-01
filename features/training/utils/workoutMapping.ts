import { fromIsoDate } from '@/shared/utils/date';
import { formatDurationMinutes, formatShortWeekday } from '@/shared/utils/format';

import type { WorkoutRow } from '../services/fetchTrainingWeek';
import type { Discipline, PlannedWorkout, WorkoutStatus } from '../types/training';

const KNOWN_DISCIPLINES: readonly Discipline[] = ['swim', 'bike', 'run', 'strength', 'rest'];

/**
 * `workout.discipline` is typed as plain `string` in the generated
 * Supabase types (the CHECK constraint lives in Postgres, not in the
 * generated TS types) -- same gotcha `buildHomeViewModel.ts`'s
 * `disciplineColor` already works around. Falls back to `'rest'` for
 * anything unrecognized rather than throwing; `'rest'` reads as neutral
 * everywhere this shows up (dimmed title, grey dot).
 */
export function asDiscipline(value: string): Discipline {
  return (KNOWN_DISCIPLINES as readonly string[]).includes(value) ? (value as Discipline) : 'rest';
}

/**
 * `workout.status` in the schema is only ever `planned`/`completed`/
 * `missed` (see DATABASE.md) -- there's no "past" concept in the DB
 * itself, since there's no completion tracking wired up yet. This maps
 * a `planned` workout whose date has already elapsed to the UI's
 * `'past'` status (see `WorkoutStatus`'s own doc comment for why that's
 * the honest choice, not `'upcoming'` or `'missed'`). Unrecognized
 * values fall back to the same date-based `'past'`/`'upcoming'` split a
 * `planned` row would get, rather than throwing.
 */
export function mapWorkoutStatus(
  dbStatus: string,
  scheduledDateIso: string,
  todayIso: string,
): WorkoutStatus {
  if (dbStatus === 'completed') return 'completed';
  if (dbStatus === 'missed') return 'missed';
  return scheduledDateIso < todayIso ? 'past' : 'upcoming';
}

/**
 * A real `workout` row -> the shared `PlannedWorkout` display shape,
 * used by both Training's week list (`buildTrainingViewModel.ts`) and
 * Workout Detail (`buildWorkoutDetailViewModel.ts`, which enriches the
 * result further with `workout_step`/`workout_target_zone` data this
 * function doesn't fetch). `pace_target`/`cadence_target` are direct
 * columns on `workout` itself, so they're included here even though
 * Training's own row list never renders them -- no extra query needed
 * for Workout Detail to have them.
 */
export function mapWorkoutRowToPlanned(workout: WorkoutRow, todayIso: string): PlannedWorkout {
  const scheduledDate = fromIsoDate(workout.scheduled_date);
  return {
    id: workout.id,
    short: formatShortWeekday(scheduledDate),
    dateNum: String(scheduledDate.getDate()),
    discipline: asDiscipline(workout.discipline),
    title: workout.title,
    duration: formatDurationMinutes(workout.planned_duration_min ?? 0),
    intensity: workout.intensity ?? '—',
    tss: workout.planned_tss ?? undefined,
    status: mapWorkoutStatus(workout.status, workout.scheduled_date, todayIso),
    calories: workout.planned_calories ?? undefined,
    description: workout.description ?? '',
    equipment: workout.equipment ?? [],
    paceTarget: workout.pace_target ?? undefined,
    cadenceTarget: workout.cadence_target ?? undefined,
    isReal: true,
    trainingPlanId: workout.training_plan_id,
  };
}

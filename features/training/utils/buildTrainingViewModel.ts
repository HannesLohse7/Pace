import type { RaceCountdown } from '@/features/home/types/home';
import { addDays, fromIsoDate, mondayOnOrBefore, toIsoDate } from '@/shared/utils/date';
import { formatShortDate } from '@/shared/utils/format';
import { computeRaceCountdown } from '@/shared/utils/raceCountdown';

import type { TrainingWeekData, WorkoutRow } from '../services/fetchTrainingWeek';
import type { PlannedWorkout, TrainingPhaseInfo, TrainingPhaseName } from '../types/training';
import { mapWorkoutRowToPlanned } from './workoutMapping';

const KNOWN_PHASES: readonly TrainingPhaseName[] = ['Base', 'Build', 'Peak', 'Taper'];

/** Same runtime-check gotcha as `workoutMapping.ts`'s `asDiscipline` -- `training_phase.name` is plain `string` in the generated types. Falls back to `'Base'`, the periodization phase every plan starts in. */
function asPhaseName(value: string): TrainingPhaseName {
  return (KNOWN_PHASES as readonly string[]).includes(value)
    ? (value as TrainingPhaseName)
    : 'Base';
}

function buildRestPlaceholder(date: Date, todayIso: string): PlannedWorkout {
  const iso = toIsoDate(date);
  return {
    id: `rest-${iso}`,
    short: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    dateNum: String(date.getDate()),
    discipline: 'rest',
    title: 'Rest Day',
    duration: '—',
    intensity: '—',
    status: iso < todayIso ? 'past' : 'upcoming',
    description: 'No session scheduled.',
    equipment: [],
    isReal: false,
  };
}

export interface TrainingViewModel {
  weekDateRangeLabel: string;
  totalHoursLabel: string;
  /** Exactly 7 entries, Monday through Sunday, one per calendar day this week -- a real workout row where one exists, a synthesized Rest Day placeholder otherwise. */
  days: PlannedWorkout[];
  /** Null when there's no active plan yet, or the plan has no phases (shouldn't happen for a generated plan, but not assumed). */
  currentPhase: TrainingPhaseInfo | null;
  /** Null when there's no race/plan to count down to yet. */
  raceCountdown: RaceCountdown | null;
}

/**
 * A valid Training drag-and-drop target: an upcoming day that isn't
 * already a real, non-rest workout locked by status. Mirrors
 * `shared/store/isSwappable`'s rule for the *dragged* item, but a drop
 * *target* additionally accepts an empty (synthesized) rest day --
 * `isSwappable` alone would reject that, since it excludes `discipline
 * === 'rest'` unconditionally.
 */
export function canAcceptDrop(day: PlannedWorkout): boolean {
  if (day.status !== 'upcoming') return false;
  return day.isReal ? day.discipline !== 'rest' : true;
}

/**
 * `TrainingWeekData` -> the display shapes `TrainingScreen.tsx` and its
 * row/drag components already expect. Pure, no React -- same layering
 * as `features/home/utils/buildHomeViewModel.ts`.
 */
export function buildTrainingViewModel(data: TrainingWeekData, today: Date): TrainingViewModel {
  const todayIso = toIsoDate(today);
  const weekStart = mondayOnOrBefore(today);
  const weekEnd = addDays(weekStart, 6);

  const workoutsByDate = new Map<string, WorkoutRow>();
  data.weekWorkouts.forEach((workout) => workoutsByDate.set(workout.scheduled_date, workout));

  const days: PlannedWorkout[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const row = workoutsByDate.get(toIsoDate(date));
    return row ? mapWorkoutRowToPlanned(row, todayIso) : buildRestPlaceholder(date, todayIso);
  });

  const totalMinutes = data.weekWorkouts.reduce((sum, w) => sum + (w.planned_duration_min ?? 0), 0);
  const totalHoursLabel = `${(totalMinutes / 60).toFixed(1)} HRS`;

  const weekDateRangeLabel = `${formatShortDate(weekStart).toUpperCase()} – ${formatShortDate(weekEnd).toUpperCase()}`;

  const activePhase =
    data.phases.find((phase) => phase.start_date <= todayIso && todayIso <= phase.end_date) ?? null;

  const currentPhase: TrainingPhaseInfo | null = activePhase
    ? {
        name: asPhaseName(activePhase.name),
        startDate: formatShortDate(fromIsoDate(activePhase.start_date)),
        endDate: formatShortDate(fromIsoDate(activePhase.end_date)),
      }
    : null;

  return {
    weekDateRangeLabel,
    totalHoursLabel,
    days,
    currentPhase,
    raceCountdown: computeRaceCountdown({ race: data.race, plan: data.plan }, today),
  };
}

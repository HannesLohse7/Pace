import type { ColorPalette } from '@/shared/theme/colors';
import { fromIsoDate, mondayOnOrBefore, toIsoDate } from '@/shared/utils/date';
import { formatDateLabel, formatDurationMinutes, formatShortWeekday } from '@/shared/utils/format';
import { computeRaceCountdown } from '@/shared/utils/raceCountdown';

import type { HomeDashboardData, WorkoutRow } from '../services/fetchHomeDashboard';
import type {
  RaceCountdown,
  TodayWorkout,
  UpcomingWorkoutItem,
  WeekDayStatus,
  WeekDayState,
} from '../types/home';

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function disciplineLabel(discipline: WorkoutRow['discipline']): string {
  return discipline.charAt(0).toUpperCase() + discipline.slice(1);
}

/**
 * `workout.discipline` is typed as plain `string` in the generated
 * Supabase types (the CHECK constraint that actually limits it to
 * swim/bike/run/strength/rest lives in Postgres, not in the generated
 * TS types), so it isn't assignable to `ColorPalette['sport']`'s literal
 * key union without a runtime check. Falls back to a neutral color for
 * anything unrecognized rather than throwing.
 */
function disciplineColor(discipline: WorkoutRow['discipline'], colors: ColorPalette): string {
  const sport = colors.sport as Record<string, string | undefined>;
  return sport[discipline] ?? colors.neutral[300];
}

/**
 * `workout.intensity` is a free-text label (see generatePlan.ts), not a
 * structured zone -- this just pulls a short tag out of it for
 * UpcomingList's small zone chip, e.g. "Threshold (Z4)" -> "Z4". Not a
 * personalized number (no fabricated HR/power range), just a shorter
 * echo of the same qualitative label already shown in the workout's own
 * `intensity` field.
 */
function extractZoneTag(intensity: string | null): string {
  if (!intensity) return '';
  const parenMatch = /\(([^)]+)\)/.exec(intensity);
  if (parenMatch?.[1]) return parenMatch[1];
  if (intensity.startsWith('Race-pace')) return 'Race Pace';
  return intensity;
}

function mapWorkoutToToday(workout: WorkoutRow, colors: ColorPalette): TodayWorkout {
  return {
    id: workout.id,
    type: disciplineLabel(workout.discipline),
    color: disciplineColor(workout.discipline, colors),
    title: workout.title,
    duration: formatDurationMinutes(workout.planned_duration_min ?? 0),
    tss: workout.planned_tss ?? undefined,
    description: workout.description ?? '',
  };
}

function mapWorkoutToUpcomingItem(workout: WorkoutRow, colors: ColorPalette): UpcomingWorkoutItem {
  return {
    id: workout.id,
    short: formatShortWeekday(fromIsoDate(workout.scheduled_date)),
    color: disciplineColor(workout.discipline, colors),
    title: workout.title,
    zoneLabel: extractZoneTag(workout.intensity),
    purpose: workout.description ?? '',
    duration: formatDurationMinutes(workout.planned_duration_min ?? 0),
  };
}

function buildWeekStrip(today: Date): WeekDayStatus[] {
  const weekStart = mondayOnOrBefore(today);
  const todayIso = toIsoDate(today);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const iso = toIsoDate(date);
    // "done"/"upcoming" here are calendar position only (has this date
    // passed?), not a completion signal -- there's no workout-completion
    // tracking wired into the app yet (that's Workout Detail/Training's
    // job, not Home's), so this can't honestly claim a past day's
    // session was actually done vs. missed. It only marks elapsed vs.
    // not-yet-arrived, matching this strip's own neutral (non-checkmark)
    // dot styling.
    let state: WeekDayState;
    if (iso === todayIso) state = 'today';
    else if (iso < todayIso) state = 'done';
    else state = 'upcoming';

    return {
      id: date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase(),
      letter: WEEKDAY_LETTERS[i] ?? '',
      state,
    };
  });
}

export interface HomeViewModel {
  dateLabel: string;
  athleteFirstName: string;
  /** Null when today is a rest day (no workout scheduled) but a plan exists. */
  todayWorkout: TodayWorkout | null;
  weekStrip: WeekDayStatus[];
  weekSummary: string;
  upcomingWorkouts: UpcomingWorkoutItem[];
  /** Null when there's no race/plan to count down to (e.g. a distance plan generation doesn't support yet). */
  raceCountdown: RaceCountdown | null;
}

export function buildHomeViewModel(data: HomeDashboardData, colors: ColorPalette): HomeViewModel {
  const today = new Date();

  const weekSummary = (() => {
    const totalMinutes = data.weekWorkouts.reduce(
      (sum, w) => sum + (w.planned_duration_min ?? 0),
      0,
    );
    const hours = (totalMinutes / 60).toFixed(1);
    const count = data.weekWorkouts.length;
    return `${count} session${count === 1 ? '' : 's'} · ${hours} hrs planned this week`;
  })();

  const raceCountdown = computeRaceCountdown({ race: data.race, plan: data.plan }, today);

  return {
    dateLabel: formatDateLabel(today),
    athleteFirstName: data.athleteFirstName,
    todayWorkout: data.todayWorkout ? mapWorkoutToToday(data.todayWorkout, colors) : null,
    weekStrip: buildWeekStrip(today),
    weekSummary,
    upcomingWorkouts: data.upcomingWorkouts.map((w) => mapWorkoutToUpcomingItem(w, colors)),
    raceCountdown,
  };
}

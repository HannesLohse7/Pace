/**
 * Lean types covering only what the Home Dashboard renders — not the full
 * future `Workout`/`TrainingPlan` model, which arrives with the Training
 * and Workout-detail milestones.
 */

export interface TodayWorkout {
  /**
   * Optional for the same reason `tss` is: `mockHomeData.ts` (unused by
   * any screen since the real-data wiring, but still compiled) builds a
   * `TodayWorkout` literal with no id. Always set by
   * `buildHomeViewModel.ts` for real data -- it's the real `workout.id`,
   * used to navigate to Workout Detail.
   */
  id?: string;
  type: string;
  color: string;
  title: string;
  duration: string;
  /**
   * Optional as of the real-data wiring (2026-09-01): TSS needs the
   * athlete's own threshold pace/FTP to compute honestly, which nothing
   * in onboarding collects yet (see lib/planGenerator/generatePlan.ts's
   * doc comment) — `workout.planned_tss` is null for every generated
   * workout today. TodayCard omits the TSS readout entirely when unset,
   * rather than showing a fabricated number.
   */
  tss?: number;
  description: string;
}

export type WeekDayState = 'done' | 'today' | 'upcoming';

export interface WeekDayStatus {
  id: string;
  letter: string;
  state: WeekDayState;
}

export interface UpcomingWorkoutItem {
  id: string;
  short: string;
  color: string;
  title: string;
  zoneLabel: string;
  purpose: string;
  duration: string;
}

export interface RaceCountdown {
  raceName: string;
  raceDate: string;
  daysToRace: number;
  progressPct: number;
  progressLabel: string;
}

/**
 * Lean types covering only what the Home Dashboard renders — not the full
 * future `Workout`/`TrainingPlan` model, which arrives with the Training
 * and Workout-detail milestones.
 */

export interface TodayWorkout {
  type: string;
  color: string;
  title: string;
  duration: string;
  tss: number;
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

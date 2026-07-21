/**
 * Lean types covering only what the Training week view renders this
 * checkpoint — not the full future workout-detail model (Checkpoint 2)
 * or reorder state (Checkpoint 3).
 */

export type Discipline = 'swim' | 'bike' | 'run' | 'strength' | 'rest';

/**
 * The design export's own Training tab only distinguishes "today" (row
 * highlight) and "rest day" (dimmed title) — it has no completed/missed
 * visual at all, even though the underlying mock `plan` data has a
 * `done` boolean. This type is richer than the source on purpose: the
 * checkpoint asks for a real completed/upcoming/missed status, so this
 * models the three states the source's binary flag doesn't distinguish.
 */
export type WorkoutStatus = 'completed' | 'upcoming' | 'missed';

export interface PlannedWorkout {
  /** Day id, e.g. 'mon' — matches the source's own day-id convention. */
  id: string;
  /** 3-letter day abbreviation, e.g. 'MON'. */
  short: string;
  /** Day-of-month, e.g. '13'. */
  dateNum: string;
  discipline: Discipline;
  title: string;
  duration: string;
  intensity: string;
  tss: number;
  status: WorkoutStatus;
}

export type TrainingPhaseName = 'Base' | 'Build' | 'Peak' | 'Taper';

/**
 * No source equivalent — the design export never names a training phase
 * anywhere, on Training or elsewhere. Extrapolated from Home's "27%
 * through the 16-week build" language: at ~4 of 16 weeks in, that's
 * still Base under typical triathlon periodization (roughly Base weeks
 * 1-6, Build 7-12, Peak 13-14, Taper 15-16 for a 16-week build).
 */
export interface TrainingPhaseInfo {
  name: TrainingPhaseName;
  startDate: string;
  endDate: string;
}

/**
 * Lean types covering the Training week view and its workout-detail
 * overlay (Checkpoint 2) — not reorder state (Checkpoint 3).
 */

export type Discipline = 'swim' | 'bike' | 'run' | 'strength' | 'rest';

/**
 * The design export's own Training tab only distinguishes "today" (row
 * highlight) and "rest day" (dimmed title) — it has no completed/missed
 * visual at all, even though the underlying mock `plan` data has a
 * `done` boolean. This type is richer than the source on purpose: the
 * checkpoint asks for a real completed/upcoming/missed status, so this
 * models the three states the source's binary flag doesn't distinguish.
 *
 * `'past'` was added for real data (2026-09-01): `workout.status` in the
 * schema is only ever `planned`/`completed`/`missed` (see DATABASE.md) —
 * nothing marks a `planned` workout whose date has already passed as
 * actually done or actually missed, since there's no completion
 * tracking wired up yet. Mapping a past `planned` workout to `'upcoming'`
 * would be a real bug (it would render as draggable via `isSwappable`
 * and as an undated future session), and mapping it to `'missed'` would
 * be a fabricated claim this app has no basis for. `'past'` is the
 * honest third option: "this date has passed, completion is untracked."
 */
export type WorkoutStatus = 'completed' | 'upcoming' | 'missed' | 'past';

/** A single target-zone row, e.g. { zone: 'Z4', name: 'Threshold', range: '260-275W' }. */
export interface WorkoutZone {
  zone: string;
  name: string;
  range: string;
}

export interface PlannedWorkout {
  /**
   * Day id. For the mock week this is a fixed day-of-week id, e.g.
   * 'mon'. For real data (2026-09-01) this is the real `workout.id` for
   * an actual DB row, or a synthesized `rest-<date>` id for a calendar
   * day with no scheduled workout — see `isReal` below.
   */
  id: string;
  /** 3-letter day abbreviation, e.g. 'MON'. */
  short: string;
  /** Day-of-month, e.g. '13'. */
  dateNum: string;
  discipline: Discipline;
  title: string;
  duration: string;
  intensity: string;
  /**
   * Optional as of the real-data wiring (2026-09-01): needs the
   * athlete's own threshold pace/FTP to compute honestly, which nothing
   * in onboarding collects yet — same gap as Home's `TodayWorkout.tss`
   * (see that type's own doc comment). `workout.planned_tss` is null
   * for every generated workout today.
   */
  tss?: number;
  status: WorkoutStatus;
  /**
   * Estimated calories. Optional for the same reason as `tss` above —
   * `workout.planned_calories` is null for every generated workout
   * today (no basis to fabricate one).
   */
  calories?: number;
  description: string;
  equipment: string[];
  /**
   * Warm-up/main-set/cool-down step text. Optional as of the real-data
   * wiring: these come from `workout_step` rows, which nothing writes
   * yet (`lib/planGenerator/generatePlan.ts`'s v1 only inserts the
   * `workout` row itself — see its own doc comment). Workout Detail
   * shows one honest note in place of the timeline when all three are
   * absent, rather than three literal "—" rows.
   */
  warmup?: string;
  mainset?: string;
  cooldown?: string;
  /** Present only when the workout has a heart-rate target — matches the source's `hasHR`/`hrZones` pairing. */
  hrZones?: WorkoutZone[];
  /** Present only when the workout has a power target — matches the source's `hasPower`/`powerZones` pairing. */
  powerZones?: WorkoutZone[];
  /** Present only when the workout has a pace target — matches the source's `hasPace`/`paceTarget` pairing. */
  paceTarget?: string;
  /** Present only when the workout has a cadence target — matches the source's `hasCadence`/`cadenceTarget` pairing. */
  cadenceTarget?: string;
  /**
   * True when this row is backed by a real `workout` DB row (a real id
   * that Workout Detail can look up and that drag-reorder can persist a
   * date change for). False for calendar days synthesized as "Rest Day"
   * placeholders because nothing schedules an explicit rest row — see
   * `buildTrainingViewModel.ts`. Only set (and only meaningful) by the
   * real-data view models; the mock week (`mockTrainingData.ts`, still
   * used by Coach/Progress's own mocks) doesn't set it.
   */
  isReal?: boolean;
  /**
   * The real `workout.training_plan_id` this row belongs to, when
   * `isReal` is true — needed only to attribute a manual
   * reschedule's `adaptation_event` row to the right plan (see
   * `useReorderWorkout.ts`). Undefined for synthesized placeholders.
   */
  trainingPlanId?: string | null;
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

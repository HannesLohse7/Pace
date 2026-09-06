/**
 * Coggan's Performance Manager Chart model — the standard model this
 * training-load feature implements (CTL/ATL/TSB). The `load` this file's
 * types and `computeTrainingLoad.ts` operate on is Foster's session-RPE
 * score (`actual_duration_min * perceived_effort`, see
 * `features/training/services/logWorkoutCompletion.ts`) — a 0-to-roughly-
 * 250 "TSS-like" number, not a power- or heart-rate-based TSS. There's no
 * FTP/threshold-HR pipeline anywhere in this app yet (see
 * `PlannedWorkout.tss`'s own doc comment on `workout.planned_tss` being
 * null for every generated workout today), so session-RPE is the only
 * honest source of a daily training load this app can compute. The
 * CTL/ATL/TSB recursion itself is source-agnostic — a real power-based
 * TSS pipeline could feed the same `computeTrainingLoad` later without
 * changing this shape.
 */
export interface DailyLoad {
  /** ISO 'YYYY-MM-DD'. */
  date: string;
  /** Foster session-RPE load for that day — 0 for a day with nothing logged. */
  load: number;
}

export interface TrainingLoadPoint {
  date: string;
  load: number;
  /** CTL — "fitness," a 42-day exponentially-weighted moving average of `load`. */
  ctl: number;
  /** ATL — "fatigue," a 7-day exponentially-weighted moving average of `load`. */
  atl: number;
  /** TSB — "form," the previous day's CTL minus the previous day's ATL. */
  tsb: number;
}

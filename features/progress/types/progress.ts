/**
 * Lean types covering only what the Progress screen renders — same
 * "lean, screen-scoped" approach as `features/home/types/home.ts` and
 * `features/training/types/training.ts`.
 */

export interface ProgressStat {
  label: string;
  /** Formatted display value, e.g. '52.3' or '268W' — already unit-formatted, not a raw number. */
  value: string;
  /** Formatted change vs. the prior period, e.g. '+1.8' or '-0:22'. Always rendered in the success color regardless of sign, matching the design source (every delta shown there represents an improvement). */
  delta: string;
}

export interface MileageMonth {
  /** 3-letter month label, e.g. 'JUL'. */
  label: string;
  miles: number;
}

export interface PersonalRecord {
  event: string;
  time: string;
  /** Short date label, e.g. 'Jul 8'. */
  date: string;
}

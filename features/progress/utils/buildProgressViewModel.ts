import type { ProgressData } from '../services/fetchProgress';

/** `FitnessChart`'s own `computeLinePoints` divides by `values.length - 1` -- one point alone would divide by zero. */
const MIN_FITNESS_POINTS = 2;

export interface ProgressViewModel {
  weeklyConsistency: (number | null)[];
  consistencyLabel: string;
  /** Set only once there's enough logged history to plot -- see `MIN_FITNESS_POINTS`. Undefined means "show the coming-soon note instead," not "show an empty chart." */
  weeklyFitness?: number[];
}

/**
 * `ProgressData` -> display shapes -- pure, no React, same layering as
 * `buildHomeViewModel.ts`/`buildTrainingViewModel.ts`.
 */
export function buildProgressViewModel(data: ProgressData): ProgressViewModel {
  const knownWeeks = data.weeklyConsistency.filter((value): value is number => value !== null);

  const consistencyLabel =
    knownWeeks.length > 0
      ? `Consistency · ${Math.round(knownWeeks.reduce((sum, value) => sum + value, 0) / knownWeeks.length)}% avg`
      : 'Consistency · not enough data yet';

  return {
    weeklyConsistency: data.weeklyConsistency,
    consistencyLabel,
    weeklyFitness: data.weeklyFitness.length >= MIN_FITNESS_POINTS ? data.weeklyFitness : undefined,
  };
}

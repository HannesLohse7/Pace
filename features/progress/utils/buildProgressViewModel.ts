import type { ProgressData } from '../services/fetchProgress';

export interface ProgressViewModel {
  weeklyConsistency: (number | null)[];
  consistencyLabel: string;
}

/**
 * `ProgressData` -> display shapes. Just the consistency label right
 * now (see `fetchProgress.ts` for why nothing else on this screen is
 * wired to real data yet) -- pure, no React, same layering as
 * `buildHomeViewModel.ts`/`buildTrainingViewModel.ts`.
 */
export function buildProgressViewModel(data: ProgressData): ProgressViewModel {
  const knownWeeks = data.weeklyConsistency.filter((value): value is number => value !== null);

  const consistencyLabel =
    knownWeeks.length > 0
      ? `Consistency · ${Math.round(knownWeeks.reduce((sum, value) => sum + value, 0) / knownWeeks.length)}% avg`
      : 'Consistency · not enough data yet';

  return { weeklyConsistency: data.weeklyConsistency, consistencyLabel };
}

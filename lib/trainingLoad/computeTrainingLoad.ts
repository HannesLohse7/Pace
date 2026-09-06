import type { DailyLoad, TrainingLoadPoint } from './types';

/** Standard Performance Manager Chart time constants — not exposed as a setting. */
const CTL_DAYS = 42;
const ATL_DAYS = 7;

/**
 * Coggan's Performance Manager Chart recursion. CTL and ATL are each an
 * exponentially-weighted moving average of daily training load, with
 * time constants of 42 and 7 days respectively:
 *
 *   ctl = ctl + (load - ctl) / 42
 *   atl = atl + (load - atl) / 7
 *
 * Cold-started at `ctl = atl = 0` on the first day of `dailyLoads` —
 * never backfilled with a fabricated ramp-up. A new athlete genuinely
 * has no training history in this schema before their first logged
 * completion, and starting the recursion at 0 is the honest reflection
 * of that (see `fetchTrainingLoadHistory.ts` for how the gapless input
 * series is built).
 *
 * TSB ("form") is defined as *yesterday's* CTL minus yesterday's ATL —
 * the standard model always lags TSB by one day, since today's
 * freshly-updated fitness/fatigue haven't "landed" yet. The first point
 * in the series has no "yesterday," so its TSB is 0 — which is also the
 * mathematically consistent value here, since CTL and ATL both start at
 * 0 too.
 *
 * `dailyLoads` must already be date-ordered with no gaps (one entry per
 * calendar day, `load: 0` for a rest day or an unlogged day) — this
 * function doesn't sort or fill it; that's `fetchTrainingLoadHistory.ts`'s
 * job.
 */
export function computeTrainingLoad(dailyLoads: DailyLoad[]): TrainingLoadPoint[] {
  const points: TrainingLoadPoint[] = [];
  let ctl = 0;
  let atl = 0;

  for (const { date, load } of dailyLoads) {
    const tsb = ctl - atl;
    ctl = ctl + (load - ctl) / CTL_DAYS;
    atl = atl + (load - atl) / ATL_DAYS;
    points.push({ date, load, ctl, atl, tsb });
  }

  return points;
}

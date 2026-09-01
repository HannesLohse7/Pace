/**
 * Mock data for the Progress screen, ported from `progressData`/`prs` on
 * `design/Triathlon Coach App.dc.html`'s `Component` class — same
 * athlete/build as Home's and Training's mock data (Alex Rivera, Ironman
 * Lake Placid, 16-week build).
 *
 * `fatigue` is only ever used to derive `formValue`; the source never
 * renders a fatigue line anywhere on this screen, only the fitness trend.
 *
 * The 5K PR here (19:42, Jul 8) matches Home's own `personalRecordLine`
 * ('New 5K PR · 19:42, last Tuesday') — same PR, same persona, consistent
 * with the cross-screen agreement already established between
 * `mockHomeData.ts` and `mockTrainingData.ts`.
 *
 * `consistencyLabel` is ported as the literal source string ('Consistency
 * · 94% avg'), not computed from `consistencyPct` — matching the source,
 * which hardcodes this text rather than binding it to the array (same
 * "static header label, not a live computation" pattern as Training's
 * `totalHoursLabel`/`totalTssLabel`).
 */
import { colors } from '@/shared/theme/colors';

import type { MileageMonth, PersonalRecord, ProgressStat } from '../types/progress';

const fitness = [42, 44, 45, 47, 49, 50, 52, 54, 57, 60, 64, 68];
const fatigue = [38, 45, 50, 42, 55, 48, 60, 52, 58, 65, 70, 76];

/** 12 weekly fitness (CTL-like) values, oldest first — the only series this screen actually plots. */
export const fitnessTrend = fitness;

/**
 * Fitness minus fatigue on the most recent week — the standard
 * endurance-training "form"/TSB reading. Negative here means the athlete
 * is still carrying real fatigue from a heavy training block, not
 * something wrong with the data; the source colors this red/green purely
 * by sign (`formValue >= 0 ? success : danger`), not as a value judgment.
 */
export const formValue = fitness[fitness.length - 1]! - fatigue[fatigue.length - 1]!;
export const formColor = formValue >= 0 ? colors.success : colors.danger;

export const progressStats: ProgressStat[] = [
  { label: 'VO₂ Max', value: '52.3', delta: '+1.8' },
  { label: 'FTP', value: '268W', delta: '+12W' },
  { label: 'Run Threshold Pace', value: '7:12 /mi', delta: '-0:22' },
  { label: 'Swim CSS Pace', value: '1:38 /100m', delta: '-0:04' },
];

/** 12 weekly workout-completion percentages, oldest first. */
export const consistencyPct = [100, 100, 86, 100, 100, 71, 100, 100, 86, 100, 100, 92];
export const consistencyLabel = 'Consistency · 94% avg';

export const monthlyMileage: MileageMonth[] = [
  { label: 'FEB', miles: 180 },
  { label: 'MAR', miles: 210 },
  { label: 'APR', miles: 195 },
  { label: 'MAY', miles: 240 },
  { label: 'JUN', miles: 265 },
  { label: 'JUL', miles: 290 },
];

export const personalRecords: PersonalRecord[] = [
  { event: '5K Run', time: '19:42', date: 'Jul 8' },
  { event: '10K Run', time: '41:15', date: 'May 2' },
  { event: 'Half Marathon', time: '1:34:20', date: 'Mar 16' },
  { event: 'FTP Test', time: '268W', date: 'Jun 30' },
  { event: 'CSS Swim', time: '1:38 /100m', date: 'Jun 12' },
];

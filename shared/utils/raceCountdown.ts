import { fromIsoDate } from './date';
import { formatRaceDate } from './format';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface RaceCountdownInput {
  race: { name: string; raceDate: string } | null;
  plan: { startDate: string; endDate: string; weeks: number } | null;
}

export interface RaceCountdownResult {
  raceName: string;
  raceDate: string;
  daysToRace: number;
  progressPct: number;
  progressLabel: string;
}

/**
 * Shared by Home and Training -- both show the same "next race" card
 * built from the same active plan + race, so the math (and any future
 * fix to it) only needs to live in one place. Returns null when there's
 * no race and plan to count down to yet (e.g. onboarding picked a
 * distance plan generation doesn't support -- see
 * lib/planGenerator/generatePlan.ts).
 */
export function computeRaceCountdown(
  { race, plan }: RaceCountdownInput,
  today: Date,
): RaceCountdownResult | null {
  if (!race || !plan) return null;

  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const raceDate = fromIsoDate(race.raceDate);
  const planStart = fromIsoDate(plan.startDate);
  const planEnd = fromIsoDate(plan.endDate);

  const daysToRace = Math.round((raceDate.getTime() - todayMidnight.getTime()) / MS_PER_DAY);

  const totalSpan = planEnd.getTime() - planStart.getTime();
  const elapsed = todayMidnight.getTime() - planStart.getTime();
  const progressPct =
    totalSpan > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalSpan) * 100))) : 0;

  return {
    raceName: race.name,
    raceDate: formatRaceDate(race.raceDate),
    daysToRace: Math.max(0, daysToRace),
    progressPct,
    progressLabel: `${progressPct}% through the ${plan.weeks}-week build`,
  };
}

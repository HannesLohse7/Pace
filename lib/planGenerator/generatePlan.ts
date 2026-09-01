import type { TrainingDay } from '@/shared/store';
import { toIsoDate } from '@/shared/utils/date';

/**
 * Deterministic, rule-based race plan generator — v1.
 *
 * Scope, deliberately: **Sprint and Olympic distance only**, matching
 * docs/ROADMAP.md's own sequencing ("Sprint/Olympic first, then 70.3/full
 * as templates mature"). Calling this for any other distance returns
 * `null` rather than a guessed-at plan — a 70.3/Ironman plan needs a
 * genuinely different weekly structure (longer long-days, more total
 * volume, a longer taper), not this template scaled up.
 *
 * Also deliberately out of scope for v1, and worth knowing if this file
 * gets extended: no `workout_step` (warmup/mainset/cooldown text) or
 * `workout_target_zone` (HR/power ranges) rows are produced. Generating
 * believable-looking zone numbers would need the athlete's own threshold
 * pace/FTP (`athlete_profile.ftp_watts` / `threshold_pace_sec_per_km` /
 * `css_pace_sec_per_100m`) — columns that exist in the schema but that
 * nothing in onboarding collects yet. Fabricating specific-looking
 * numbers with no real basis would be worse than leaving them out; each
 * generated workout instead carries a plain-language `description`.
 *
 * This module has no Supabase/React dependency on purpose — it's a pure
 * function of its inputs, so it's testable with a plain Node/tsx script
 * (same "verify without the app" approach the onboarding store used in
 * Milestone 1 — see useOnboardingNavigation.ts's doc comment). The
 * caller (onboarding's Generating screen) is responsible for turning the
 * returned rows into real `training_plan`/`training_phase`/`workout`
 * inserts once it has the plan's real database id.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** Caps how far back a plan is generated for a race booked far in the future — see the `warnings` entry this produces. */
const MAX_PLAN_WEEKS = 20;
const WEEKDAY_ORDER: TrainingDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export type PhaseName = 'Base' | 'Build' | 'Peak' | 'Taper';
export type GeneratableDistance = 'sprint' | 'olympic';

export interface GeneratePlanInput {
  raceDistance: string;
  /** ISO 'YYYY-MM-DD'. */
  raceDate: string;
  /** ISO 'YYYY-MM-DD' — normally "today," passed in rather than read from `Date.now()` internally so this stays a pure function of its arguments. */
  startDate: string;
  /** Onboarding's Availability step value; clamped internally to a sane [2, 20] range. */
  weeklyHours: number;
  trainingDays: TrainingDay[];
  longWorkoutDay: TrainingDay;
}

export interface GeneratedPhase {
  name: PhaseName;
  sequence: number;
  startDate: string;
  endDate: string;
}

export interface GeneratedWorkout {
  scheduledDate: string;
  discipline: 'swim' | 'bike' | 'run';
  title: string;
  plannedDurationMin: number;
  intensity: string;
  description: string;
}

export interface GeneratedPlan {
  startDate: string;
  endDate: string;
  weeks: number;
  phases: GeneratedPhase[];
  workouts: GeneratedWorkout[];
  /** Surfaced to the console today (no UI/column exists to show these to the athlete yet) — real caveats about this specific plan, not silent degradation. */
  warnings: string[];
}

function isGeneratableDistance(value: string): value is GeneratableDistance {
  return value === 'sprint' || value === 'olympic';
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number) as unknown as [number, number, number, number];
  const date = new Date(y, m - 1, d);
  // Guards against e.g. '2026-02-31' silently rolling over to March 3rd.
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function diffDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

function weekdayOf(date: Date): TrainingDay {
  // Date#getDay(): 0=Sun..6=Sat; WEEKDAY_ORDER is Mon-first.
  const index = (date.getDay() + 6) % 7;
  // WEEKDAY_ORDER has exactly 7 entries and `index` is always 0-6.
  return WEEKDAY_ORDER[index] as TrainingDay;
}

/**
 * Base 50% / Build 30% / Peak 15% / Taper 5%, each floored at 1 week
 * once there's room for all four. Below that, phases collapse in order
 * (Peak, then Base) rather than existing as a token single day — a
 * "Base phase" that's one day long isn't a real phase.
 */
function splitPhases(totalWeeks: number): { name: PhaseName; weeks: number }[] {
  if (totalWeeks <= 0) return [];
  if (totalWeeks === 1) return [{ name: 'Taper', weeks: 1 }];
  if (totalWeeks === 2)
    return [
      { name: 'Build', weeks: 1 },
      { name: 'Taper', weeks: 1 },
    ];
  if (totalWeeks === 3)
    return [
      { name: 'Build', weeks: 2 },
      { name: 'Taper', weeks: 1 },
    ];

  const taper = Math.max(1, Math.round(totalWeeks * 0.05));
  const peak = Math.max(1, Math.round(totalWeeks * 0.15));
  const build = Math.max(1, Math.round(totalWeeks * 0.3));
  const base = Math.max(1, totalWeeks - taper - peak - build);
  // Rounding (and the floors above) can leave the four no longer summing
  // to totalWeeks exactly -- fold whatever's left over into Base, the
  // phase where a week more or less matters least.
  const drift = totalWeeks - (base + build + peak + taper);
  return [
    { name: 'Base', weeks: base + drift },
    { name: 'Build', weeks: build },
    { name: 'Peak', weeks: peak },
    { name: 'Taper', weeks: taper },
  ];
}

/** Relative to `weeklyHours` -- how much of a normal week's volume this specific week should carry. */
function volumeMultiplier(
  phase: PhaseName,
  weekIndexInPhase: number,
  phaseWeeks: number,
  absoluteWeekIndex: number,
): number {
  if (phase === 'Base' || phase === 'Build') {
    // Classic 3:1 microcycle -- every 4th week is a step-back/recovery week.
    const isRecoveryWeek = (absoluteWeekIndex + 1) % 4 === 0;
    return isRecoveryWeek ? 0.7 : 1.0;
  }
  if (phase === 'Peak') return 0.85;
  // Taper: count weeks from the end of the phase -- the last one is race week.
  const weeksFromEnd = phaseWeeks - weekIndexInPhase;
  if (weeksFromEnd === 1) return 0.4;
  if (weeksFromEnd === 2) return 0.65;
  return 0.8;
}

function roundToNearest5(minutes: number): number {
  return Math.max(5, Math.round(minutes / 5) * 5);
}

interface SessionTemplate {
  discipline: 'swim' | 'bike' | 'run';
  title: string;
  intensity: string;
  description: string;
}

function longDaySession(): SessionTemplate {
  return {
    discipline: 'bike',
    title: 'Long Endurance Ride',
    intensity: 'Endurance (Z2)',
    description:
      'The week’s longest single session -- builds aerobic durability plus race-day fueling and pacing practice for the bike leg.',
  };
}

function qualitySession(discipline: 'swim' | 'bike' | 'run'): SessionTemplate {
  const byDiscipline: Record<'swim' | 'bike' | 'run', SessionTemplate> = {
    swim: {
      discipline: 'swim',
      title: 'Swim Threshold Set',
      intensity: 'Threshold (Z4)',
      description: 'Race-pace interval set to build swim fitness and pacing control.',
    },
    bike: {
      discipline: 'bike',
      title: 'Bike Threshold Session',
      intensity: 'Threshold (Z4)',
      description:
        'Race-specific threshold intervals to build sustainable power at race-pace effort.',
    },
    run: {
      discipline: 'run',
      title: 'Run Threshold Session',
      intensity: 'Threshold (Z4)',
      description: 'Sustained tempo effort at race-pace to build running economy under fatigue.',
    },
  };
  return byDiscipline[discipline];
}

function easySession(discipline: 'swim' | 'bike' | 'run'): SessionTemplate {
  const byDiscipline: Record<'swim' | 'bike' | 'run', SessionTemplate> = {
    swim: {
      discipline: 'swim',
      title: 'Swim Technique + Endurance',
      intensity: 'Easy-Moderate',
      description: 'Stroke technique work plus steady aerobic swimming.',
    },
    bike: {
      discipline: 'bike',
      title: 'Easy Recovery Ride',
      intensity: 'Easy (Z1-Z2)',
      description: 'Active recovery spin to keep the legs moving without adding fatigue.',
    },
    run: {
      discipline: 'run',
      title: 'Easy Recovery Run',
      intensity: 'Easy (Z1-Z2)',
      description: 'Active recovery and blood flow between harder sessions.',
    },
  };
  return byDiscipline[discipline];
}

function taperTuneUpSession(discipline: 'swim' | 'bike' | 'run'): SessionTemplate {
  const label = discipline === 'swim' ? 'Swim' : discipline === 'bike' ? 'Bike' : 'Run';
  return {
    discipline,
    title: `${label} Race-Pace Tune-Up`,
    intensity: 'Race-pace, short',
    description:
      'A short, sharp touch of race effort to stay sharp without adding fatigue this close to race day.',
  };
}

export function generateTrainingPlan(input: GeneratePlanInput): GeneratedPlan | null {
  if (!isGeneratableDistance(input.raceDistance)) return null;

  const start = parseIsoDate(input.startDate);
  const race = parseIsoDate(input.raceDate);
  if (!start || !race || race <= start) return null;
  if (input.trainingDays.length === 0) return null;

  const weeklyHours = Math.min(20, Math.max(2, input.weeklyHours));
  const warnings: string[] = [];

  const rawDays = diffDays(start, race);
  const rawWeeks = Math.ceil((rawDays + 1) / 7);
  const totalWeeks = Math.min(Math.max(rawWeeks, 1), MAX_PLAN_WEEKS);

  if (rawWeeks < 4) {
    warnings.push(
      `Race is only ${rawWeeks} week(s) away -- this plan is compressed and skips a dedicated Base phase.`,
    );
  }
  if (rawWeeks > MAX_PLAN_WEEKS) {
    warnings.push(
      `Race is ${rawWeeks} weeks away -- generating only the final ${MAX_PLAN_WEEKS} weeks; earlier weeks are left unplanned for now.`,
    );
  }

  const planStart = rawWeeks > MAX_PLAN_WEEKS ? addDays(race, -(totalWeeks * 7 - 1)) : start;

  const phaseSplit = splitPhases(totalWeeks);
  const phases: GeneratedPhase[] = [];
  const weekPhase: { phase: PhaseName; indexInPhase: number; phaseWeeks: number }[] = [];
  let weekCursor = 0;
  phaseSplit.forEach((entry, sequence) => {
    const phaseStart = addDays(planStart, weekCursor * 7);
    const phaseEndWeekIndex = weekCursor + entry.weeks - 1;
    const isLastPhase = sequence === phaseSplit.length - 1;
    const phaseEnd = isLastPhase ? race : addDays(planStart, phaseEndWeekIndex * 7 + 6);
    phases.push({
      name: entry.name,
      sequence,
      startDate: toIsoDate(phaseStart),
      endDate: toIsoDate(phaseEnd),
    });
    for (let i = 0; i < entry.weeks; i++) {
      weekPhase.push({ phase: entry.name, indexInPhase: i, phaseWeeks: entry.weeks });
    }
    weekCursor += entry.weeks;
  });

  const trainingDaySet = new Set(input.trainingDays);
  const hasLongDay = trainingDaySet.has(input.longWorkoutDay);
  // Rotates which non-long training day gets which discipline, carried
  // across the whole plan (not reset per week) so e.g. "swim" doesn't
  // land on the same weekday every single week. Two separate rotations,
  // not one: a week that already has a long bike day only alternates its
  // other days between swim/run -- otherwise bike would get both the
  // long day AND a regular turn in the rotation, leaving it trained
  // roughly twice as often as swim or run instead of a balanced split.
  // A week with no long day (the athlete's chosen long day isn't one of
  // their training days) falls back to the full 3-way rotation so bike
  // still gets covered somewhere.
  const rotationWithLongDay: ('swim' | 'run')[] = ['swim', 'run'];
  const rotationWithoutLongDay: ('swim' | 'bike' | 'run')[] = ['swim', 'run', 'bike'];
  let rotationCursorWithLongDay = 0;
  let rotationCursorWithoutLongDay = 0;

  const workouts: GeneratedWorkout[] = [];

  for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex++) {
    const weekMeta = weekPhase[weekIndex];
    if (!weekMeta) continue;
    const weekStart = addDays(planStart, weekIndex * 7);
    const weekDates: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(weekStart, d);
      // Never schedules a normal training day on or after race day itself.
      if (date >= race) break;
      if (date < start) continue;
      if (trainingDaySet.has(weekdayOf(date))) weekDates.push(date);
    }
    if (weekDates.length === 0) continue;

    const multiplier = volumeMultiplier(
      weekMeta.phase,
      weekMeta.indexInPhase,
      weekMeta.phaseWeeks,
      weekIndex,
    );
    const weekMinutes = weeklyHours * 60 * multiplier;
    const isFinalTaperWeek =
      weekMeta.phase === 'Taper' && weekMeta.indexInPhase === weekMeta.phaseWeeks - 1;

    const longDate = weekDates.find((date) => weekdayOf(date) === input.longWorkoutDay);
    const otherDates = weekDates.filter((date) => date !== longDate);

    const longShareMinutes =
      hasLongDay && longDate ? roundToNearest5(Math.max(45, weekMinutes * 0.35)) : 0;
    const remainingMinutes = Math.max(0, weekMinutes - longShareMinutes);
    const perOtherDayMinutes =
      otherDates.length > 0 ? roundToNearest5(remainingMinutes / otherDates.length) : 0;

    if (longDate) {
      const template = longDaySession();
      workouts.push({
        scheduledDate: toIsoDate(longDate),
        discipline: template.discipline,
        title: template.title,
        plannedDurationMin: longShareMinutes,
        intensity: template.intensity,
        description: template.description,
      });
    }

    otherDates.forEach((date, i) => {
      let discipline: 'swim' | 'bike' | 'run';
      if (longDate) {
        discipline = rotationWithLongDay[rotationCursorWithLongDay % rotationWithLongDay.length] as
          'swim' | 'run';
        rotationCursorWithLongDay++;
      } else {
        discipline = rotationWithoutLongDay[
          rotationCursorWithoutLongDay % rotationWithoutLongDay.length
        ] as 'swim' | 'bike' | 'run';
        rotationCursorWithoutLongDay++;
      }

      const isQualityDay =
        i === 0 && (weekMeta.phase === 'Build' || weekMeta.phase === 'Peak') && !isFinalTaperWeek;

      let template: SessionTemplate;
      if (isFinalTaperWeek && i === 0) {
        template = taperTuneUpSession(discipline);
      } else if (isQualityDay) {
        template = qualitySession(discipline);
      } else {
        template = easySession(discipline);
      }

      workouts.push({
        scheduledDate: toIsoDate(date),
        discipline: template.discipline,
        title: template.title,
        plannedDurationMin: perOtherDayMinutes,
        intensity: template.intensity,
        description: template.description,
      });
    });
  }

  return {
    startDate: toIsoDate(planStart),
    endDate: toIsoDate(race),
    weeks: totalWeeks,
    phases,
    workouts,
    warnings,
  };
}

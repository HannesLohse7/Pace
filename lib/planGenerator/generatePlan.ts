import type { TrainingDay } from '@/shared/store';
import { toIsoDate } from '@/shared/utils/date';

/**
 * Deterministic, rule-based race plan generator.
 *
 * Covers the four standard triathlon distances. Sprint and Olympic use the
 * original v1 template unchanged. 70.3 and Ironman ("long course") use a
 * different weekly structure rather than that template scaled up -- see
 * `DISTANCE_PROFILES` and `LongCourseProfile` below for exactly what
 * differs and why. Any other distance (`'other'`, i.e. onboarding's
 * "Custom") returns `null` rather than a guessed-at plan.
 *
 * Still deliberately out of scope, and worth knowing if this file gets
 * extended: no `workout_step` (warmup/mainset/cooldown text) or
 * `workout_target_zone` (HR/power ranges) rows are produced. Generating
 * believable-looking zone numbers would need the athlete's own threshold
 * pace/FTP (`athlete_profile.ftp_watts` / `threshold_pace_sec_per_km` /
 * `css_pace_sec_per_100m`) -- columns that exist in the schema but that
 * nothing in onboarding collects yet. Fabricating specific-looking
 * numbers with no real basis would be worse than leaving them out; each
 * generated workout instead carries a plain-language `description`.
 * There is also no post-race Recovery phase: `training_phase.name` is
 * CHECK-constrained to Base/Build/Peak/Taper, so adding one is a schema
 * migration first.
 *
 * This module has no Supabase/React dependency on purpose -- it's a pure
 * function of its inputs, covered by `__tests__/generatePlan.test.ts`
 * (`npm test`). The caller (onboarding's Generating screen) is
 * responsible for turning the returned rows into real
 * `training_plan`/`training_phase`/`workout` inserts once it has the
 * plan's real database id.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WEEKDAY_ORDER: TrainingDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export type PhaseName = 'Base' | 'Build' | 'Peak' | 'Taper';
export type GeneratableDistance = 'sprint' | 'olympic' | '70.3' | 'ironman';

/**
 * What makes a 70.3/Ironman week structurally different from a
 * Sprint/Olympic one. Every number here is a conservative, widely used
 * coaching convention, not something derived from this athlete's data:
 *
 * - A weekly long run alongside the long ride. Short-course plans get by
 *   on one long session; long-course racing needs durability in both.
 * - Hard caps on both long sessions. Past these, extra time adds injury
 *   and recovery cost faster than fitness, so the surplus goes to the
 *   week's other sessions instead.
 * - A fixed, longer taper instead of 5% of the plan.
 * - A volume ramp over the opening weeks (see `volumeMultiplier`), so an
 *   athlete is never handed their full stated hours in week one.
 * - A short run off the bike ("brick") folded into the long ride during
 *   Build and Peak.
 */
interface LongCourseProfile {
  taperWeeks: number;
  longRideCapMin: number;
  longRunShare: number;
  longRunCapMin: number;
  /** Caps for the week's ordinary (non-long) sessions, by discipline. */
  sessionCapMin: Record<'swim' | 'bike' | 'run', number>;
  /** Below this, a plan is still generated, with a warning -- the athlete's availability is theirs to set. */
  advisedMinWeeklyHours: number;
  advisedMinWeeks: number;
}

interface DistanceProfile {
  label: string;
  /** Caps how far back a plan is generated for a race booked far in the future -- see the `warnings` entry this produces. */
  maxPlanWeeks: number;
  longRideShare: number;
  longRideFloorMin: number;
  longCourse: LongCourseProfile | null;
}

const DISTANCE_PROFILES: Record<GeneratableDistance, DistanceProfile> = {
  sprint: {
    label: 'Sprint',
    maxPlanWeeks: 20,
    longRideShare: 0.35,
    longRideFloorMin: 45,
    longCourse: null,
  },
  olympic: {
    label: 'Olympic',
    maxPlanWeeks: 20,
    longRideShare: 0.35,
    longRideFloorMin: 45,
    longCourse: null,
  },
  '70.3': {
    label: '70.3',
    maxPlanWeeks: 24,
    longRideShare: 0.35,
    longRideFloorMin: 60,
    longCourse: {
      taperWeeks: 2,
      longRideCapMin: 240,
      longRunShare: 0.2,
      longRunCapMin: 120,
      sessionCapMin: { swim: 75, bike: 120, run: 60 },
      advisedMinWeeklyHours: 6,
      advisedMinWeeks: 12,
    },
  },
  ironman: {
    label: 'Ironman',
    maxPlanWeeks: 30,
    longRideShare: 0.4,
    longRideFloorMin: 60,
    longCourse: {
      taperWeeks: 3,
      longRideCapMin: 360,
      longRunShare: 0.2,
      longRunCapMin: 150,
      sessionCapMin: { swim: 90, bike: 150, run: 75 },
      advisedMinWeeklyHours: 9,
      advisedMinWeeks: 16,
    },
  },
};

/** Opening-weeks volume ramp for long-course plans: start at 70% of the athlete's stated hours and add 5 points a week. */
const RAMP_START = 0.7;
const RAMP_STEP_PER_WEEK = 0.05;
/** Long-course race week: every session is short, and the day before the race is left free. */
const RACE_WEEK_SESSION_CAP_MIN = 45;
/** How much of the long-session caps survives in each taper week, counted back from race week (index 0 is unused -- race week has no long sessions). */
const TAPER_LONG_SESSION_SCALE = [0, 0.5, 0.75];
/** A full-volume week has to fall this far short of the athlete's hours before it's worth a warning -- smaller gaps are just rounding against the session caps. */
const UNUSED_WARNING_SHARE = 0.15;
/** Long-course rotation for the days left after the long ride and long run: leans toward the swim, with one bike and one run turn in every four. */
const LONG_COURSE_ROTATION: ('swim' | 'bike' | 'run')[] = ['swim', 'bike', 'swim', 'run'];

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
  return Object.prototype.hasOwnProperty.call(DISTANCE_PROFILES, value);
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

/**
 * Long-course phase split: the taper is a fixed length (never more than a
 * third of the plan), and what's left is divided Base / Build 35% /
 * Peak 15%. Plans of three weeks or fewer fall back to `splitPhases`'
 * own collapse rules -- there's no room for a distance-specific taper.
 */
function splitLongCoursePhases(
  totalWeeks: number,
  taperWeeks: number,
): { name: PhaseName; weeks: number }[] {
  if (totalWeeks <= 3) return splitPhases(totalWeeks);

  const taper = Math.max(1, Math.min(taperWeeks, Math.floor(totalWeeks / 3)));
  const remaining = totalWeeks - taper;
  const peak = Math.max(1, Math.round(remaining * 0.15));
  const build = Math.max(1, Math.round(remaining * 0.35));
  const base = remaining - peak - build;

  // `remaining` is at least 3 here (the taper never takes more than a
  // third of a 4+ week plan), so all three always get at least one week.
  return [
    { name: 'Base', weeks: base },
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
  rampsUp: boolean,
): number {
  if (phase === 'Base' || phase === 'Build') {
    // Classic 3:1 microcycle -- every 4th week is a step-back/recovery week.
    const isRecoveryWeek = (absoluteWeekIndex + 1) % 4 === 0;
    // Long-course only: ease into the athlete's stated hours over the
    // opening weeks instead of starting at 100% on day one.
    const ramp = rampsUp ? Math.min(1, RAMP_START + RAMP_STEP_PER_WEEK * absoluteWeekIndex) : 1.0;
    return isRecoveryWeek ? 0.7 * ramp : ramp;
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

function longRideWithBrickSession(): SessionTemplate {
  return {
    discipline: 'bike',
    title: 'Long Ride + Brick Run',
    intensity: 'Endurance (Z2)',
    description:
      'The week’s longest ride, finishing with an easy 15-20 minute run straight off the bike (included in this session’s time) -- practice for fueling, pacing, and running on tired legs.',
  };
}

function longRunSession(): SessionTemplate {
  return {
    discipline: 'run',
    title: 'Long Endurance Run',
    intensity: 'Endurance (Z2)',
    description:
      'The week’s longest run, at an easy conversational effort -- builds the durability the run leg needs without the recovery cost of running it hard.',
  };
}

/**
 * Where the weekly long run goes: the day after the long ride when that's
 * a training day (the usual weekend pairing, and useful practice running
 * on tired legs), otherwise whichever training day sits furthest from it.
 */
function pickLongRunDate(longDate: Date, otherDates: Date[]): Date | undefined {
  if (otherDates.length === 0) return undefined;
  const dayAfter = otherDates.find((date) => diffDays(longDate, date) === 1);
  if (dayAfter) return dayAfter;
  return otherDates.reduce((furthest, date) =>
    Math.abs(diffDays(longDate, date)) > Math.abs(diffDays(longDate, furthest)) ? date : furthest,
  );
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

interface LongCourseWeekInput {
  /** This week's training dates, in order, already limited to before race day. */
  weekDates: Date[];
  race: Date;
  weekMinutes: number;
  phase: PhaseName;
  /** 1 for race week, 2 for the week before, and so on. */
  weeksFromRace: number;
  longWorkoutDay: TrainingDay;
  profile: DistanceProfile;
  longCourse: LongCourseProfile;
  rotationCursor: number;
}

interface LongCourseWeek {
  workouts: GeneratedWorkout[];
  rotationCursor: number;
  /** Minutes of the week's target that no session could usefully absorb. */
  unusedMinutes: number;
}

function toWorkout(date: Date, template: SessionTemplate, minutes: number): GeneratedWorkout {
  return {
    scheduledDate: toIsoDate(date),
    discipline: template.discipline,
    title: template.title,
    plannedDurationMin: minutes,
    intensity: template.intensity,
    description: template.description,
  };
}

/**
 * One 70.3/Ironman week. Kept separate from the Sprint/Olympic path in
 * `generateTrainingPlan` rather than threaded through it, so that path's
 * output stays exactly what it was.
 *
 * Order of allocation: long ride, then long run, then the remaining days
 * share what's left equally, each capped by discipline. Whatever the caps
 * leave over tops up an ordinary bike session (the discipline where extra
 * easy time costs least); anything still left is reported as unused
 * rather than padded onto a session that shouldn't be that long.
 */
function buildLongCourseWeek(input: LongCourseWeekInput): LongCourseWeek {
  const { weekDates, race, weekMinutes, phase, weeksFromRace, profile, longCourse } = input;
  let rotationCursor = input.rotationCursor;
  const nextDiscipline = (): 'swim' | 'bike' | 'run' => {
    const discipline = LONG_COURSE_ROTATION[rotationCursor % LONG_COURSE_ROTATION.length] as
      'swim' | 'bike' | 'run';
    rotationCursor++;
    return discipline;
  };

  if (weeksFromRace === 1) {
    const dates = weekDates.filter((date) => diffDays(date, race) > 1);
    if (dates.length === 0) return { workouts: [], rotationCursor, unusedMinutes: 0 };
    const minutes = Math.min(
      RACE_WEEK_SESSION_CAP_MIN,
      roundToNearest5(weekMinutes / dates.length),
    );
    const workouts = dates.map((date, i) => {
      const discipline = nextDiscipline();
      return toWorkout(
        date,
        i === 0 ? taperTuneUpSession(discipline) : easySession(discipline),
        minutes,
      );
    });
    return { workouts, rotationCursor, unusedMinutes: 0 };
  }

  const longSessionScale =
    phase === 'Taper' ? (TAPER_LONG_SESSION_SCALE[weeksFromRace - 1] ?? 1) : 1;
  const longDate = weekDates.find((date) => weekdayOf(date) === input.longWorkoutDay);
  const datesBesidesLongRide = weekDates.filter((date) => date !== longDate);
  const longRunDate = longDate ? pickLongRunDate(longDate, datesBesidesLongRide) : undefined;
  const otherDates = datesBesidesLongRide.filter((date) => date !== longRunDate);

  const longRideCap = longCourse.longRideCapMin * longSessionScale;
  const longRideMinutes = longDate
    ? Math.min(longRideCap, Math.max(profile.longRideFloorMin, weekMinutes * profile.longRideShare))
    : 0;
  const longRunMinutes = longRunDate
    ? Math.min(
        longCourse.longRunCapMin * longSessionScale,
        Math.max(40, weekMinutes * longCourse.longRunShare),
      )
    : 0;

  const others = otherDates.map((date) => ({ date, discipline: nextDiscipline(), minutes: 0 }));
  let leftover = Math.max(0, weekMinutes - longRideMinutes - longRunMinutes);
  const evenShare = others.length > 0 ? leftover / others.length : 0;
  for (const session of others) {
    session.minutes = Math.min(longCourse.sessionCapMin[session.discipline], evenShare);
    leftover -= session.minutes;
  }
  for (const session of others) {
    if (session.discipline !== 'bike') continue;
    const topUp = Math.min(leftover, longCourse.sessionCapMin.bike - session.minutes);
    session.minutes += topUp;
    leftover -= topUp;
  }
  const workouts: GeneratedWorkout[] = [];
  if (longDate) {
    const includesBrick = phase === 'Build' || phase === 'Peak';
    workouts.push(
      toWorkout(
        longDate,
        includesBrick ? longRideWithBrickSession() : longDaySession(),
        roundToNearest5(longRideMinutes),
      ),
    );
  }
  if (longRunDate) {
    workouts.push(toWorkout(longRunDate, longRunSession(), roundToNearest5(longRunMinutes)));
  }
  others.forEach((session, i) => {
    const isQualityDay = i === 0 && (phase === 'Build' || phase === 'Peak');
    workouts.push(
      toWorkout(
        session.date,
        isQualityDay ? qualitySession(session.discipline) : easySession(session.discipline),
        roundToNearest5(session.minutes),
      ),
    );
  });

  return { workouts, rotationCursor, unusedMinutes: leftover };
}

export function generateTrainingPlan(input: GeneratePlanInput): GeneratedPlan | null {
  if (!isGeneratableDistance(input.raceDistance)) return null;

  const start = parseIsoDate(input.startDate);
  const race = parseIsoDate(input.raceDate);
  if (!start || !race || race <= start) return null;
  if (input.trainingDays.length === 0) return null;

  const profile = DISTANCE_PROFILES[input.raceDistance];
  const longCourse = profile.longCourse;
  const maxPlanWeeks = profile.maxPlanWeeks;

  const weeklyHours = Math.min(20, Math.max(2, input.weeklyHours));
  const warnings: string[] = [];

  const rawDays = diffDays(start, race);
  const rawWeeks = Math.ceil((rawDays + 1) / 7);
  const totalWeeks = Math.min(Math.max(rawWeeks, 1), maxPlanWeeks);

  if (longCourse && rawWeeks >= 4 && rawWeeks < longCourse.advisedMinWeeks) {
    warnings.push(
      `Race is ${rawWeeks} weeks away -- shorter than the ${longCourse.advisedMinWeeks}+ weeks usually advised for ${profile.label}. This plan assumes existing endurance fitness.`,
    );
  }
  if (longCourse && weeklyHours < longCourse.advisedMinWeeklyHours) {
    warnings.push(
      `${weeklyHours} hours a week is below the ${longCourse.advisedMinWeeklyHours}+ usually advised for ${profile.label}. The plan is built to that availability; long sessions will be shorter than race demands.`,
    );
  }

  if (rawWeeks < 4) {
    warnings.push(
      `Race is only ${rawWeeks} week(s) away -- this plan is compressed and skips a dedicated Base phase.`,
    );
  }
  if (rawWeeks > maxPlanWeeks) {
    warnings.push(
      `Race is ${rawWeeks} weeks away -- generating only the final ${maxPlanWeeks} weeks; earlier weeks are left unplanned for now.`,
    );
  }

  const planStart = rawWeeks > maxPlanWeeks ? addDays(race, -(totalWeeks * 7 - 1)) : start;

  const phaseSplit = longCourse
    ? splitLongCoursePhases(totalWeeks, longCourse.taperWeeks)
    : splitPhases(totalWeeks);
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
  let rotationCursorLongCourse = 0;
  let hasUnusableHours = false;
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
      longCourse !== null,
    );
    const weekMinutes = weeklyHours * 60 * multiplier;
    const isFinalTaperWeek =
      weekMeta.phase === 'Taper' && weekMeta.indexInPhase === weekMeta.phaseWeeks - 1;

    if (longCourse) {
      const week = buildLongCourseWeek({
        weekDates,
        race,
        weekMinutes,
        phase: weekMeta.phase,
        weeksFromRace: totalWeeks - weekIndex,
        longWorkoutDay: input.longWorkoutDay,
        profile,
        longCourse,
        rotationCursor: rotationCursorLongCourse,
      });
      workouts.push(...week.workouts);
      rotationCursorLongCourse = week.rotationCursor;
      // Only worth telling the athlete about in a full-volume week -- a
      // recovery or taper week is under their hours on purpose.
      if (multiplier === 1 && week.unusedMinutes >= weekMinutes * UNUSED_WARNING_SHARE) {
        hasUnusableHours = true;
      }
      continue;
    }

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

  if (hasUnusableHours) {
    warnings.push(
      `${weeklyHours} hours a week is more than ${input.trainingDays.length} training day(s) can usefully hold at this distance -- some weeks are planned below that. Adding a training day would use the time better than longer sessions.`,
    );
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

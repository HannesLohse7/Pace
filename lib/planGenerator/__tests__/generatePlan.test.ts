import { describe, expect, it } from 'vitest';

import { fromIsoDate } from '@/shared/utils/date';

import { generateTrainingPlan, type GeneratePlanInput } from '../generatePlan';

const baseInput: GeneratePlanInput = {
  raceDistance: 'olympic',
  raceDate: '2027-06-13',
  startDate: '2027-03-01',
  weeklyHours: 9,
  trainingDays: ['mon', 'wed', 'fri', 'sat', 'sun'],
  longWorkoutDay: 'sat',
};

function minutesByWeek(
  startDate: string,
  workouts: { scheduledDate: string; plannedDurationMin: number }[],
): number[] {
  const start = fromIsoDate(startDate).getTime();
  const totals: number[] = [];
  for (const workout of workouts) {
    const days = Math.round((fromIsoDate(workout.scheduledDate).getTime() - start) / 86_400_000);
    const week = Math.floor(days / 7);
    totals[week] = (totals[week] ?? 0) + workout.plannedDurationMin;
  }
  return Array.from(totals, (value) => value ?? 0);
}

describe('generateTrainingPlan — input handling', () => {
  it('returns null for a distance with no template', () => {
    expect(generateTrainingPlan({ ...baseInput, raceDistance: 'other' })).toBeNull();
  });

  it('returns null when the race is not after the start date', () => {
    expect(generateTrainingPlan({ ...baseInput, raceDate: baseInput.startDate })).toBeNull();
    expect(generateTrainingPlan({ ...baseInput, raceDate: '2027-02-01' })).toBeNull();
  });

  it('returns null for malformed or impossible dates', () => {
    expect(generateTrainingPlan({ ...baseInput, raceDate: '2027-02-31' })).toBeNull();
    expect(generateTrainingPlan({ ...baseInput, startDate: 'March 1' })).toBeNull();
  });

  it('returns null with no training days', () => {
    expect(generateTrainingPlan({ ...baseInput, trainingDays: [] })).toBeNull();
  });
});

describe('generateTrainingPlan — Olympic, 15 weeks', () => {
  const plan = generateTrainingPlan(baseInput);

  it('produces a plan ending on race day', () => {
    expect(plan).not.toBeNull();
    expect(plan?.startDate).toBe('2027-03-01');
    expect(plan?.endDate).toBe('2027-06-13');
    expect(plan?.weeks).toBe(15);
    expect(plan?.warnings).toEqual([]);
  });

  it('orders phases Base → Build → Peak → Taper, contiguous, covering the whole plan', () => {
    const phases = plan?.phases ?? [];
    expect(phases.map((phase) => phase.name)).toEqual(['Base', 'Build', 'Peak', 'Taper']);
    expect(phases[0]?.startDate).toBe(plan?.startDate);
    expect(phases.at(-1)?.endDate).toBe(plan?.endDate);
    for (let i = 1; i < phases.length; i++) {
      const previousEnd = fromIsoDate(phases[i - 1]?.endDate ?? '');
      const nextStart = fromIsoDate(phases[i]?.startDate ?? '');
      expect(Math.round((nextStart.getTime() - previousEnd.getTime()) / 86_400_000)).toBe(1);
    }
  });

  it('only schedules on chosen training days, never on or after race day', () => {
    const allowed = new Set([1, 3, 5, 6, 0]); // Date#getDay() for mon/wed/fri/sat/sun
    for (const workout of plan?.workouts ?? []) {
      expect(allowed.has(fromIsoDate(workout.scheduledDate).getDay())).toBe(true);
      expect(workout.scheduledDate < '2027-06-13').toBe(true);
      expect(workout.scheduledDate >= '2027-03-01').toBe(true);
    }
  });

  it('covers all three disciplines', () => {
    const disciplines = new Set(plan?.workouts.map((workout) => workout.discipline));
    expect(disciplines).toEqual(new Set(['swim', 'bike', 'run']));
  });

  it('never plans more than the requested weekly hours (within rounding)', () => {
    const totals = minutesByWeek('2027-03-01', plan?.workouts ?? []);
    for (const total of totals) {
      // Each session rounds to the nearest 5 minutes; 5 sessions/week.
      expect(total).toBeLessThanOrEqual(9 * 60 + 5 * 5);
    }
  });

  it('steps back every fourth week during Base and Build', () => {
    const totals = minutesByWeek('2027-03-01', plan?.workouts ?? []);
    expect(totals[3]).toBeLessThan(totals[2] ?? 0);
    expect(totals[7]).toBeLessThan(totals[6] ?? 0);
  });

  it('makes race week the lightest week of the plan', () => {
    const totals = minutesByWeek('2027-03-01', plan?.workouts ?? []);
    const raceWeek = totals.at(-1) ?? 0;
    for (const total of totals.slice(0, -1)) expect(raceWeek).toBeLessThan(total);
  });

  it('is deterministic', () => {
    expect(generateTrainingPlan(baseInput)).toEqual(plan);
  });

  it('matches the recorded plan', () => {
    expect(plan).toMatchSnapshot();
  });
});

describe('generateTrainingPlan — Sprint', () => {
  it('matches the recorded plan', () => {
    expect(
      generateTrainingPlan({
        ...baseInput,
        raceDistance: 'sprint',
        raceDate: '2027-04-25',
        weeklyHours: 5,
        trainingDays: ['tue', 'thu', 'sat'],
        longWorkoutDay: 'sat',
      }),
    ).toMatchSnapshot();
  });
});

describe('generateTrainingPlan — edge cases', () => {
  it('warns and skips Base when the race is under four weeks away', () => {
    const plan = generateTrainingPlan({ ...baseInput, raceDate: '2027-03-14' });
    expect(plan?.phases.map((phase) => phase.name)).toEqual(['Build', 'Taper']);
    expect(plan?.warnings).toHaveLength(1);
  });

  it('caps a far-off Olympic race at 20 weeks and says so', () => {
    const plan = generateTrainingPlan({ ...baseInput, raceDate: '2027-12-12' });
    expect(plan?.weeks).toBe(20);
    expect(plan?.endDate).toBe('2027-12-12');
    expect(plan?.warnings).toHaveLength(1);
  });

  it('clamps weekly hours into the supported range', () => {
    const tiny = generateTrainingPlan({ ...baseInput, weeklyHours: 0 });
    const huge = generateTrainingPlan({ ...baseInput, weeklyHours: 99 });
    const tinyPeak = Math.max(...minutesByWeek('2027-03-01', tiny?.workouts ?? []));
    const hugePeak = Math.max(...minutesByWeek('2027-03-01', huge?.workouts ?? []));
    expect(tinyPeak).toBeGreaterThan(0);
    expect(hugePeak).toBeLessThanOrEqual(20 * 60 + 5 * 5);
  });

  it('still trains the bike when the long day is not a training day', () => {
    const plan = generateTrainingPlan({
      ...baseInput,
      trainingDays: ['mon', 'wed', 'fri'],
      longWorkoutDay: 'sat',
    });
    expect(plan?.workouts.some((workout) => workout.discipline === 'bike')).toBe(true);
  });
});

const longCourseInput: GeneratePlanInput = {
  raceDistance: '70.3',
  raceDate: '2027-06-13',
  startDate: '2027-01-04',
  weeklyHours: 10,
  trainingDays: ['mon', 'tue', 'thu', 'sat', 'sun'],
  longWorkoutDay: 'sat',
};

const ironmanInput: GeneratePlanInput = {
  ...longCourseInput,
  raceDistance: 'ironman',
  raceDate: '2027-08-22',
  weeklyHours: 14,
};

describe.each([
  ['70.3', longCourseInput, { taperWeeks: 2, rideCap: 240, runCap: 120, swimCap: 75 }],
  ['Ironman', ironmanInput, { taperWeeks: 3, rideCap: 360, runCap: 150, swimCap: 90 }],
] as const)('generateTrainingPlan — %s', (_label, input, expected) => {
  const plan = generateTrainingPlan(input);
  const workouts = plan?.workouts ?? [];
  const planStart = plan?.startDate ?? '';
  const totals = minutesByWeek(planStart, workouts);

  it('produces a plan ending on race day with all four phases', () => {
    expect(plan).not.toBeNull();
    expect(plan?.endDate).toBe(input.raceDate);
    expect(plan?.phases.map((phase) => phase.name)).toEqual(['Base', 'Build', 'Peak', 'Taper']);
  });

  it('uses the distance’s own taper length', () => {
    const taper = plan?.phases.at(-1);
    const days =
      Math.round(
        (fromIsoDate(taper?.endDate ?? '').getTime() -
          fromIsoDate(taper?.startDate ?? '').getTime()) /
          86_400_000,
      ) + 1;
    expect(days).toBe(expected.taperWeeks * 7);
  });

  it('schedules a long ride and a long run in every week before race week', () => {
    const raceWeekStart = toIsoDateOffset(input.raceDate, -6);
    for (let week = 0; week < totals.length - 1; week++) {
      const from = toIsoDateOffset(planStart, week * 7);
      const to = toIsoDateOffset(planStart, week * 7 + 6);
      const inWeek = workouts.filter(
        (workout) => workout.scheduledDate >= from && workout.scheduledDate <= to,
      );
      expect(inWeek.filter((workout) => workout.title.startsWith('Long')).length).toBe(2);
      expect(to < raceWeekStart || week === totals.length - 2).toBe(true);
    }
  });

  it('puts the long run the day after the long ride when that is a training day', () => {
    const longRuns = workouts.filter((workout) => workout.title === 'Long Endurance Run');
    expect(longRuns.length).toBeGreaterThan(0);
    for (const run of longRuns) expect(fromIsoDate(run.scheduledDate).getDay()).toBe(0);
  });

  it('never exceeds the long-session and swim caps', () => {
    for (const workout of workouts) {
      if (workout.discipline === 'bike') {
        expect(workout.plannedDurationMin).toBeLessThanOrEqual(expected.rideCap);
      }
      if (workout.discipline === 'run') {
        expect(workout.plannedDurationMin).toBeLessThanOrEqual(expected.runCap);
      }
      if (workout.discipline === 'swim') {
        expect(workout.plannedDurationMin).toBeLessThanOrEqual(expected.swimCap);
      }
    }
  });

  it('never plans more than the stated weekly hours', () => {
    for (const total of totals) {
      expect(total).toBeLessThanOrEqual(input.weeklyHours * 60 + 5 * 5);
    }
  });

  it('starts below full volume and never jumps more than 20% past any earlier week', () => {
    expect(totals[0]).toBeLessThanOrEqual(input.weeklyHours * 60 * 0.75);
    let highest = totals[0] ?? 0;
    for (const total of totals.slice(1)) {
      // Two ramp steps plus the step-back week between them come to about 13%;
      // the rest is which disciplines the rotation lands on that week.
      expect(total).toBeLessThanOrEqual(highest * 1.2);
      highest = Math.max(highest, total);
    }
  });

  it('shortens the long sessions through the taper', () => {
    const longRides = workouts
      .filter((workout) => workout.title.startsWith('Long'))
      .filter((workout) => workout.discipline === 'bike');
    const lastLongRide = longRides.at(-1);
    expect(lastLongRide?.plannedDurationMin).toBeLessThanOrEqual(expected.rideCap * 0.5);
  });

  it('keeps race week short and leaves the day before the race free', () => {
    const raceWeekStart = toIsoDateOffset(input.raceDate, -6);
    const dayBefore = toIsoDateOffset(input.raceDate, -1);
    const raceWeek = workouts.filter((workout) => workout.scheduledDate >= raceWeekStart);
    expect(raceWeek.length).toBeGreaterThan(0);
    for (const workout of raceWeek) {
      expect(workout.plannedDurationMin).toBeLessThanOrEqual(45);
      expect(workout.title.startsWith('Long')).toBe(false);
      expect(workout.scheduledDate).not.toBe(dayBefore);
    }
  });

  it('adds a run off the bike to the long ride only in Build and Peak', () => {
    const phaseOf = (date: string) =>
      plan?.phases.find((phase) => date >= phase.startDate && date <= phase.endDate)?.name;
    for (const workout of workouts) {
      if (workout.title === 'Long Ride + Brick Run') {
        expect(['Build', 'Peak']).toContain(phaseOf(workout.scheduledDate));
      }
      if (workout.title === 'Long Endurance Ride') {
        expect(['Base', 'Taper']).toContain(phaseOf(workout.scheduledDate));
      }
    }
    expect(workouts.some((workout) => workout.title === 'Long Ride + Brick Run')).toBe(true);
  });

  it('never schedules two sessions on one day', () => {
    const dates = workouts.map((workout) => workout.scheduledDate);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it('matches the recorded plan', () => {
    expect(plan).toMatchSnapshot();
  });
});

describe('generateTrainingPlan — long-course warnings and edge cases', () => {
  it('warns when weekly hours are below what the distance usually needs', () => {
    const plan = generateTrainingPlan({ ...ironmanInput, weeklyHours: 6 });
    expect(plan?.warnings.some((warning) => warning.includes('below the 9+'))).toBe(true);
  });

  it('warns when the build-up is shorter than usually advised', () => {
    const plan = generateTrainingPlan({ ...ironmanInput, raceDate: '2027-03-28' });
    expect(plan?.weeks).toBe(12);
    expect(plan?.warnings.some((warning) => warning.includes('shorter than the 16+'))).toBe(true);
  });

  it('says so when the hours cannot be used on the chosen days, instead of padding sessions', () => {
    const plan = generateTrainingPlan({ ...ironmanInput, weeklyHours: 20 });
    expect(plan?.warnings.some((warning) => warning.includes('Adding a training day'))).toBe(true);
  });

  it('gives no warnings for a well-provisioned 70.3 build', () => {
    expect(generateTrainingPlan(longCourseInput)?.warnings).toEqual([]);
  });

  it('caps a far-off race at the distance’s own maximum plan length', () => {
    expect(generateTrainingPlan({ ...longCourseInput, raceDate: '2028-06-11' })?.weeks).toBe(24);
    expect(generateTrainingPlan({ ...ironmanInput, raceDate: '2028-08-20' })?.weeks).toBe(30);
  });

  it('still produces a sane plan from a single training day', () => {
    const plan = generateTrainingPlan({
      ...longCourseInput,
      trainingDays: ['sat'],
      longWorkoutDay: 'sat',
    });
    expect(plan?.workouts.length).toBeGreaterThan(0);
    for (const workout of plan?.workouts ?? []) {
      expect(workout.plannedDurationMin).toBeLessThanOrEqual(240);
    }
  });

  it('handles very short notice with the generic collapse rules', () => {
    const plan = generateTrainingPlan({ ...longCourseInput, raceDate: '2027-01-17' });
    expect(plan?.phases.map((phase) => phase.name)).toEqual(['Build', 'Taper']);
  });

  it('handles a long day that is not a training day', () => {
    const plan = generateTrainingPlan({
      ...longCourseInput,
      trainingDays: ['mon', 'wed', 'fri'],
      longWorkoutDay: 'sat',
    });
    const disciplines = new Set(plan?.workouts.map((workout) => workout.discipline));
    expect(disciplines).toEqual(new Set(['swim', 'bike', 'run']));
  });
});

function toIsoDateOffset(iso: string, days: number): string {
  const date = fromIsoDate(iso);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

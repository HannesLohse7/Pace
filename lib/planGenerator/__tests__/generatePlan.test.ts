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

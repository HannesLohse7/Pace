import { describe, expect, it } from 'vitest';

import { computeTrainingLoad } from '../computeTrainingLoad';

function days(loads: number[]) {
  return loads.map((load, index) => ({
    date: `2027-01-${String(index + 1).padStart(2, '0')}`,
    load,
  }));
}

describe('computeTrainingLoad', () => {
  it('returns nothing for an empty series', () => {
    expect(computeTrainingLoad([])).toEqual([]);
  });

  it('cold-starts at zero rather than inventing history', () => {
    const [first] = computeTrainingLoad(days([420]));
    expect(first?.tsb).toBe(0);
    expect(first?.ctl).toBeCloseTo(10, 10);
    expect(first?.atl).toBeCloseTo(60, 10);
  });

  it('reports form as the previous day’s fitness minus fatigue', () => {
    const points = computeTrainingLoad(days([420, 0, 300]));
    for (let i = 1; i < points.length; i++) {
      const previous = points[i - 1];
      expect(points[i]?.tsb).toBeCloseTo((previous?.ctl ?? 0) - (previous?.atl ?? 0), 10);
    }
  });

  it('converges fitness and fatigue on a constant daily load', () => {
    const points = computeTrainingLoad(days(Array.from({ length: 400 }, () => 100)));
    const last = points.at(-1);
    expect(last?.ctl).toBeCloseTo(100, 1);
    expect(last?.atl).toBeCloseTo(100, 5);
    expect(last?.tsb).toBeCloseTo(0, 1);
  });

  it('lets fatigue fall faster than fitness during rest', () => {
    const loads = [
      ...Array.from({ length: 30 }, () => 200),
      ...Array.from({ length: 10 }, () => 0),
    ];
    const points = computeTrainingLoad(days(loads));
    const endOfBlock = points[29];
    const afterRest = points.at(-1);
    const fitnessKept = (afterRest?.ctl ?? 0) / (endOfBlock?.ctl ?? 1);
    const fatigueKept = (afterRest?.atl ?? 0) / (endOfBlock?.atl ?? 1);
    expect(fatigueKept).toBeLessThan(fitnessKept);
    expect(afterRest?.tsb).toBeGreaterThan(0);
  });

  it('keeps one point per input day, in order', () => {
    const input = days([10, 20, 30]);
    const points = computeTrainingLoad(input);
    expect(points.map((point) => point.date)).toEqual(input.map((day) => day.date));
    expect(points.map((point) => point.load)).toEqual([10, 20, 30]);
  });
});

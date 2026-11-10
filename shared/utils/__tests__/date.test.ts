import { describe, expect, it } from 'vitest';

import { addDays, fromIsoDate, mondayOnOrBefore, toIsoDate } from '../date';

describe('date helpers', () => {
  it('round-trips an ISO calendar date without a timezone shift', () => {
    for (const value of ['2027-01-01', '2027-03-14', '2027-11-07', '2028-02-29', '2027-12-31']) {
      expect(toIsoDate(fromIsoDate(value))).toBe(value);
    }
  });

  it('adds days across month, year and daylight-saving boundaries', () => {
    expect(toIsoDate(addDays(fromIsoDate('2027-01-31'), 1))).toBe('2027-02-01');
    expect(toIsoDate(addDays(fromIsoDate('2027-12-31'), 1))).toBe('2028-01-01');
    expect(toIsoDate(addDays(fromIsoDate('2027-03-13'), 2))).toBe('2027-03-15');
    expect(toIsoDate(addDays(fromIsoDate('2027-11-06'), 2))).toBe('2027-11-08');
    expect(toIsoDate(addDays(fromIsoDate('2027-03-01'), -1))).toBe('2027-02-28');
  });

  it('does not mutate its input', () => {
    const date = fromIsoDate('2027-05-05');
    addDays(date, 10);
    expect(toIsoDate(date)).toBe('2027-05-05');
  });

  it('finds the Monday that starts each week', () => {
    expect(toIsoDate(mondayOnOrBefore(fromIsoDate('2027-06-07')))).toBe('2027-06-07'); // Monday
    expect(toIsoDate(mondayOnOrBefore(fromIsoDate('2027-06-09')))).toBe('2027-06-07'); // Wednesday
    expect(toIsoDate(mondayOnOrBefore(fromIsoDate('2027-06-13')))).toBe('2027-06-07'); // Sunday
  });
});

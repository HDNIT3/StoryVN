import { describe, expect, it } from 'vitest';
import { calculateGrowthPercent, dateRangeKeys, dateRangeMatch, recordedDateRange, previousDateRange, resolveDateRange } from './date-range.util.js';

describe('Vietnam date ranges', () => {
  it('uses exclusive Vietnam midnight boundaries and real leap dates', () => {
    const range = resolveDateRange({ startDate: '2024-02-28', endDate: '2024-03-01' });
    expect(range.start.toISOString()).toBe('2024-02-27T17:00:00.000Z');
    expect(range.endExclusive.toISOString()).toBe('2024-03-01T17:00:00.000Z');
    expect(dateRangeKeys(range)).toEqual(['2024-02-28', '2024-02-29', '2024-03-01']);
    expect(dateRangeMatch('createdAt', range)).toEqual({ createdAt: { $gte: range.start, $lt: range.endExclusive } });
    const previous = previousDateRange(range);
    expect(previous.startDate).toBe('2024-02-25');
    expect(previous.endDate).toBe('2024-02-27');
    expect(previous.endExclusive).toEqual(range.start);
  });

  it('defaults to all time without timestamp filters', () => {
    const range = resolveDateRange(undefined, new Date('2024-02-29T17:00:00Z'));
    expect(range.endDate).toBe('2024-03-01');
    expect(range.allTime).toBe(true);
    expect(dateRangeMatch('createdAt', range)).toEqual({});
    expect(resolveDateRange({ days: 30 }).dayCount).toBe(30);
  });

  it('builds all-time timelines beyond 366 days from actual records', () => {
    const range = recordedDateRange(['2020-01-01', '2023-01-01'], new Date('2024-03-01T00:00:00Z'));
    expect(range.startDate).toBe('2020-01-01');
    expect(dateRangeKeys(range)).toHaveLength(1522);
  });

  it('accepts 366 days and rejects invalid dates, missing endpoints and reversed ranges', () => {
    expect(resolveDateRange({ startDate: '2024-01-01', endDate: '2024-12-31' }).dayCount).toBe(366);
    for (const query of [
      { startDate: '2023-02-29', endDate: '2023-03-01' },
      { startDate: '2024-04-31', endDate: '2024-05-01' },
      { startDate: '2024-01-01' },
      { startDate: '2024-03-02', endDate: '2024-03-01' },
      { startDate: '2024-01-01', endDate: '2025-01-01' },
    ]) expect(() => resolveDateRange(query)).toThrow();
  });

  it.each([[10, 5, 100], [0, 5, -100], [0, 0, 0], [10, 0, 100]])('growth %s / %s is %s', (current, previous, expected) => {
    expect(calculateGrowthPercent(current, previous)).toBe(expected);
  });
});

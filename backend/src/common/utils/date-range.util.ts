import { BadRequestException } from '@nestjs/common';

const DAY_MS = 24 * 60 * 60 * 1000;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

export interface DateRange {
  startDate: string;
  endDate: string;
  start: Date;
  endExclusive: Date;
  dayCount: number;
  allTime?: boolean;
}

export function calculateGrowthPercent(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function parseDateKey(value: string): { year: number; month: number; day: number } {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException('Dates must use YYYY-MM-DD format');
  }
  const [year, month, day] = value.split('-').map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new BadRequestException('Invalid calendar date');
  }
  return { year, month, day };
}

function keyFromUtcDate(date: Date): string {
  const vn = new Date(date.getTime() + VN_OFFSET_MS);
  return `${vn.getUTCFullYear()}-${String(vn.getUTCMonth() + 1).padStart(2, '0')}-${String(vn.getUTCDate()).padStart(2, '0')}`;
}

function vnMidnight(key: string): Date {
  const { year, month, day } = parseDateKey(key);
  return new Date(Date.UTC(year, month - 1, day) - VN_OFFSET_MS);
}

export function resolveDateRange(
  query?: { startDate?: string; endDate?: string; days?: number },
  now: Date = new Date(),
): DateRange {
  const startProvided = query?.startDate !== undefined;
  const endProvided = query?.endDate !== undefined;
  let startDate: string;
  let endDate: string;
  if (startProvided !== endProvided) {
    throw new BadRequestException('startDate and endDate must be provided together');
  }
  if (startProvided && endProvided) {
    parseDateKey(query!.startDate!);
    parseDateKey(query!.endDate!);
    startDate = query!.startDate!;
    endDate = query!.endDate!;
  } else if (query?.days === undefined) {
    // These boundaries are only a placeholder for an empty timeline. All-time
    // consumers omit predicates and derive chart bounds from recorded data.
    startDate = keyFromUtcDate(now);
    endDate = keyFromUtcDate(now);
  } else {
    const count = Number(query.days);
    if (!Number.isInteger(count) || count < 1 || count > 366) {
      throw new BadRequestException('days must be an integer between 1 and 366');
    }
    endDate = keyFromUtcDate(now);
    const end = vnMidnight(endDate).getTime();
    startDate = keyFromUtcDate(new Date(end - (count - 1) * DAY_MS));
  }
  const start = vnMidnight(startDate);
  const endExclusive = new Date(vnMidnight(endDate).getTime() + DAY_MS);
  const dayCount = Math.round((endExclusive.getTime() - start.getTime()) / DAY_MS);
  if (start >= endExclusive || dayCount > 366) {
    throw new BadRequestException('Date range must be 1 to 366 days and in order');
  }
  return { startDate, endDate, start, endExclusive, dayCount, allTime: query?.days === undefined && !startProvided };
}

export function dateRangeMatch(field: string, range: DateRange): Record<string, unknown> {
  if (range.allTime) return {};
  return { [field]: { $gte: range.start, $lt: range.endExclusive } };
}

export function dateRangeKeys(range: DateRange): string[] {
  const keys: string[] = [];
  for (let time = vnMidnight(range.startDate).getTime(); time < range.endExclusive.getTime(); time += DAY_MS) {
    keys.push(keyFromUtcDate(new Date(time)));
  }
  return keys;
}

export function recordedDateRange(dates: string[], now = new Date()): DateRange {
  const today = keyFromUtcDate(now);
  const first = dates.filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key) && key <= today).sort()[0] || today;
  const start = vnMidnight(first);
  const endExclusive = new Date(vnMidnight(today).getTime() + DAY_MS);
  return { startDate: first, endDate: today, start, endExclusive, dayCount: Math.round((endExclusive.getTime() - start.getTime()) / DAY_MS) };
}

export function previousDateRange(range: DateRange): DateRange {
  if (range.allTime) {
    const end = range.endExclusive;
    const start = new Date(end.getTime() - DAY_MS);
    return { startDate: keyFromUtcDate(start), endDate: keyFromUtcDate(new Date(end.getTime() - 1)), start, endExclusive: end, dayCount: 1 };
  }
  const start = new Date(range.start.getTime() - range.dayCount * DAY_MS);
  return {
    startDate: keyFromUtcDate(start),
    endDate: keyFromUtcDate(new Date(range.start.getTime() - DAY_MS)),
    start,
    endExclusive: range.start,
    dayCount: range.dayCount,
  };
}

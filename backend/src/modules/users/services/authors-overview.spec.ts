import { describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { AuthorsService } from './authors.service.js';

function query(value: unknown) {
  const chain = { lean: vi.fn(), exec: vi.fn().mockResolvedValue(value), select: vi.fn(), sort: vi.fn(), limit: vi.fn(), populate: vi.fn() };
  for (const key of ['lean', 'select', 'sort', 'limit', 'populate'] as const) chain[key].mockReturnValue(chain);
  return chain;
}

describe('author overview period comparisons', () => {
  it('includes old stories and daily activity with absent dates and no timestamp predicates', async () => {
    const id = new Types.ObjectId();
    const interactions = { countDocuments: vi.fn().mockResolvedValue(9), find: vi.fn(() => query([])) };
    const daily = { find: vi.fn(() => query([{ storyId: id, date: '2020-01-02', views: 42 }])) };
    const service: AuthorsService = Reflect.construct(AuthorsService, [
      {}, { findOne: () => query(null) }, { find: () => query([{ _id: id, createdAt: new Date('2020-01-01') }]) }, {},
      { find: () => query([]) }, {}, interactions, { find: () => query([]) }, interactions, interactions,
      { findOne: () => query(null) }, daily,
    ]);
    const result = await service.getAuthorOverview(id.toString());
    expect(result.range).toMatchObject({ mode: 'all', startDate: null, endDate: null });
    expect(result.stats.totalStories).toBe(1);
    expect(result.stats.totalViews).toBe(42);
    expect(result.stats.commentsGrowthPercent).toBe(0);
    expect(result.charts.reads.selectedRange.items[0].date).toBe('2020-01-01');
    expect(result.charts.reads.selectedRange.items.length).toBeGreaterThan(366);
    expect(daily.find).toHaveBeenCalledWith({ storyId: { $in: [id] } });
    expect(interactions.countDocuments.mock.calls.every(([filter]) => !('createdAt' in filter))).toBe(true);
  });
  it.each([[10, 5, 100], [0, 5, -100], [0, 0, 0]])('compares current %s against previous %s', async (current, previous, growth) => {
    const id = new Types.ObjectId();
    const countDocuments = vi.fn((filter: { createdAt: { $gte: Date; $lt: Date } }) => {
      const { $gte, $lt } = filter.createdAt;
      if ($gte.toISOString() === '2024-02-28T17:00:00.000Z' && $lt.toISOString() === '2024-02-29T17:00:00.000Z') return Promise.resolve(current);
      if ($gte.toISOString() === '2024-02-27T17:00:00.000Z' && $lt.toISOString() === '2024-02-28T17:00:00.000Z') return Promise.resolve(previous);
      throw new Error('Unexpected period');
    });
    const interactions = { countDocuments, find: () => query([]) };
    const service: AuthorsService = Reflect.construct(AuthorsService, [
      {}, { findOne: () => query(null) }, { find: () => query([{ _id: id, createdAt: new Date('2020-01-01') }]) }, {},
      { find: () => query([]) }, {}, interactions, { find: () => query([]) }, interactions, interactions,
      { findOne: () => query(null) },
      { find: () => query([{ storyId: id, date: '2024-02-28', views: previous }, { storyId: id, date: '2024-02-29', views: current }]) },
    ]);
    const result = await service.getAuthorOverview(id.toString(), { startDate: '2024-02-29', endDate: '2024-02-29' });
    expect(result.stats.commentsGrowthPercent).toBe(growth);
    expect(result.stats.ratingsGrowthPercent).toBe(growth);
    expect(result.stats.viewsYesterday).toBe(previous);
    expect(result.stats.viewsTodayGrowthPercent).toBe(growth);
    expect(result.stats.totalViews).toBe(current);
    expect(result.stats.totalCoins).toBe(0);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { AdminDashboardService } from './admin-dashboard.service.js';

describe('admin financial summary', () => {
  it('totals successful deposits, paid withdrawals, and requests awaiting payment separately', async () => {
    const transactions = { aggregate: vi.fn().mockResolvedValue([{ total: 900_000 }]) };
    const withdrawals = { aggregate: vi.fn().mockResolvedValue([
      { _id: 'COMPLETED', total: 500_000 },
      { _id: 'PENDING', total: 200_000 },
      { _id: 'PROCESSING', total: 100_000 },
    ]) };
    const service: AdminDashboardService = Reflect.construct(AdminDashboardService, [
      transactions, {}, {}, {}, {}, {}, {}, {}, {}, {}, withdrawals,
    ]);

    await expect(service.getFinancialSummary()).resolves.toEqual({
      successfulTopUps: 900_000,
      paidRoyalties: 500_000,
      pendingRoyalties: 300_000,
    });
    expect(transactions.aggregate.mock.calls[0][0][0]).toEqual({ $match: { status: 'SUCCESS' } });
    expect(withdrawals.aggregate.mock.calls[0][0][0]).toEqual({
      $match: { status: { $in: ['PENDING', 'PROCESSING', 'COMPLETED'] } },
    });
  });

  it('returns zero totals when there are no successful deposits or eligible withdrawals', async () => {
    const empty = { aggregate: vi.fn().mockResolvedValue([]) };
    const service: AdminDashboardService = Reflect.construct(AdminDashboardService, [
      empty, {}, {}, {}, {}, {}, {}, {}, {}, {}, empty,
    ]);

    await expect(service.getFinancialSummary()).resolves.toEqual({
      successfulTopUps: 0,
      paidRoyalties: 0,
      pendingRoyalties: 0,
    });
  });
});

describe('admin overview user growth', () => {
  it('defaults to all time and includes activity older than one year', async () => {
    const chain = { populate: vi.fn(), sort: vi.fn(), limit: vi.fn(), lean: vi.fn().mockResolvedValue([]) };
    chain.populate.mockReturnValue(chain); chain.sort.mockReturnValue(chain); chain.limit.mockReturnValue(chain);
    const empty = { aggregate: vi.fn().mockResolvedValue([]), countDocuments: vi.fn().mockResolvedValue(7), find: vi.fn().mockReturnValue(chain) };
    const views = { aggregate: vi.fn().mockResolvedValueOnce([{ _id: '2020-01-01', views: 42 }]).mockResolvedValueOnce([]) };
    const service: AdminDashboardService = Reflect.construct(AdminDashboardService, [empty, empty, empty, empty, views, empty, empty, empty, empty]);
    const result = await service.getOverview();
    expect(result.range).toMatchObject({ mode: 'all', startDate: null, endDate: null });
    expect(result.charts.timeline[0]).toMatchObject({ date: '2020-01-01', views: 42 });
    expect(result.charts.timeline.length).toBeGreaterThan(366);
    expect(result.kpi.stories.totalViews).toBe(42);
    expect(result.kpi.users.growthToday).toBe(0);
    expect(empty.countDocuments.mock.calls.every(([filter]) => !('createdAt' in filter))).toBe(true);
    expect(views.aggregate.mock.calls[0][0][0]).toEqual({ $match: {} });
  });
  it.each([[10, 5, 100], [0, 5, -100], [0, 0, 0]])('compares current %s against previous %s', async (current, previous, growth) => {
    const chain = { populate: vi.fn(), sort: vi.fn(), limit: vi.fn(), lean: vi.fn().mockResolvedValue([]) };
    chain.populate.mockReturnValue(chain);
    chain.sort.mockReturnValue(chain);
    chain.limit.mockReturnValue(chain);
    const empty = { aggregate: vi.fn().mockResolvedValue([]), countDocuments: vi.fn().mockResolvedValue(0), find: vi.fn().mockReturnValue(chain) };
    const users = { ...empty, countDocuments: vi.fn((filter: { createdAt: { $gte: Date; $lt: Date } }) => {
      const { $gte, $lt } = filter.createdAt;
      if ($gte.toISOString() === '2024-02-28T17:00:00.000Z' && $lt.toISOString() === '2024-03-01T17:00:00.000Z') return Promise.resolve(current);
      if ($gte.toISOString() === '2024-02-26T17:00:00.000Z' && $lt.toISOString() === '2024-02-28T17:00:00.000Z') return Promise.resolve(previous);
      throw new Error('Unexpected period');
    }) };
    const service: AdminDashboardService = Reflect.construct(AdminDashboardService, [empty, users, empty, empty, empty, empty, empty, empty, empty]);
    const result = await service.getOverview({ startDate: '2024-02-29', endDate: '2024-03-01' });
    expect(result.kpi.users.newToday).toBe(current);
    expect(result.kpi.users.newYesterday).toBe(previous);
    expect(result.kpi.users.growthToday).toBe(growth);
    expect(result.kpi.revenue.total).toBe(0);
  });
});

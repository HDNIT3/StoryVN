import { describe, expect, it } from 'vitest';
import {
  payoutAmount,
  royaltyPolicy,
  validatePackageEconomics,
} from './royalty-policy.js';

describe('royalty policy', () => {
  const policy = royaltyPolicy();
  it('only deducts platform share when converting the entire withdrawal', () => {
    expect(payoutAmount(20000, 100)).toBe(1400000);
    expect(payoutAmount(2857, 100)).toBeLessThan(policy.minimumAmount);
    expect(payoutAmount(2858, 100)).toBeGreaterThanOrEqual(
      policy.minimumAmount,
    );
    expect(payoutAmount(1, 101)).toBe(70);
  });
  it('rejects overflow, fractional and negative coins', () => {
    for (const amount of [-1, 1.5, Number.MAX_SAFE_INTEGER, NaN])
      expect(() => payoutAmount(amount, 100)).toThrow();
  });
  it('allows current largest package but rejects loss-making bonuses', () => {
    expect(() => validatePackageEconomics(500000, 6800, policy)).not.toThrow();
    expect(() => validatePackageEconomics(500000, 7200, policy)).toThrow();
    expect(() => validatePackageEconomics(0, 100, policy)).toThrow();
  });
  it('uses the agreed policy directly from code', () => {
    expect(policy).toEqual({
      exchangeRate: 100,
      payoutPercent: 70,
      minimumAmount: 200000,
    });
  });
});

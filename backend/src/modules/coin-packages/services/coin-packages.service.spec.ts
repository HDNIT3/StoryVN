import { describe, expect, it, vi } from 'vitest';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { CoinPackagesService } from './coin-packages.service.js';
import type { CoinPackageDocument } from '../schemas/coin-package.schema.js';
import type { Transaction } from '../../payments/schemas/transaction.schema.js';

describe('coin package financial safeguards', () => {
  it('refuses to delete packages referenced by any transaction', async () => {
    const packageId = new Types.ObjectId();
    const packages = {
      findById: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({ _id: packageId, sortOrder: 1 }),
      }),
      findByIdAndDelete: vi.fn(),
    };
    const transactions = {
      exists: vi.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
    };
    const service = new CoinPackagesService(
      packages as unknown as Model<CoinPackageDocument>,
      transactions as unknown as Model<Transaction>,
    );
    await expect(service.delete(String(packageId))).rejects.toThrow(
      'ngừng bán',
    );
    expect(packages.findByIdAndDelete).not.toHaveBeenCalled();
  });
  it('refuses to reactivate a package that cannot cover author payouts', async () => {
    const packages = {
      findById: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          isActive: false,
          price: 100000,
          totalCoin: 2000,
          save: vi.fn(),
        }),
      }),
    };
    const service = new CoinPackagesService(
      packages as unknown as Model<CoinPackageDocument>,
      {} as Model<Transaction>,
    );
    await expect(
      service.toggleStatus(String(new Types.ObjectId())),
    ).rejects.toThrow('nhuận bút');
  });
});

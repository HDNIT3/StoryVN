import { BadRequestException } from '@nestjs/common';

export function royaltyPolicy() {
  return {
    exchangeRate: 100,
    payoutPercent: 70,
    minimumAmount: 200000,
  };
}

export function payoutAmount(coins: number, rate: number): number {
  const numerator = coins * rate * 70;
  if (
    !Number.isSafeInteger(coins) ||
    coins < 0 ||
    !Number.isSafeInteger(numerator)
  ) {
    throw new BadRequestException(
      'Số Xu hoặc giá trị quy đổi vượt giới hạn hợp lệ',
    );
  }
  return Math.floor(numerator / 100);
}

export function validatePackageEconomics(
  price: number,
  totalCoin: number,
  policy: ReturnType<typeof royaltyPolicy>,
) {
  if (
    !Number.isSafeInteger(price) ||
    price <= 0 ||
    !Number.isSafeInteger(totalCoin) ||
    totalCoin <= 0
  ) {
    throw new BadRequestException('Giá gói và tổng Xu phải là số nguyên dương');
  }
  const liability = payoutAmount(totalCoin, policy.exchangeRate);
  if (liability >= price) {
    throw new BadRequestException(
      'Giá và Xu thưởng không đủ bù nhuận bút 70%. Vui lòng giảm Xu hoặc tăng giá.',
    );
  }
}

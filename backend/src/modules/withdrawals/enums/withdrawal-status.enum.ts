export enum WithdrawalStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export const OPEN_STATUSES = [
  WithdrawalStatus.PENDING,
  WithdrawalStatus.PROCESSING,
];

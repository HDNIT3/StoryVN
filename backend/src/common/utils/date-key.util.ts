export type ViewTimeFrame = 'all' | 'today' | 'day' | 'week' | 'month' | 'year';

const VN_TIME_ZONE = 'Asia/Ho_Chi_Minh';

/**
 * Chuyển đối tượng Date sang chuỗi YYYY-MM-DD theo múi giờ Việt Nam (UTC+7)
 */
export function toVnDateKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Lấy chuỗi YYYY-MM-DD của N ngày trước tính từ thời điểm hiện tại (theo giờ VN)
 */
export function getVnDateKeyDaysAgo(daysAgo: number, now: Date = new Date()): string {
  const target = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return toVnDateKey(target);
}

/**
 * Lấy nhãn hiển thị DD/MM từ chuỗi YYYY-MM-DD
 */
export function formatDateKeyLabel(dateKey: string): string {
  const parts = dateKey.split('-');
  if (parts.length !== 3) return dateKey;
  return `${parts[2]}/${parts[1]}`;
}

/**
 * Trả về ngày bắt đầu (YYYY-MM-DD, inclusive) cho từng khung thời gian thống kê lượt đọc:
 * - today / day: Hôm nay
 * - week: 7 ngày gần nhất (bao gồm hôm nay)
 * - month: 30 ngày gần nhất (bao gồm hôm nay)
 * - year: 365 ngày gần nhất (bao gồm hôm nay)
 * - all: null (toàn thời gian)
 */
export function getTimeFrameStartDateKey(
  timeFrame?: ViewTimeFrame | string,
  now: Date = new Date(),
): string | null {
  switch (timeFrame) {
    case 'today':
    case 'day':
      return toVnDateKey(now);
    case 'week':
      return getVnDateKeyDaysAgo(6, now);
    case 'month':
      return getVnDateKeyDaysAgo(29, now);
    case 'year':
      return getVnDateKeyDaysAgo(364, now);
    case 'all':
    default:
      return null;
  }
}

/**
 * Lấy bộ mốc ngày chuẩn cho Hôm nay / 7 ngày / 30 ngày / 365 ngày
 */
export function getStandardPeriodStartKeys(now: Date = new Date()): {
  todayKey: string;
  weekStartKey: string;
  monthStartKey: string;
  yearStartKey: string;
} {
  return {
    todayKey: toVnDateKey(now),
    weekStartKey: getVnDateKeyDaysAgo(6, now),
    monthStartKey: getVnDateKeyDaysAgo(29, now),
    yearStartKey: getVnDateKeyDaysAgo(364, now),
  };
}


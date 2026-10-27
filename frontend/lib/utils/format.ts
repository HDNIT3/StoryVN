/**
 * Tiện ích định dạng ngày giờ dùng chung.
 * Lịch sử đọc ưu tiên mốc thời gian tương đối ("2 giờ trước") vì người dùng
 * quan tâm tới việc vừa đọc tới đâu hơn là ngày chính xác.
 */

function toDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Ngày dạng DD/MM/YYYY */
export function formatDate(value?: string | Date | null): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Ngày giờ dạng DD/MM/YYYY HH:mm */
export function formatDateTime(value?: string | Date | null): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Mốc thời gian tương đối: "vừa xong", "12 phút trước", "3 ngày trước", sau 30 ngày thì trả ngày cụ thể */
export function formatRelativeTime(value?: string | Date | null): string {
  const date = toDate(value);
  if (!date) return "—";

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return "vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;

  return formatDate(date);
}

/** Định dạng số rút gọn (1.2K, 3.5M hoặc phân cách hàng nghìn) */
export function formatNumber(num?: number | null): string {
  if (num === undefined || num === null || isNaN(num)) return "0";
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString("vi-VN");
}

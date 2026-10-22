export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "Chưa cập nhật";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n: number) => String(n).padStart(2, "0");
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return dateStr;
  }
}

export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "Vừa xong";
  try {
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return "Vừa xong";

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
  } catch {
    return "Vừa xong";
  }
}

export function formatNumber(num?: number): string {
  if (!num) return "0";
  return new Intl.NumberFormat("vi-VN").format(num);
}

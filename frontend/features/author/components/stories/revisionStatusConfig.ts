export const REVISION_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Bản nháp",
    className: "bg-zinc-100 text-zinc-700 border-zinc-200",
  },
  PENDING_REVIEW: {
    label: "Chờ duyệt",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  APPROVED: {
    label: "Đã duyệt",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  REJECTED: {
    label: "Bị từ chối",
    className: "bg-rose-100 text-rose-800 border-rose-200",
  },
};

export function formatRevisionDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

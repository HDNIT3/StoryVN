"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { statusLabels } from "./types";
import type { WithdrawalStatus } from "./types";

export const revenueButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45";
export const revenuePrimary =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45";
export const revenueField =
  "min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
export const revenueHead =
  "whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 first:pl-5 last:pr-5";
export const revenueCell = "px-4 py-4 text-sm first:pl-5 last:pr-5";

const iconPaths = {
  overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  coins:
    "M12 8c-2 0-3 1-3 2s1 2 3 2 3 1 3 2-1 2-3 2m0-8V6m0 10v2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  wallet:
    "M20 8V6a2 2 0 0 0-2-2H6a3 3 0 0 0 0 6h14v10H6a3 3 0 0 1-3-3V7 M20 12h-5v4h5",
  history: "M3 11a9 9 0 1 1 2.6 7 M3 4v7h7 M12 7v5l3 2",
  bank: "M3 9l9-6 9 6H3 M5 10v8m5-8v8m4-8v8m5-8v8 M3 21h18 M3 18h18",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  refresh:
    "M20 7v5h-5 M4 17v-5h5 M6 7a7 7 0 0 1 12-2l2 3 M4 16l2 3a7 7 0 0 0 12-2",
  check: "M5 12l4 4L19 6",
  close: "M6 6l12 12M6 18 18 6",
  search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  book: "M12 5v16 M12 5C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 1",
  clock: "M12 8v4l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  info: "M12 11v6 M12 7h.01 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  chevron: "M9 5l7 7-7 7",
} as const;

export function RevenueIcon({
  name,
  className = "h-4 w-4",
}: {
  name: keyof typeof iconPaths;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

const statusStyles: Record<WithdrawalStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  PROCESSING: "border-sky-200 bg-sky-50 text-sky-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
};
export function WithdrawalBadge({ status }: { status: WithdrawalStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}

export function RevenueEmpty({
  title,
  description,
  action,
  error = false,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center px-5 py-14 text-center"
      role={error ? "alert" : undefined}
    >
      <span
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${error ? "bg-rose-50 text-rose-500" : "bg-slate-100 text-slate-400"}`}
      >
        <RevenueIcon name={error ? "info" : "history"} className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1.5 max-w-sm text-xs leading-5 text-slate-500">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function RevenueLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label="Đang tải dữ liệu"
      className="divide-y divide-slate-100 px-5"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center justify-between gap-5 py-5"
        >
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/5 rounded bg-slate-100" />
            <div className="h-2 w-3/5 rounded bg-slate-100" />
          </div>
          <div className="h-5 w-20 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function RevenuePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPage,
  disabled = false,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPage: (page: number) => void;
  disabled?: boolean;
}) {
  const count = Math.max(1, totalPages);
  const pages = [...new Set([1, page - 1, page, page + 1, count])]
    .filter((value) => value >= 1 && value <= count)
    .sort((a, b) => a - b);
  return (
    <div className="admin-pagination flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5 sm:flex-row">
      <p className="text-xs text-slate-500">
        Hiển thị{" "}
        <span className="font-semibold text-slate-700">
          {totalItems ? (page - 1) * pageSize + 1 : 0}–
          {Math.min(page * pageSize, totalItems)}
        </span>{" "}
        trong{" "}
        <span className="font-semibold text-slate-700">
          {totalItems.toLocaleString("vi-VN")}
        </span>{" "}
        kết quả
      </p>
      <nav className="flex items-center gap-1" aria-label="Phân trang bảng">
        <button
          type="button"
          aria-label="Trang trước"
          className={`${revenueButton} min-h-8 px-2 py-1`}
          disabled={disabled || page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <RevenueIcon name="chevron" className="h-3.5 w-3.5 rotate-180" />
        </button>
        {pages.map((value, index) => (
          <span key={value} className="flex items-center gap-1">
            {index > 0 && value - pages[index - 1] > 1 && (
              <span className="px-1 text-xs text-slate-400">…</span>
            )}
            <button
              type="button"
              aria-label={`Trang ${value}`}
              aria-current={page === value ? "page" : undefined}
              disabled={disabled}
              onClick={() => onPage(value)}
              className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition disabled:opacity-50 ${page === value ? "bg-sky-600 text-white shadow-xs" : "text-slate-500 hover:bg-slate-100"}`}
            >
              {value}
            </button>
          </span>
        ))}
        <button
          type="button"
          aria-label="Trang sau"
          className={`${revenueButton} min-h-8 px-2 py-1`}
          disabled={disabled || page >= count}
          onClick={() => onPage(page + 1)}
        >
          <RevenueIcon name="chevron" className="h-3.5 w-3.5" />
        </button>
      </nav>
    </div>
  );
}

export function RevenueDialog({
  title,
  subtitle,
  children,
  footer,
  onClose,
  busy = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const titleId = useId();
  const container = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  useEffect(() => {
    closeRef.current = onClose;
    busyRef.current = busy;
  }, [onClose, busy]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    container.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busyRef.current) closeRef.current();
      if (event.key !== "Tab") return;
      const elements = Array.from(
        container.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]',
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0);
      if (!elements.length) {
        event.preventDefault();
        return;
      }
      const first = elements[0],
        last = elements[elements.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === container.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === container.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="admin-dialog-overlay fixed inset-0 z-50 m-0! flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={container}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="admin-dialog flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none sm:max-h-[calc(100dvh-3rem)]"
      >
        <div className="admin-dialog-header flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="admin-dialog-title text-base font-bold tracking-tight text-slate-900"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 break-all text-xs leading-5 text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Đóng cửa sổ"
            onClick={onClose}
            disabled={busy}
            className="admin-dialog-close shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-40"
          >
            <RevenueIcon name="close" className="h-5 w-5" />
          </button>
        </div>
        <div className="admin-dialog-body min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6">
          {children}
        </div>
        {footer && (
          <div className="admin-dialog-footer flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

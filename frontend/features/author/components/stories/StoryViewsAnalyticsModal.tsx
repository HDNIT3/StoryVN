"use client";

import React, { useEffect, useId, useRef } from "react";
import { type DateRange, useDateRange } from "@/components/statistics";
import type { StoryItem } from "@/features/stories";
import { AuthorAnalyticsReport } from "../dashboard/AuthorAnalyticsReport";

interface StoryViewsAnalyticsModalProps {
  story: Pick<StoryItem, "_id" | "id" | "slug" | "title"> | null;
  isOpen: boolean;
  onClose: () => void;
  range: DateRange;
}

export function StoryViewsAnalyticsModal(props: StoryViewsAnalyticsModalProps) {
  if (!props.isOpen || !props.story) return null;
  return (
    <StoryAnalyticsDialog
      key={`${props.story._id || props.story.id || props.story.slug}-${JSON.stringify(props.range)}`}
      story={props.story}
      range={props.range}
      onClose={props.onClose}
    />
  );
}

function StoryAnalyticsDialog({
  story,
  range,
  onClose,
}: {
  story: NonNullable<StoryViewsAnalyticsModalProps["story"]>;
  range: DateRange;
  onClose: () => void;
}) {
  const dateRange = useDateRange(range);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
    }
    if (event.key !== "Tab") return;
    const items = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]',
      ) || [],
    );
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 backdrop-blur-xs sm:p-5"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="break-words text-base font-bold text-slate-900"
            >
              Thống kê tác phẩm: {story.title}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Theo dõi lượt đọc, đánh giá, tương tác và hiệu quả từng chương.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng thống kê tác phẩm"
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Đóng ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
          <AuthorAnalyticsReport
            dateRange={dateRange}
            storyId={story._id || story.id || story.slug || ""}
          />
        </div>
      </div>
    </div>
  );
}

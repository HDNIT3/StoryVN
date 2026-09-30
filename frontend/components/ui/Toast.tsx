"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { toast, ToastItem, ToastType } from "@/lib/toast";

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

const TOAST_STYLES: Record<
  ToastType,
  {
    iconWrap: string;
    border: string;
    progressBar: string;
    defaultTitle: string;
    badge: string;
  }
> = {
  success: {
    iconWrap: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60",
    border: "border-emerald-200/80 dark:border-emerald-900/60",
    progressBar: "bg-gradient-to-r from-emerald-500 to-teal-400",
    defaultTitle: "Thành công",
    badge: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  },
  error: {
    iconWrap: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60",
    border: "border-rose-200/80 dark:border-rose-900/60",
    progressBar: "bg-gradient-to-r from-rose-500 to-red-500",
    defaultTitle: "Thông báo",
    badge: "text-rose-600 dark:text-rose-400 bg-rose-500/10",
  },
  warning: {
    iconWrap: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60",
    border: "border-amber-200/80 dark:border-amber-900/60",
    progressBar: "bg-gradient-to-r from-amber-500 to-yellow-400",
    defaultTitle: "Cảnh báo",
    badge: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  },
  info: {
    iconWrap: "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800/60",
    border: "border-sky-200/80 dark:border-sky-900/60",
    progressBar: "bg-gradient-to-r from-sky-500 to-indigo-400",
    defaultTitle: "Thông báo",
    badge: "text-sky-600 dark:text-sky-400 bg-sky-500/10",
  },
};

function ToastCard({ item }: { item: ToastItem }) {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const remainingTimeRef = useRef<number>(item.duration);
  const startTimeRef = useRef<number>(Date.now());

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      toast.dismiss(item.id);
    }, 280);
  }, [item.id]);

  useEffect(() => {
    if (isPaused) return;

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, remainingTimeRef.current);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPaused, handleDismiss]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const style = TOAST_STYLES[item.type] || TOAST_STYLES.info;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-xl shadow-zinc-950/10 dark:shadow-black/50 border ${
        style.border
      } flex items-start gap-3.5 p-4 transition-all duration-300 hover:shadow-2xl ${
        isExiting ? "animate-toast-out" : "animate-toast-in"
      }`}
      role="alert"
    >
      {/* Icon Badge */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${style.iconWrap}`}
      >
        {TOAST_ICONS[item.type] || TOAST_ICONS.info}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badge}`}
          >
            {item.title || style.defaultTitle}
          </span>
          <span className="text-[11px] text-zinc-400 font-medium">vừa xong</span>
        </div>
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-snug break-words">
          {item.message}
        </p>
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors shrink-0 -mr-1 -mt-1"
        aria-label="Đóng thông báo"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 4s Countdown Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-zinc-100 dark:bg-zinc-800/80 overflow-hidden">
        <div
          className={`h-full ${style.progressBar} animate-toast-progress`}
          style={{
            animationDuration: `${item.duration}ms`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        />
      </div>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast.subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[99999] pointer-events-none flex flex-col gap-2.5 w-full max-w-[380px] sm:max-w-[420px] px-4 sm:px-0"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export default ToastContainer;

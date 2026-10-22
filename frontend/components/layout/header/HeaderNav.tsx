"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NavItem, DEFAULT_NAV_ITEMS } from "./header.config";
import { useAllCategories } from "@/features/categories";

// ─── Icons ────────────────────────────────────────────────────────
function ChevronDownIcon({
  open = false,
  className = "h-4 w-4",
}: {
  open?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={`${className} transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ArrowUpRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

// ─── Shared nav item styles ───────────────────────────────────────
function getNavItemClasses(isActive: boolean, className = "") {
  const activeClasses = isActive
    ? "bg-sky-50 text-sky-600 font-semibold shadow-[inset_0_0_0_1px_rgba(14,165,233,0.14),0_8px_24px_-18px_rgba(14,165,233,0.9)]"
    : "text-slate-600 font-medium hover:text-sky-600 hover:bg-sky-50/70";

  return `inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2.5 text-base transition-colors select-none ${activeClasses} ${className}`;
}

// ─── Single nav item ──────────────────────────────────────────────
function HeaderNavItem({
  item,
  isActive = false,
  onClick,
  className = "",
}: {
  item: NavItem;
  isActive?: boolean;
  onClick?: (item: NavItem) => void;
  className?: string;
}) {
  return (
    <Link
      href={item.href}
      onClick={() => onClick?.(item)}
      className={getNavItemClasses(isActive, className)}
    >
      {item.label}
    </Link>
  );
}

// ─── "Truyện" item with genre dropdown ────────────────────────────
function HeaderGenreNavItem({
  item,
  isActive = false,
  onClick,
}: {
  item: NavItem;
  isActive?: boolean;
  onClick?: (item: NavItem) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: genres = [], isLoading } = useAllCategories();

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setIsOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setIsOpen(false), 160);
  };

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocus={openMenu}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          clearCloseTimer();
          setIsOpen(false);
        }
      }}
    >
      <Link
        href={item.href}
        onClick={() => {
          setIsOpen(false);
          onClick?.(item);
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={getNavItemClasses(isActive)}
      >
        {item.label}
        <ChevronDownIcon open={isOpen} />
      </Link>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 pt-3">
          <div className="w-[min(680px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-100 bg-white/95 shadow-[0_28px_70px_-30px_rgba(14,165,233,0.45)] backdrop-blur-xl">
            {/* Dropdown header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-900">Khám phá thể loại</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Chọn thể loại để lọc nhanh danh sách truyện
                </p>
              </div>
              <Link
                href="/truyen"
                onClick={() => {
                  setIsOpen(false);
                  onClick?.(item);
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-600 transition-colors hover:border-sky-200 hover:bg-sky-100"
              >
                Tất cả
                <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Genre list */}
            <div className="max-h-[55vh] overflow-y-auto p-3">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-9 animate-pulse rounded-lg bg-slate-100"
                    />
                  ))}
                </div>
              ) : genres.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-slate-500">
                  Chưa có thể loại nào.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {genres.map((genre) => (
                    <Link
                      key={genre._id}
                      href={`/truyen?genre=${encodeURIComponent(
                        genre.slug || genre._id
                      )}`}
                      onClick={() => {
                        setIsOpen(false);
                        onClick?.(item);
                      }}
                      className="group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-600"
                    >
                      <span className="truncate">{genre.name}</span>
                      <ArrowUpRightIcon className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-sky-500" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Desktop navigation ───────────────────────────────────────────
interface HeaderNavProps {
  items?: NavItem[];
  activeNavId?: string;
  onNavItemClick?: (item: NavItem) => void;
  className?: string;
}

export function HeaderNav({
  items = DEFAULT_NAV_ITEMS,
  activeNavId = "home",
  onNavItemClick,
  className = "",
}: HeaderNavProps) {
  return (
    <nav
      className={`flex items-center gap-1 sm:gap-1.5 ${className}`}
      aria-label="Main Navigation"
    >
      {items.map((item) => {
        const isActive = activeNavId ? item.id === activeNavId : !!item.isActive;

        if (item.id === "truyen") {
          return (
            <HeaderGenreNavItem
              key={item.id}
              item={item}
              isActive={isActive}
              onClick={onNavItemClick}
            />
          );
        }

        return (
          <HeaderNavItem
            key={item.id}
            item={item}
            isActive={isActive}
            onClick={onNavItemClick}
          />
        );
      })}
    </nav>
  );
}

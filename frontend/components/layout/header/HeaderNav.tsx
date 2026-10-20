"use client";

import React from "react";
import Link from "next/link";
import { NavItem, DEFAULT_NAV_ITEMS } from "./header.config";

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
  const activeClasses = isActive
    ? "bg-sky-50 text-sky-600 font-semibold"
    : "text-zinc-700 font-medium hover:text-sky-600 hover:bg-sky-50/70";

  return (
    <Link
      href={item.href}
      onClick={() => onClick?.(item)}
      className={`inline-flex items-center justify-center px-3 2xl:px-3.5 py-2 text-sm rounded-lg transition-colors select-none whitespace-nowrap ${activeClasses} ${className}`}
    >
      {item.label}
    </Link>
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
      {items.map((item) => (
        <HeaderNavItem
          key={item.id}
          item={item}
          isActive={activeNavId ? item.id === activeNavId : !!item.isActive}
          onClick={onNavItemClick}
        />
      ))}
    </nav>
  );
}

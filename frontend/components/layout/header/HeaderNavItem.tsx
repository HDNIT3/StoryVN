"use client";

import React from "react";
import Link from "next/link";
import { NavItem } from "./header.types";

interface HeaderNavItemProps {
  item: NavItem;
  isActive?: boolean;
  onClick?: (item: NavItem) => void;
  className?: string;
}

export function HeaderNavItem({
  item,
  isActive = false,
  onClick,
  className = "",
}: HeaderNavItemProps) {
  const activeClasses = isActive
    ? "bg-amber-50/80 text-orange-600 font-bold shadow-xs hover:bg-amber-50"
    : "text-zinc-700 font-medium hover:text-zinc-950 hover:bg-zinc-100/60";

  return (
    <Link
      href={item.href}
      onClick={() => onClick?.(item)}
      className={`inline-flex items-center justify-center px-4 py-1.5 text-sm rounded-full transition-all duration-150 select-none ${activeClasses} ${className}`}
    >
      {item.label}
    </Link>
  );
}

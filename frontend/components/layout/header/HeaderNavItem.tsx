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
    ? "bg-sky-50 text-sky-600 font-bold shadow-xs hover:bg-sky-100/70"
    : "text-zinc-700 font-semibold hover:text-zinc-950 hover:bg-zinc-100/70";

  return (
    <Link
      href={item.href}
      onClick={() => onClick?.(item)}
      className={`inline-flex items-center justify-center px-3 2xl:px-4 py-1.5 2xl:py-2 text-xs xl:text-sm 2xl:text-base rounded-full transition-all duration-150 select-none whitespace-nowrap ${activeClasses} ${className}`}
    >
      {item.label}
    </Link>
  );
}

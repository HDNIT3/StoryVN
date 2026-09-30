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
      className={`inline-flex items-center justify-center px-4.5 py-2.5 text-base rounded-full transition-all duration-150 select-none ${activeClasses} ${className}`}
    >
      {item.label}
    </Link>
  );
}

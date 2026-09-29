"use client";

import React from "react";
import { NavItem, GenreItem as GenreItemType } from "./header.types";
import { DEFAULT_NAV_ITEMS, DEFAULT_GENRES } from "./header.constants";
import { HeaderNavItem } from "./HeaderNavItem";
import { GenreDropdown } from "./GenreDropdown";

interface HeaderNavProps {
  items?: NavItem[];
  activeNavId?: string;
  genres?: GenreItemType[];
  onNavItemClick?: (item: NavItem) => void;
  onGenreClick?: (genre: GenreItemType) => void;
  className?: string;
}

export function HeaderNav({
  items = DEFAULT_NAV_ITEMS,
  activeNavId = "home",
  genres = DEFAULT_GENRES,
  onNavItemClick,
  onGenreClick,
  className = "",
}: HeaderNavProps) {
  return (
    <nav className={`flex items-center gap-1.5 md:gap-2 ${className}`} aria-label="Main Navigation">
      {items.map((item) => {
        if (item.hasDropdown && item.dropdownType === "genres") {
          return (
            <GenreDropdown
              key={item.id}
              label={item.label}
              genres={genres}
              onGenreClick={onGenreClick}
            />
          );
        }

        const isActive = activeNavId ? item.id === activeNavId : !!item.isActive;

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

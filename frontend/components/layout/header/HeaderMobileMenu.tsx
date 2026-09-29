"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { NavItem, GenreItem as GenreItemType } from "./header.types";
import { DEFAULT_NAV_ITEMS, DEFAULT_GENRES } from "./header.constants";
import { HeaderSearch } from "./HeaderSearch";

interface HeaderMobileMenuProps {
  navItems?: NavItem[];
  activeNavId?: string;
  genres?: GenreItemType[];
  onNavItemClick?: (item: NavItem) => void;
  onGenreClick?: (genre: GenreItemType) => void;
  onSearch?: (query: string) => void;
}

export function HeaderMobileMenu({
  navItems = DEFAULT_NAV_ITEMS,
  activeNavId = "home",
  genres = DEFAULT_GENRES,
  onNavItemClick,
  onGenreClick,
  onSearch,
}: HeaderMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenresExpanded, setIsGenresExpanded] = useState(false);

  return (
    <div className="md:hidden flex items-center">
      {/* Mobile Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Mở menu di động"
        className="p-2 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors"
      >
        <div className="relative w-6 h-6">
          <Image
            src="/icon/menu.svg"
            alt="Menu"
            width={24}
            height={24}
            className="w-full h-full object-contain"
          />
        </div>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Sidebar */}
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-5 flex flex-col overflow-y-auto z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-4">
              <span className="font-bold text-base text-zinc-900">
                Menu Điều Hướng
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng menu"
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              >
                <div className="relative w-5 h-5">
                  <Image
                    src="/icon/close.svg"
                    alt="Đóng"
                    width={20}
                    height={20}
                    className="w-full h-full object-contain"
                  />
                </div>
              </button>
            </div>

            {/* Mobile Search */}
            <div className="mb-4">
              <HeaderSearch
                className="max-w-none w-full"
                onSearch={(q) => {
                  setIsOpen(false);
                  onSearch?.(q);
                }}
              />
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                if (item.hasDropdown && item.dropdownType === "genres") {
                  return (
                    <div key={item.id} className="py-1">
                      <button
                        type="button"
                        onClick={() => setIsGenresExpanded(!isGenresExpanded)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                      >
                        <span>{item.label}</span>
                        <div className="relative w-4 h-4">
                          <Image
                            src={isGenresExpanded ? "/icon/chevron-up.svg" : "/icon/chevron-down.svg"}
                            alt=""
                            width={16}
                            height={16}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </button>

                      {isGenresExpanded && (
                        <div className="grid grid-cols-2 gap-1 pl-3 pr-1 py-2 bg-zinc-50 rounded-xl my-1">
                          {genres.map((g) => (
                            <Link
                              key={g.id}
                              href={g.href}
                              onClick={() => {
                                setIsOpen(false);
                                onGenreClick?.(g);
                              }}
                              className="px-2 py-1.5 text-xs text-zinc-600 hover:text-orange-600 flex justify-between"
                            >
                              <span className="truncate">{g.name}</span>
                              {g.count && <span className="text-[10px] text-zinc-400">{g.count}</span>}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                const isActive = activeNavId === item.id;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => {
                      setIsOpen(false);
                      onNavItemClick?.(item);
                    }}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-amber-50 text-orange-600 font-bold"
                        : "text-zinc-800 hover:bg-zinc-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

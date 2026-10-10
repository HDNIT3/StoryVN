"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserProfile } from "./header.types";
import { DEFAULT_USER } from "./header.constants";

const ROLE_LABEL: Record<string, string> = {
  USER: "Người dùng",
  AUTHOR: "Tác giả",
  MANAGER: "Quản lý",
  ADMIN: "Quản trị viên",
};

const ROLE_COLOR: Record<string, string> = {
  USER: "text-zinc-600 bg-zinc-100",
  AUTHOR: "text-sky-600 bg-sky-50",
  MANAGER: "text-blue-600 bg-blue-50",
  ADMIN: "text-purple-600 bg-purple-50",
};

interface HeaderUserAvatarProps {
  user?: UserProfile;
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  className?: string;
}

export function HeaderUserAvatar({
  user = DEFAULT_USER,
  isLoggedIn = true,
  onLoginClick,
  onLogoutClick,
  className = "",
}: HeaderUserAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!isLoggedIn) {
    return (
      <div className={`flex items-center gap-1.5 sm:gap-2.5 shrink-0 ${className}`}>
        <Link
          href="/dang-nhap"
          onClick={onLoginClick}
          className="px-2.5 sm:px-4.5 py-1.5 sm:py-2.5 text-xs sm:text-base text-zinc-700 hover:text-zinc-950 transition-colors rounded-xl hover:bg-zinc-100 whitespace-nowrap"
        >
          Đăng nhập
        </Link>
        <Link
          href="/dang-ky"
          onClick={onLoginClick}
          className="px-3 sm:px-5 py-1.5 sm:py-2.5 text-xs sm:text-base font-medium text-white bg-sky-500 hover:bg-sky-600 active:bg-sky-700 rounded-full transition-all shadow-xs sm:shadow-sm whitespace-nowrap"
        >
          Đăng ký
        </Link>
      </div>
    );
  }

  const initial = user.avatarInitial || (user.name ? user.name[0].toUpperCase() : "U");
  const roleKey = (user.role || "").toUpperCase();
  const roleLabel = ROLE_LABEL[roleKey] || user.role;
  const roleColor = ROLE_COLOR[roleKey] || "text-zinc-600 bg-zinc-100";

  const isAdminOrManager = roleKey === "ADMIN" || roleKey === "MANAGER";
  const isAuthor = roleKey === "AUTHOR";

  return (
    <div ref={menuRef} className={`relative inline-block shrink-0 ${className}`}>
      {/* Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Menu tài khoản"
        className="flex items-center gap-1 sm:gap-1.5 p-0.5 sm:p-1 pr-0.5 sm:pr-2 rounded-full hover:bg-zinc-100 transition-all group cursor-pointer shrink-0"
      >
        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-sky-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center overflow-hidden ring-2 ring-sky-200 group-hover:ring-sky-400 transition-all select-none shadow-xs shrink-0">
          {user.avatarUrl && !user.avatarUrl.includes("avatar-h.svg") ? (
            <Image
              src={user.avatarUrl}
              alt={user.name}
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <span className="hidden 2xl:block text-xs 2xl:text-sm text-zinc-800 max-w-[100px] truncate">
          {user.name}
        </span>
        <svg
          className={`hidden sm:block w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 sm:w-68 max-w-[calc(100vw-20px)] bg-white rounded-2xl shadow-2xl border border-zinc-100 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User Info Header */}
          <div className="px-3 py-3 border-b border-zinc-100 mb-1.5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-500 text-white font-bold text-base flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {user.avatarUrl && !user.avatarUrl.includes("avatar-h.svg") ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.name}
                    width={44}
                    height={44}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-base font-bold text-zinc-900 truncate">{user.name}</p>
                <span
                  className={`inline-block mt-0.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${roleColor}`}
                >
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-1 text-base">
            {/* Hồ sơ - tất cả role */}
            <Link
              href="/ho-so"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-700 hover:text-sky-600 hover:bg-sky-50/70 transition-colors font-medium"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Hồ sơ cá nhân</span>
            </Link>

            {/* Quản lý tác phẩm - AUTHOR */}
            {isAuthor && (
              <Link
                href="/tac-gia/tac-pham"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-700 hover:text-sky-600 hover:bg-sky-50/70 transition-colors font-medium"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Quản lý tác phẩm</span>
              </Link>
            )}

            {/* Bảng quản lý - ADMIN / MANAGER */}
            {isAdminOrManager && (
              <Link
                href="/quan-ly/duyet-tac-gia"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-700 hover:text-blue-600 hover:bg-blue-50/60 transition-colors font-medium"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Bảng quản lý</span>
              </Link>
            )}

            {/* Đăng ký tác giả - USER only */}
            {roleKey === "USER" && (
              <Link
                href="/tac-gia/dang-ky"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-700 hover:text-sky-600 hover:bg-sky-50/70 transition-colors font-medium"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Đăng ký tác giả</span>
              </Link>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-zinc-100 mt-2 pt-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogoutClick?.();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-base text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

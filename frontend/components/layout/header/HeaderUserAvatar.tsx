"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserProfile } from "./header.types";
import { DEFAULT_USER } from "./header.constants";

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
      <div className={`flex items-center gap-2 ${className}`}>
        <Link
          href="/dang-nhap"
          onClick={onLoginClick}
          className="px-3.5 py-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-950 transition-colors rounded-lg hover:bg-zinc-100"
        >
          Đăng nhập
        </Link>
        <Link
          href="/dang-ky"
          onClick={onLoginClick}
          className="px-3.5 py-1.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-full transition-colors shadow-2xs"
        >
          Đăng ký
        </Link>
      </div>
    );
  }

  const initial = user.avatarInitial || (user.name ? user.name[0].toUpperCase() : "H");

  return (
    <div ref={menuRef} className={`relative inline-block ${className}`}>
      {/* Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Menu tài khoản"
        className="w-9 h-9 rounded-full bg-zinc-900 text-white font-bold text-sm flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-orange-500/50 transition-all select-none shadow-xs cursor-pointer"
      >
        {user.avatarUrl ? (
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
      </button>

      {/* Account Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-zinc-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User Info Header */}
          <div className="px-3 py-2.5 border-b border-zinc-100 mb-1">
            <p className="text-sm font-semibold text-zinc-900 truncate">
              {user.name}
            </p>
            {user.role && (
              <span className="inline-block mt-0.5 text-[11px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                {user.role}
              </span>
            )}
          </div>

          {/* Menu Items */}
          <div className="space-y-0.5 text-sm">
            <Link
              href="/tai-khoan/ho-so"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-3 py-2 rounded-lg text-zinc-700 hover:text-orange-600 hover:bg-orange-50/50 transition-colors"
            >
              Hồ sơ cá nhân
            </Link>
            <Link
              href="/tai-khoan/tu-truyen"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-3 py-2 rounded-lg text-zinc-700 hover:text-orange-600 hover:bg-orange-50/50 transition-colors"
            >
              Tủ truyện đã lưu
            </Link>
            <Link
              href="/tai-khoan/lich-su"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-3 py-2 rounded-lg text-zinc-700 hover:text-orange-600 hover:bg-orange-50/50 transition-colors"
            >
              Lịch sử đọc truyện
            </Link>
            <Link
              href="/tai-khoan/nap-xu"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-zinc-700 hover:text-orange-600 hover:bg-orange-50/50 transition-colors"
            >
              <span>Nạp Xu</span>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-sm">
                Ưu đãi
              </span>
            </Link>
          </div>

          {/* Logout Section */}
          <div className="border-t border-zinc-100 mt-1 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogoutClick?.();
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

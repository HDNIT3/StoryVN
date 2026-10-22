"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui";
import { toast } from "@/lib/toast";
import { uploadService } from "@/features/upload";
import { useUpdateAvatar } from "../queries/useUserQueries";
import { UserProfile } from "../types";

const ROLE_LABEL: Record<string, string> = {
  USER: "Người dùng",
  AUTHOR: "Tác giả",
  MANAGER: "Quản lý",
  ADMIN: "Quản trị viên",
};

const ROLE_BG: Record<string, string> = {
  USER: "from-zinc-400 to-zinc-600",
  AUTHOR: "from-sky-400 to-blue-600",
  MANAGER: "from-blue-400 to-indigo-600",
  ADMIN: "from-purple-500 to-purple-700",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  BANNED: "Bị cấm",
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  BANNED: "bg-red-100 text-red-700",
};

interface ProfileUserCardProps {
  user: UserProfile;
  onEditProfile: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  onRefreshUser: () => Promise<void>;
}

export function ProfileUserCard({
  user,
  onEditProfile,
  onChangePassword,
  onLogout,
  onRefreshUser,
}: ProfileUserCardProps) {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const updateAvatarMutation = useUpdateAvatar();

  const avatarInitial = (user.displayName || user.username || "U").charAt(0).toUpperCase();
  const coverGradient = ROLE_BG[user.role] || ROLE_BG.USER;

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error("Chỉ chấp nhận file ảnh: JPG, PNG, WEBP, GIF");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng file tối đa là 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const uploadRes = await uploadService.uploadImage(file, "avatars");
      if (uploadRes.success && uploadRes.data?.url) {
        await updateAvatarMutation.mutateAsync({ avatarUrl: uploadRes.data.url });
        await onRefreshUser();
      } else {
        throw new Error(uploadRes.message || "Tải ảnh lên thất bại");
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error && !err.message.includes("Failed to fetch")
          ? err.message
          : "Cập nhật ảnh đại diện thất bại, vui lòng thử lại";
      toast.error(errorMsg);
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
      <div className={`h-24 sm:h-28 md:h-32 bg-gradient-to-br ${coverGradient}`} />

      <div className="px-4 sm:px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 -mt-10 sm:-mt-12 mb-4 sm:mb-5">
          <div className="relative group">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarFileChange}
              disabled={isUploadingAvatar}
            />
            <button
              type="button"
              onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-md bg-sky-500 flex items-center justify-center overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400 group-hover:shadow-lg transition-all block text-left"
              title="Bấm để tải và đổi ảnh đại diện ngay"
            >
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <span className="text-white text-2xl sm:text-3xl font-bold">{avatarInitial}</span>
              )}

              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-semibold gap-1 z-10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Đổi ảnh</span>
              </div>

              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-1 z-20">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-medium">Đang tải...</span>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 w-6.5 h-6.5 sm:w-7 sm:h-7 bg-white text-slate-700 hover:text-sky-600 rounded-full border border-slate-200 shadow-xs flex items-center justify-center cursor-pointer transition hover:scale-110 z-10"
              title="Tải ảnh đại diện mới"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-700">
              {ROLE_LABEL[user.role] || user.role}
            </span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLOR[user.status] || "bg-zinc-100 text-zinc-700"}`}>
              {STATUS_LABEL[user.status] || user.status}
            </span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 truncate">{user.displayName}</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 truncate">@{user.username}</p>
        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 truncate">{user.email}</p>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-400">
          {user.createdAt && (
            <span>
              Tham gia:{" "}
              <span className="text-zinc-600 font-medium">
                {new Date(user.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </span>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-col gap-2.5">
          <Button
            id="btn-edit-profile"
            variant="outline"
            size="sm"
            fullWidth
            onClick={onEditProfile}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          >
            Chỉnh sửa hồ sơ
          </Button>
          <Button
            id="btn-change-password"
            variant="outline"
            size="sm"
            fullWidth
            onClick={onChangePassword}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
          >
            Đổi mật khẩu
          </Button>
          <Button
            id="btn-logout"
            variant="outline"
            size="sm"
            fullWidth
            onClick={onLogout}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 mt-1"
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            }
          >
            Đăng xuất
          </Button>
        </div>
      </div>
    </div>
  );
}

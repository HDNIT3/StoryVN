"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Button, ImageUploader } from "@/components/ui";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authorRequestService } from "@/lib/services/author-request.service";
import { userService } from "@/lib/services/user.service";
import { uploadService } from "@/lib/services/upload.service";
import { toast } from "@/lib/toast";
import type { AuthorRequestStatusData } from "@/types/author";

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

// ─── Modal chỉnh sửa profile ───────────────────────────────────────────────
function EditProfileModal({
  initialName,
  initialAvatarUrl,
  onClose,
  onSaved,
}: {
  initialName: string;
  initialAvatarUrl?: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [displayName, setDisplayName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (displayName.trim().length < 2 || displayName.trim().length > 50) {
      setError("Tên hiển thị phải từ 2 đến 50 ký tự");
      return;
    }

    setIsSaving(true);
    try {
      // Cập nhật displayName
      if (displayName.trim() !== initialName) {
        const res = await userService.updateProfile({ displayName: displayName.trim() });
        if (!res.success) throw new Error(res.message);
      }

      // Cập nhật avatar nếu có URL mới
      if (avatarUrl.trim() && avatarUrl.trim() !== initialAvatarUrl) {
        const res = await userService.updateAvatar({ avatarUrl: avatarUrl.trim() });
        if (!res.success) throw new Error(res.message);
      }

      toast.success("Cập nhật hồ sơ thành công!");
      onSaved();
    } catch (err: any) {
      const msg = err?.message && !err.message.includes("Failed to fetch")
        ? err.message
        : "Cập nhật thất bại, vui lòng thử lại";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900">Chỉnh sửa hồ sơ</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Tên hiển thị */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5" htmlFor="edit-displayname">
              Tên hiển thị <span className="text-red-400">*</span>
            </label>
            <input
              id="edit-displayname"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
              placeholder="Nhập tên hiển thị"
              minLength={2}
              maxLength={50}
              required
            />
            <p className="text-xs text-zinc-400 mt-1">Từ 2 đến 50 ký tự</p>
          </div>

          {/* Ảnh đại diện (Upload hoặc Dán Link) */}
          <div>
            <ImageUploader
              label="Ảnh đại diện"
              value={avatarUrl}
              onChange={(newUrl) => setAvatarUrl(newUrl)}
              folder="avatars"
              aspectRatio="square"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              id="btn-edit-profile-cancel"
              type="button"
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={isSaving}
            >
              Huỷ
            </Button>
            <Button
              id="btn-edit-profile-save"
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isSaving}
            >
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Input Mật khẩu ────────────────────────────────────────────────────────
function EyeToggle({ show, toggle }: { show: boolean; toggle: () => void }) {
  return (
    <button type="button" onClick={toggle} className="hover:text-zinc-600 cursor-pointer" aria-label={show ? "Ẩn" : "Hiện"}>
      {show ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-600 mb-1.5" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
          placeholder="••••••••"
          required
        />
        <div className="absolute inset-y-0 right-3 flex items-center text-zinc-400">
          <EyeToggle show={show} toggle={onToggle} />
        </div>
      </div>
    </div>
  );
}

// ─── Modal đổi mật khẩu ───────────────────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!oldPassword) { setError("Vui lòng nhập mật khẩu cũ"); return; }
    if (newPassword.length < 6) { setError("Mật khẩu mới phải có ít nhất 6 ký tự"); return; }
    if (newPassword !== confirmPassword) { setError("Xác nhận mật khẩu không khớp"); return; }

    setIsSaving(true);
    try {
      const res = await userService.changePassword({ oldPassword, newPassword, confirmPassword });
      if (!res.success) throw new Error(res.message);
      toast.success("Đổi mật khẩu thành công!");
      onClose();
    } catch (err: any) {
      const msg = err?.message && !err.message.includes("Failed to fetch")
        ? err.message
        : "Đổi mật khẩu thất bại, vui lòng thử lại";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900">Đổi mật khẩu</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 cursor-pointer" aria-label="Đóng">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <PasswordField id="cp-old" label="Mật khẩu hiện tại" value={oldPassword} onChange={setOldPassword} show={showOld} onToggle={() => setShowOld(!showOld)} />
          <PasswordField id="cp-new" label="Mật khẩu mới (tối thiểu 6 ký tự)" value={newPassword} onChange={setNewPassword} show={showNew} onToggle={() => setShowNew(!showNew)} />
          <PasswordField id="cp-confirm" label="Xác nhận mật khẩu mới" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />

          <div className="flex gap-3 pt-2">
            <Button id="btn-cp-cancel" type="button" variant="outline" fullWidth onClick={onClose} disabled={isSaving}>
              Huỷ
            </Button>
            <Button id="btn-cp-save" type="submit" variant="primary" fullWidth isLoading={isSaving}>
              Đổi mật khẩu
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function HoSoPage() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [authorData, setAuthorData] = useState<AuthorRequestStatusData | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error("Chỉ chấp nhận file ảnh: JPG, PNG, WEBP, GIF");
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng file tối đa là 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const uploadRes = await uploadService.uploadImage(file, "avatars");
      if (uploadRes.success && uploadRes.data?.url) {
        const updateRes = await userService.updateAvatar({ avatarUrl: uploadRes.data.url });
        if (updateRes.success) {
          await refreshUser();
          toast.success("Cập nhật ảnh đại diện thành công!");
        } else {
          throw new Error(updateRes.message || "Cập nhật ảnh đại diện thất bại");
        }
      } else {
        throw new Error(uploadRes.message || "Tải ảnh lên thất bại");
      }
    } catch (err: any) {
      const errorMsg =
        err?.message && !err.message.includes("Failed to fetch")
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

  useEffect(() => {
    if (user?.role === "USER" || user?.role === "AUTHOR") {
      authorRequestService
        .getAuthorProfileAndRequestStatus()
        .then((res) => setAuthorData(res.data))
        .catch(() => setAuthorData(null));
    }
  }, [user]);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/dang-nhap");
  };

  const avatarInitial = (user.displayName || user.username || "U").charAt(0).toUpperCase();
  const coverGradient = ROLE_BG[user.role] || ROLE_BG.USER;
  const authorRequest = authorData?.request;
  const authorProfile = authorData?.authorProfile;

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* ─── Modals ─── */}
      {showEditProfile && (
        <EditProfileModal
          initialName={user.displayName}
          initialAvatarUrl={user.avatarUrl}
          onClose={() => setShowEditProfile(false)}
          onSaved={async () => {
            await refreshUser();
            setShowEditProfile(false);
          }}
        />
      )}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      {/* ─── Profile Card ─── */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden mb-6">
        {/* Cover */}
        <div className={`h-24 sm:h-28 md:h-32 bg-gradient-to-br ${coverGradient}`} />

        {/* Avatar + Info */}
        <div className="px-4 sm:px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 -mt-10 sm:-mt-12 mb-4 sm:mb-5">
            {/* Avatar (Clickable to change immediately) */}
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

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-semibold gap-1 z-10">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Đổi ảnh</span>
                </div>

                {/* Loading spinner */}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-1 z-20">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-medium">Đang tải...</span>
                  </div>
                )}
              </button>

              {/* Camera icon badge button */}
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

            {/* Badges + Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-700">
                {ROLE_LABEL[user.role] || user.role}
              </span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLOR[user.status] || "bg-zinc-100 text-zinc-700"}`}>
                {STATUS_LABEL[user.status] || user.status}
              </span>
            </div>
          </div>

          {/* Info */}
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

          {/* Edit buttons */}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              id="btn-edit-profile"
              variant="outline"
              size="sm"
              onClick={() => setShowEditProfile(true)}
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
              onClick={() => setShowChangePassword(true)}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            >
              Đổi mật khẩu
            </Button>
          </div>
        </div>
      </div>

      {/* ─── AUTHOR: Thông tin tác giả ─── */}
      {user.role === "AUTHOR" && authorProfile && (
        <div className="bg-white rounded-2xl border border-sky-200 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-bold text-sky-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Trang tác giả
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-zinc-500">Bút danh</p>
              <p className="font-bold text-zinc-900 text-lg">{authorProfile.penName}</p>
            </div>
            {authorProfile.biography && (
              <div>
                <p className="text-xs text-zinc-500">Tiểu sử</p>
                <p className="text-sm text-zinc-700">{authorProfile.biography}</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
              <div className="text-center p-2.5 sm:p-3 bg-sky-50 rounded-xl">
                <p className="text-lg sm:text-xl font-bold text-sky-600">{authorProfile.storyCount || 0}</p>
                <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">Tác phẩm</p>
              </div>
              <div className="text-center p-2.5 sm:p-3 bg-sky-50 rounded-xl">
                <p className="text-lg sm:text-xl font-bold text-sky-600">{authorProfile.followerCount || 0}</p>
                <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">Theo dõi</p>
              </div>
              <div className="text-center p-2.5 sm:p-3 bg-sky-50 rounded-xl">
                <p className="text-lg sm:text-xl font-bold text-sky-600">{authorProfile.totalViews || 0}</p>
                <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">Lượt xem</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-sky-100">
            <Button
              id="btn-quan-ly-tac-pham"
              variant="primary"
              size="sm"
              onClick={() => router.push("/tac-gia/tac-pham")}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
            >
              Quản lý tác phẩm
            </Button>
          </div>
        </div>
      )}

      {/* ─── USER: Nâng cấp tác giả ─── */}
      {user.role === "USER" && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Trở thành Tác giả
          </h2>

          {authorRequest ? (
            <div className={`rounded-xl p-4 mb-4 border ${
              authorRequest.status === "PENDING"
                ? "bg-yellow-50 border-yellow-200"
                : authorRequest.status === "APPROVED"
                ? "bg-emerald-50 border-emerald-200"
                : "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${
                  authorRequest.status === "PENDING" ? "bg-yellow-500"
                  : authorRequest.status === "APPROVED" ? "bg-emerald-500"
                  : "bg-red-500"
                }`} />
                <span className={`text-xs font-bold ${
                  authorRequest.status === "PENDING" ? "text-yellow-700"
                  : authorRequest.status === "APPROVED" ? "text-emerald-700"
                  : "text-red-700"
                }`}>
                  {authorRequest.status === "PENDING" ? "Đang chờ xét duyệt"
                    : authorRequest.status === "APPROVED" ? "Đã được duyệt"
                    : "Bị từ chối"}
                </span>
              </div>
              <p className="text-xs text-zinc-600">Bút danh: <strong>{authorRequest.penName}</strong></p>
              {authorRequest.adminNote && (
                <p className="text-xs text-zinc-500 mt-1 italic">"{authorRequest.adminNote}"</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 mb-4">
              Đăng ký trở thành tác giả để bắt đầu chia sẻ tác phẩm với cộng đồng đọc giả StoryVN.
            </p>
          )}

          <Button
            id="btn-go-author-register"
            variant={authorRequest?.status === "PENDING" ? "secondary" : "outline"}
            size="sm"
            onClick={() => router.push("/tac-gia/dang-ky")}
          >
            {!authorRequest
              ? "📝 Đăng ký ngay"
              : authorRequest.status === "PENDING"
              ? "👁️ Xem trạng thái yêu cầu"
              : authorRequest.status === "REJECTED"
              ? "✏️ Chỉnh sửa và gửi lại"
              : "Xem hồ sơ tác giả"}
          </Button>
        </div>
      )}

      {/* ─── ADMIN / MANAGER ─── */}
      {(user.role === "ADMIN" || user.role === "MANAGER") && (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {user.role === "ADMIN" ? "Quản trị hệ thống" : "Bảng quản lý"}
          </h2>
          <p className="text-sm text-zinc-500 mb-4">
            Truy cập bảng điều khiển để quản lý hệ thống, duyệt yêu cầu tác giả và nội dung.
          </p>
          <Button
            id="btn-go-admin-panel"
            variant="primary"
            size="sm"
            onClick={() => router.push("/quan-ly/duyet-tac-gia")}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            }
          >
            Vào bảng quản lý
          </Button>
        </div>
      )}

      {/* ─── Đăng xuất ─── */}
      <div className="pt-2">
        <Button
          id="btn-logout"
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
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
  );
}

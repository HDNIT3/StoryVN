"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  useUserAuthorStatus,
  useUpdateProfile,
  useUpdateAvatar,
  useUpdateCover,
  useUpdateAuthorProfile,
  useChangePassword,
} from "@/lib/hooks/queries/useUserQuery";
import {
  useMyLikedStories,
  useMyFollowedStories,
  useMyRatedStories,
} from "@/lib/hooks/queries/usePublicStoryQuery";
import { uploadService } from "@/lib/services/upload.service";
import { historyService, type ReadingHistoryItem } from "@/lib/services/history.service";
import { toast } from "@/lib/toast";

const ROLE_LABEL: Record<string, string> = {
  USER: "Người dùng",
  AUTHOR: "Tác giả",
  MANAGER: "Quản lý",
  ADMIN: "Quản trị viên",
};

const ROLE_BG: Record<string, string> = {
  USER: "from-zinc-700 via-slate-800 to-zinc-950",
  AUTHOR: "from-sky-600 via-blue-700 to-indigo-900",
  MANAGER: "from-indigo-600 via-purple-700 to-slate-900",
  ADMIN: "from-purple-700 via-fuchsia-700 to-indigo-950",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  BANNED: "Bị cấm",
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  BANNED: "bg-red-50 text-red-700 border-red-200",
};

type ProfileTab = "history" | "likes" | "follows" | "ratings" | "account";

function formatRelativeTime(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay < 30) return `${diffDay} ngày trước`;
    return new Date(dateStr).toLocaleDateString("vi-VN");
  } catch {
    return "";
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return (n || 0).toString();
}

// ─── Modal chỉnh sửa profile đầy đủ ────────────────────────────────────────
function EditProfileModal({
  initialName,
  initialBio,
  initialAvatarUrl,
  initialCoverUrl,
  onClose,
  onSaved,
}: {
  initialName: string;
  initialBio?: string | null;
  initialAvatarUrl?: string | null;
  initialCoverUrl?: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [displayName, setDisplayName] = useState(initialName);
  const [bio, setBio] = useState(initialBio || "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || "");
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl || "");
  const [error, setError] = useState("");
  const [isUploadingModalAvatar, setIsUploadingModalAvatar] = useState(false);
  const [isUploadingModalCover, setIsUploadingModalCover] = useState(false);

  const modalAvatarInputRef = useRef<HTMLInputElement | null>(null);
  const modalCoverInputRef = useRef<HTMLInputElement | null>(null);

  const updateProfileMutation = useUpdateProfile();
  const isSaving = updateProfileMutation.isPending;

  const handleModalAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingModalAvatar(true);
    try {
      const res = await uploadService.uploadImage(file, "avatars");
      if (res.success && res.data?.url) {
        setAvatarUrl(res.data.url);
        toast.success("Tải ảnh đại diện lên thành công!");
      }
    } catch {
      toast.error("Tải ảnh lên thất bại");
    } finally {
      setIsUploadingModalAvatar(false);
    }
  };

  const handleModalCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingModalCover(true);
    try {
      const res = await uploadService.uploadImage(file, "covers");
      if (res.success && res.data?.url) {
        setCoverUrl(res.data.url);
        toast.success("Tải ảnh bìa lên thành công!");
      }
    } catch {
      toast.error("Tải ảnh lên thất bại");
    } finally {
      setIsUploadingModalCover(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (displayName.trim().length < 2 || displayName.trim().length > 50) {
      setError("Tên hiển thị phải từ 2 đến 50 ký tự");
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
        coverUrl: coverUrl.trim() || undefined,
      });

      onSaved();
    } catch (err: any) {
      const msg = err?.message && !err.message.includes("Failed to fetch")
        ? err.message
        : "Cập nhật thất bại, vui lòng thử lại";
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900">Chỉnh sửa hồ sơ cá nhân</h2>
            <p className="text-xs text-zinc-500">Cập nhật thông tin hiển thị, ảnh đại diện và ảnh bìa</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-1 rounded-lg hover:bg-zinc-100 transition"
            aria-label="Đóng"
          >
            ✕
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
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5" htmlFor="edit-displayName">
              Tên hiển thị <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
              placeholder="Nhập tên hiển thị..."
              required
              minLength={2}
              maxLength={50}
            />
          </div>

          {/* Giới thiệu bản thân (Bio) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-zinc-700" htmlFor="edit-bio">
                Giới thiệu bản thân (Tiểu sử)
              </label>
              <span className="text-[11px] text-zinc-400">{bio.length}/300</span>
            </div>
            <textarea
              id="edit-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition resize-none"
              placeholder="Chia sẻ đôi điều về bạn, gu đọc truyện, tác giả yêu thích..."
            />
          </div>

          {/* Ảnh đại diện */}
          <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-2.5">
            <label className="block text-xs font-bold text-zinc-700">Ảnh đại diện (Avatar)</label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-200 border border-zinc-300 shrink-0 relative flex items-center justify-center">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar Preview" fill className="object-cover" unoptimized />
                ) : (
                  <span className="text-zinc-400 text-xl font-bold">U</span>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <input
                  ref={modalAvatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleModalAvatarFile}
                />
                <button
                  type="button"
                  onClick={() => modalAvatarInputRef.current?.click()}
                  disabled={isUploadingModalAvatar}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 shadow-xs cursor-pointer transition"
                >
                  {isUploadingModalAvatar ? "Đang tải ảnh..." : "📁 Tải ảnh mới lên"}
                </button>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Hoặc dán URL ảnh đại diện..."
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </div>
          </div>

          {/* Ảnh bìa */}
          <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-2.5">
            <label className="block text-xs font-bold text-zinc-700">Ảnh bìa trang cá nhân (Cover)</label>
            <div className="flex flex-col gap-2">
              <div className="w-full h-18 rounded-xl overflow-hidden bg-zinc-200 border border-zinc-300 relative flex items-center justify-center">
                {coverUrl ? (
                  <Image src={coverUrl} alt="Cover Preview" fill className="object-cover" unoptimized />
                ) : (
                  <span className="text-zinc-400 text-xs font-medium">Chưa có ảnh bìa tùy chỉnh</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={modalCoverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleModalCoverFile}
                />
                <button
                  type="button"
                  onClick={() => modalCoverInputRef.current?.click()}
                  disabled={isUploadingModalCover}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 shadow-xs cursor-pointer transition shrink-0"
                >
                  {isUploadingModalCover ? "Đang tải ảnh..." : "📁 Tải ảnh bìa lên"}
                </button>
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="Hoặc dán URL ảnh bìa..."
                  className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                {coverUrl && (
                  <button
                    type="button"
                    onClick={() => setCoverUrl("")}
                    className="text-xs text-rose-500 hover:underline p-1"
                    title="Xóa ảnh bìa"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
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

// ─── Modal chỉnh sửa hồ sơ tác giả ───────────────────────────────────────────
function EditAuthorProfileModal({
  authorProfile,
  onClose,
  onSaved,
}: {
  authorProfile: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [penName, setPenName] = useState(authorProfile?.penName || "");
  const [biography, setBiography] = useState(authorProfile?.biography || "");
  const [website, setWebsite] = useState(authorProfile?.website || "");
  const [facebook, setFacebook] = useState(authorProfile?.socialLinks?.facebook || "");
  const [bankName, setBankName] = useState(authorProfile?.bankName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(authorProfile?.bankAccountNumber || "");
  const [bankAccountName, setBankAccountName] = useState(authorProfile?.bankAccountName || "");

  const updateAuthorProfileMutation = useUpdateAuthorProfile();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!penName.trim()) {
      toast.error("Bút danh không được để trống");
      return;
    }

    try {
      await updateAuthorProfileMutation.mutateAsync({
        penName: penName.trim(),
        biography: biography.trim(),
        website: website.trim() || undefined,
        socialLinks: facebook.trim() ? { facebook: facebook.trim() } : {},
        bankName: bankName.trim() || undefined,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        bankAccountName: bankAccountName.trim() || undefined,
      });
      onSaved();
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900">Chỉnh sửa hồ sơ tác giả</h2>
            <p className="text-xs text-zinc-500">Cập nhật bút danh, tiểu sử và thông tin nhận nhuận bút</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-1 rounded-lg hover:bg-zinc-100 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Bút danh tác giả <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={penName}
              onChange={(e) => setPenName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Tiểu sử / Lời ngỏ tác giả
            </label>
            <textarea
              rows={3}
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
              placeholder="Giới thiệu phong cách sáng tác, thể loại sở trường..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Website tác giả</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Facebook</label>
              <input
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span>💳</span> Thông tin tài khoản nhận nhuận bút (Bảo mật)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-amber-800 mb-1">Tên ngân hàng</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Vietcombank, MB, Techcombank..."
                  className="w-full px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-xs text-zinc-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-amber-800 mb-1">Số tài khoản</label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="0123456789"
                  className="w-full px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-xs text-zinc-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-amber-800 mb-1">Tên chủ tài khoản</label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="NGUYEN VAN A"
                  className="w-full px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-xs text-zinc-800 uppercase"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={updateAuthorProfileMutation.isPending}
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={updateAuthorProfileMutation.isPending}
            >
              Lưu hồ sơ tác giả
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
  const [error, setError] = useState("");

  const changePasswordMutation = useChangePassword();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!oldPassword) { setError("Vui lòng nhập mật khẩu cũ"); return; }
    if (newPassword.length < 6) { setError("Mật khẩu mới phải có ít nhất 6 ký tự"); return; }
    if (newPassword !== confirmPassword) { setError("Xác nhận mật khẩu không khớp"); return; }

    try {
      await changePasswordMutation.mutateAsync({
        oldPassword,
        newPassword,
        confirmPassword,
      });
      onClose();
    } catch (err: any) {
      const msg = err?.message && !err.message.includes("Failed to fetch")
        ? err.message
        : "Đổi mật khẩu thất bại, vui lòng thử lại";
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900">Đổi mật khẩu</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-1 rounded-lg hover:bg-zinc-100 transition" aria-label="Đóng">
            ✕
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
            <Button id="btn-cp-cancel" type="button" variant="outline" fullWidth onClick={onClose} disabled={changePasswordMutation.isPending}>
              Huỷ
            </Button>
            <Button id="btn-cp-save" type="submit" variant="primary" fullWidth isLoading={changePasswordMutation.isPending}>
              Đổi mật khẩu
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Story Card Component cho các Tab ───────────────────────────────────────
function StoryItemCard({
  story,
  type,
  onRemove,
  extraBadge,
}: {
  story: {
    _id: string;
    slug?: string;
    title: string;
    coverUrl?: string | null;
    authorName?: string;
    progressState?: string;
    stats?: { viewCount?: number; likeCount?: number; chapterCount?: number };
    userRatingScore?: number;
    lastReadAt?: string;
  };
  type: "history" | "likes" | "follows" | "ratings";
  onRemove?: () => void;
  extraBadge?: React.ReactNode;
}) {
  const storySlug = story.slug || story._id;

  return (
    <div className="group flex bg-white rounded-2xl border border-zinc-200 p-3 sm:p-4 hover:shadow-lg hover:border-zinc-300 transition-all duration-200 gap-3.5 sm:gap-4 relative">
      {/* Cover */}
      <Link
        href={`/truyen/${storySlug}`}
        className="relative w-20 sm:w-24 aspect-[2/3] rounded-xl overflow-hidden bg-zinc-100 border border-zinc-100 shrink-0 shadow-xs block group-hover:scale-102 transition-transform duration-200"
      >
        {story.coverUrl ? (
          <Image
            src={story.coverUrl}
            alt={story.title}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-300">
            📖
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/truyen/${storySlug}`}
              className="text-sm sm:text-base font-bold text-zinc-900 hover:text-indigo-600 transition-colors line-clamp-2"
              title={story.title}
            >
              {story.title}
            </Link>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-zinc-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                title={type === "history" ? "Xóa khỏi lịch sử" : "Bỏ lưu"}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <p className="text-xs text-zinc-500 mt-1 truncate">
            Tác giả: <span className="font-medium text-zinc-700">{story.authorName || "Ẩn danh"}</span>
          </p>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {extraBadge}
            {story.progressState && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                {story.progressState === "COMPLETED" ? "Hoàn thành" : "Đang ra"}
              </span>
            )}
            {story.stats?.chapterCount !== undefined && (
              <span className="text-[10px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full font-medium">
                {story.stats.chapterCount} chương
              </span>
            )}
            {story.lastReadAt && (
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 font-medium">
                Đọc {formatRelativeTime(story.lastReadAt)}
              </span>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-100">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            {story.stats?.viewCount !== undefined && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                {formatNumber(story.stats.viewCount)}
              </span>
            )}
            {story.stats?.likeCount !== undefined && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-rose-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>
                {formatNumber(story.stats.likeCount)}
              </span>
            )}
          </div>

          <Link
            href={`/truyen/${storySlug}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
          >
            Đọc tiếp →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State Component ──────────────────────────────────────────────────
function TabEmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-12 sm:py-16 bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
        {icon}
      </div>
      <h3 className="text-base font-bold text-zinc-800">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-sm mx-auto mt-1 mb-5">{description}</p>
      <Link
        href="/#kham-pha"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-sm transition-all"
      >
        <span>Khám phá truyện hay</span>
        <span>→</span>
      </Link>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function HoSoPage() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ProfileTab>("history");
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditAuthorModal, setShowEditAuthorModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [historyList, setHistoryList] = useState<ReadingHistoryItem[]>([]);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const updateAvatarMutation = useUpdateAvatar();
  const updateCoverMutation = useUpdateCover();

  // Đọc lịch sử đọc truyện từ historyService
  useEffect(() => {
    const loadHistory = () => {
      setHistoryList(historyService.getHistory());
    };
    loadHistory();
    window.addEventListener("storyvn_history_updated", loadHistory);
    return () => window.removeEventListener("storyvn_history_updated", loadHistory);
  }, []);

  // TanStack Query: Danh sách truyện thích, theo dõi, đánh giá
  const { data: likedStories, isLoading: likedLoading } = useMyLikedStories(!!user);
  const { data: followedStories, isLoading: followedLoading } = useMyFollowedStories(!!user);
  const { data: ratedStories, isLoading: ratedLoading } = useMyRatedStories(!!user);

  // TanStack Query: Lấy trạng thái yêu cầu tác giả
  const { data: authorData } = useUserAuthorStatus(
    !!user && (user.role === "USER" || user.role === "AUTHOR")
  );

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
        await refreshUser();
        toast.success("Cập nhật ảnh đại diện thành công!");
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

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploadingCover(true);
    try {
      const uploadRes = await uploadService.uploadImage(file, "covers");
      if (uploadRes.success && uploadRes.data?.url) {
        await updateCoverMutation.mutateAsync(uploadRes.data.url);
        await refreshUser();
        toast.success("Cập nhật ảnh bìa thành công!");
      } else {
        throw new Error(uploadRes.message || "Tải ảnh bìa thất bại");
      }
    } catch (err: any) {
      const errorMsg =
        err?.message && !err.message.includes("Failed to fetch")
          ? err.message
          : "Cập nhật ảnh bìa thất bại, vui lòng thử lại";
      toast.error(errorMsg);
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }
    }
  };

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
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 py-6 sm:py-10 space-y-6">
      {/* ─── Modals ─── */}
      {showEditProfile && (
        <EditProfileModal
          initialName={user.displayName}
          initialBio={user.bio}
          initialAvatarUrl={user.avatarUrl}
          initialCoverUrl={user.coverUrl}
          onClose={() => setShowEditProfile(false)}
          onSaved={async () => {
            await refreshUser();
            setShowEditProfile(false);
          }}
        />
      )}
      {showEditAuthorModal && authorProfile && (
        <EditAuthorProfileModal
          authorProfile={authorProfile}
          onClose={() => setShowEditAuthorModal(false)}
          onSaved={async () => {
            await refreshUser();
            setShowEditAuthorModal(false);
          }}
        />
      )}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      {/* ─── Hero Profile Header Card ─── */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden">
        {/* Cover banner with custom image or gradient + Change Cover Button */}
        <div className={`h-36 sm:h-44 md:h-52 bg-gradient-to-r ${coverGradient} relative overflow-hidden group/cover`}>
          {user.coverUrl && (
            <Image
              src={user.coverUrl}
              alt="Ảnh bìa"
              fill
              className="object-cover"
              priority
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* Nút Đổi ảnh bìa */}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverFileChange}
            disabled={isUploadingCover}
          />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={isUploadingCover}
            className="absolute top-3.5 right-3.5 sm:top-5 sm:right-6 flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-xs font-semibold shadow-lg transition-all hover:scale-105 cursor-pointer z-20 border border-white/20"
            title="Bấm để tải và thay đổi ảnh bìa"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{isUploadingCover ? "Đang tải ảnh..." : "Đổi ảnh bìa"}</span>
          </button>
        </div>

        {/* Profile Details Bar: Avatar and Name are neatly aligned with white card container */}
        <div className="px-5 sm:px-8 pb-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 -mt-12 sm:-mt-14 mb-5">
            {/* Left: Avatar & Text */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5 flex-1 min-w-0">
              {/* Avatar Box */}
              <div className="relative group shrink-0 self-start sm:self-auto">
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
                  className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center overflow-hidden cursor-pointer focus:outline-hidden hover:scale-102 transition-all block text-left"
                  title="Bấm để tải và đổi ảnh đại diện"
                >
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.displayName}
                      width={112}
                      height={112}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  ) : (
                    <span className="text-white text-3xl sm:text-4xl font-extrabold">{avatarInitial}</span>
                  )}

                  {/* Hover Overlay */}
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
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-white text-zinc-700 hover:text-indigo-600 rounded-full border border-zinc-200 shadow-md flex items-center justify-center cursor-pointer transition hover:scale-115 z-10"
                  title="Tải ảnh đại diện mới"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>

              {/* Text Block: Tên nằm trên nền trắng bo quanh chữ, không bị che bởi ảnh bìa */}
              <div className="min-w-0 flex-1 pt-2 sm:pt-4">
                <div className="inline-flex items-center gap-2.5 flex-wrap bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-2xl border border-zinc-200 shadow-xs">
                  <h1 className="text-xl sm:text-2xl font-black text-zinc-900 leading-tight">
                    {user.displayName}
                  </h1>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                    {ROLE_LABEL[user.role] || user.role}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[user.status] || "bg-zinc-100 text-zinc-700"}`}>
                    {STATUS_LABEL[user.status] || user.status}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 mt-2 font-medium truncate">
                  @{user.username} • {user.email}
                </p>
                {user.bio && (
                  <p className="text-xs text-zinc-600 mt-1.5 line-clamp-2 italic">
                    "{user.bio}"
                  </p>
                )}
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto mt-2 lg:mt-0">
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
                Chỉnh sửa
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

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                activeTab === "history"
                  ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20"
                  : "bg-zinc-50/60 border-zinc-200/80 hover:bg-zinc-100/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-medium">Lịch sử đọc</span>
                <span className="text-base">🕒</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-zinc-900 mt-1">
                {historyList.length}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("likes")}
              className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                activeTab === "likes"
                  ? "bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/20"
                  : "bg-zinc-50/60 border-zinc-200/80 hover:bg-zinc-100/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-medium">Yêu thích</span>
                <span className="text-base">❤️</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
                {likedStories?.length || 0}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("follows")}
              className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                activeTab === "follows"
                  ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-400/20"
                  : "bg-zinc-50/60 border-zinc-200/80 hover:bg-zinc-100/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-medium">Theo dõi</span>
                <span className="text-base">🔖</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-indigo-600 mt-1">
                {followedStories?.length || 0}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ratings")}
              className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                activeTab === "ratings"
                  ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20"
                  : "bg-zinc-50/60 border-zinc-200/80 hover:bg-zinc-100/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-medium">Đã đánh giá</span>
                <span className="text-base">⭐</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
                {ratedStories?.length || 0}
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-200">
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "history"
              ? "border-indigo-600 text-indigo-600 bg-white"
              : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50"
          }`}
        >
          <span>🕒 Lịch sử đọc</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
            {historyList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("likes")}
          className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "likes"
              ? "border-rose-500 text-rose-600 bg-white"
              : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50"
          }`}
        >
          <span>❤️ Đã thích</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
            {likedStories?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("follows")}
          className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "follows"
              ? "border-indigo-600 text-indigo-600 bg-white"
              : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50"
          }`}
        >
          <span>🔖 Đang theo dõi</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
            {followedStories?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ratings")}
          className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "ratings"
              ? "border-amber-500 text-amber-600 bg-white"
              : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50"
          }`}
        >
          <span>⭐ Đã đánh giá</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
            {ratedStories?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("account")}
          className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ml-auto ${
            activeTab === "account"
              ? "border-zinc-800 text-zinc-900 bg-white"
              : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50"
          }`}
        >
          <span>⚙️ Cài đặt & Quyền hạn</span>
        </button>
      </div>

      {/* ─── Tab 1: Lịch sử đọc ─── */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900">
              Truyện bạn đã đọc gần đây ({historyList.length})
            </h2>
            {historyList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử đọc truyện?")) {
                    historyService.clearHistory();
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-medium cursor-pointer"
              >
                Xóa toàn bộ lịch sử
              </button>
            )}
          </div>

          {historyList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {historyList.map((item) => (
                <StoryItemCard
                  key={item._id}
                  story={item}
                  type="history"
                  onRemove={() => historyService.removeFromHistory(item._id)}
                />
              ))}
            </div>
          ) : (
            <TabEmptyState
              icon="🕒"
              title="Chưa có lịch sử đọc truyện"
              description="Hãy bắt đầu đọc những bộ truyện hấp dẫn để lưu lại tiến trình đọc của bạn tại đây."
            />
          )}
        </div>
      )}

      {/* ─── Tab 2: Truyện yêu thích ─── */}
      {activeTab === "likes" && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-zinc-900">
            Truyện bạn đã thích ({likedStories?.length || 0})
          </h2>

          {likedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-zinc-200 rounded-2xl" />
              ))}
            </div>
          ) : (likedStories && likedStories.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {likedStories.map((story) => (
                <StoryItemCard
                  key={story._id}
                  story={{
                    ...story,
                    authorName: story.author?.penName || story.author?.displayName,
                  }}
                  type="likes"
                  extraBadge={
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                      ❤️ Đã thích
                    </span>
                  }
                />
              ))}
            </div>
          ) : (
            <TabEmptyState
              icon="❤️"
              title="Chưa có truyện yêu thích"
              description="Bấm vào nút 'Yêu thích' trên trang chi tiết truyện để lưu lại những tác phẩm bạn tâm đắc."
            />
          )}
        </div>
      )}

      {/* ─── Tab 3: Truyện đang theo dõi ─── */}
      {activeTab === "follows" && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-zinc-900">
            Truyện bạn đang theo dõi ({followedStories?.length || 0})
          </h2>

          {followedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-zinc-200 rounded-2xl" />
              ))}
            </div>
          ) : (followedStories && followedStories.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {followedStories.map((story) => (
                <StoryItemCard
                  key={story._id}
                  story={{
                    ...story,
                    authorName: story.author?.penName || story.author?.displayName,
                  }}
                  type="follows"
                  extraBadge={
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      🔖 Đang theo dõi
                    </span>
                  }
                />
              ))}
            </div>
          ) : (
            <TabEmptyState
              icon="🔖"
              title="Chưa theo dõi truyện nào"
              description="Theo dõi truyện để nhận thông báo chương mới sớm nhất và dễ dàng đọc lại bất cứ lúc nào."
            />
          )}
        </div>
      )}

      {/* ─── Tab 4: Đã đánh giá ─── */}
      {activeTab === "ratings" && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-zinc-900">
            Truyện bạn đã đánh giá ({ratedStories?.length || 0})
          </h2>

          {ratedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-zinc-200 rounded-2xl" />
              ))}
            </div>
          ) : (ratedStories && ratedStories.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ratedStories.map((story) => (
                <StoryItemCard
                  key={story._id}
                  story={{
                    ...story,
                    authorName: story.author?.penName || story.author?.displayName,
                  }}
                  type="ratings"
                  extraBadge={
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Điểm chấm: {story.userRatingScore}★
                    </span>
                  }
                />
              ))}
            </div>
          ) : (
            <TabEmptyState
              icon="⭐"
              title="Chưa đánh giá truyện nào"
              description="Hãy để lại điểm đánh giá trên trang truyện để giúp cộng đồng tìm được những bộ truyện xuất sắc nhất."
            />
          )}
        </div>
      )}

      {/* ─── Tab 5: Cài đặt tài khoản & Quyền hạn ─── */}
      {activeTab === "account" && (
        <div className="space-y-6">
          {/* ─── AUTHOR: Hồ sơ tác giả đầy đủ ─── */}
          {user.role === "AUTHOR" && (
            <div className="bg-white rounded-3xl border border-sky-200/90 shadow-sm p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-sky-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-base font-bold">
                    ✍️
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-900">Hồ sơ Tác giả chính thức</h2>
                    <p className="text-xs text-zinc-500">Thông tin xuất bản và tác quyền của bạn</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditAuthorModal(true)}
                  className="border-sky-300 text-sky-700 hover:bg-sky-50"
                  leftIcon={
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  }
                >
                  Chỉnh sửa hồ sơ tác giả
                </Button>
              </div>

              {authorProfile ? (
                <div className="space-y-4">
                  {/* Bút danh & Bio */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100">
                      <span className="text-xs font-semibold text-sky-800 block">Bút danh tác giả</span>
                      <p className="text-lg font-black text-sky-950 mt-0.5">{authorProfile.penName}</p>
                    </div>

                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <span className="text-xs font-semibold text-zinc-500 block">Liên kết mạng xã hội & Website</span>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        {authorProfile.website ? (
                          <a href={authorProfile.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 font-medium">
                            🌐 Website
                          </a>
                        ) : (
                          <span className="text-zinc-400">Chưa có website</span>
                        )}
                        {authorProfile.socialLinks?.facebook && (
                          <a href={authorProfile.socialLinks.facebook} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-medium">
                            📘 Facebook
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tiểu sử */}
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <span className="text-xs font-semibold text-zinc-500 block mb-1">Lời ngỏ / Tiểu sử sáng tác</span>
                    <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                      {authorProfile.biography || "Chưa cập nhật tiểu sử tác giả. Hãy bấm 'Chỉnh sửa hồ sơ tác giả' để giới thiệu bản thân với độc giả."}
                    </p>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 sm:p-4 bg-sky-50 rounded-2xl border border-sky-100">
                      <p className="text-xl sm:text-2xl font-black text-sky-600">{authorProfile.storyCount || 0}</p>
                      <p className="text-[11px] sm:text-xs text-zinc-500 font-medium mt-0.5">Tác phẩm</p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-sky-50 rounded-2xl border border-sky-100">
                      <p className="text-xl sm:text-2xl font-black text-sky-600">{authorProfile.followerCount || 0}</p>
                      <p className="text-[11px] sm:text-xs text-zinc-500 font-medium mt-0.5">Người theo dõi</p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-sky-50 rounded-2xl border border-sky-100">
                      <p className="text-xl sm:text-2xl font-black text-sky-600">{formatNumber(authorProfile.totalViews || 0)}</p>
                      <p className="text-[11px] sm:text-xs text-zinc-500 font-medium mt-0.5">Lượt đọc</p>
                    </div>
                  </div>

                  {/* Tài khoản nhận nhuận bút */}
                  <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <span>💳</span> Tài khoản nhận nhuận bút & hỗ trợ độc giả
                      </span>
                      {authorProfile.bankAccountNumber && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Đã liên kết
                        </span>
                      )}
                    </div>
                    {authorProfile.bankAccountNumber ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-amber-950">
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Ngân hàng:</span>
                          <span className="font-semibold">{authorProfile.bankName || "—"}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Số tài khoản:</span>
                          <span className="font-mono font-bold tracking-wider">{authorProfile.bankAccountNumber}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Chủ tài khoản:</span>
                          <span className="font-semibold uppercase">{authorProfile.bankAccountName || "—"}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-800">
                        Chưa cấu hình thông tin tài khoản nhận tiền. Bấm nút <strong>Chỉnh sửa hồ sơ tác giả</strong> để bổ sung.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">Đang tải thông tin hồ sơ tác giả...</p>
              )}

              <div className="pt-2 flex items-center gap-3">
                <Button
                  id="btn-quan-ly-tac-pham"
                  variant="primary"
                  size="sm"
                  onClick={() => router.push("/tac-gia/tac-pham")}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 sm:p-7">
              <h2 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Trở thành Tác giả trên StoryVN
              </h2>

              {authorRequest ? (
                <div className={`rounded-2xl p-4 mb-4 border ${
                  authorRequest.status === "PENDING"
                    ? "bg-yellow-50 border-yellow-200"
                    : authorRequest.status === "APPROVED"
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-red-50 border-red-200"
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      authorRequest.status === "PENDING" ? "bg-yellow-500"
                      : authorRequest.status === "APPROVED" ? "bg-emerald-500"
                      : "bg-red-500"
                    }`} />
                    <span className={`text-xs font-bold ${
                      authorRequest.status === "PENDING" ? "text-yellow-700"
                      : authorRequest.status === "APPROVED" ? "text-emerald-700"
                      : "text-red-700"
                    }`}>
                      {authorRequest.status === "PENDING" ? "Đang chờ quản trị viên xét duyệt"
                        : authorRequest.status === "APPROVED" ? "Đã được phê duyệt tác giả"
                        : "Yêu cầu bị từ chối"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600">Bút danh đăng ký: <strong>{authorRequest.penName}</strong></p>
                  {authorRequest.adminNote && (
                    <p className="text-xs text-zinc-500 mt-1 italic">Ghi chú: "{authorRequest.adminNote}"</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 mb-4">
                  Đăng ký trở thành tác giả để bắt đầu chia sẻ tác phẩm, đăng tải chương truyện và kết nối với cộng đồng độc giả StoryVN.
                </p>
              )}

              <Button
                id="btn-go-author-register"
                variant={authorRequest?.status === "PENDING" ? "secondary" : "outline"}
                size="sm"
                onClick={() => router.push("/tac-gia/dang-ky")}
              >
                {!authorRequest
                  ? "📝 Đăng ký làm tác giả ngay"
                  : authorRequest.status === "PENDING"
                  ? "👁️ Xem trạng thái yêu cầu"
                  : authorRequest.status === "REJECTED"
                  ? "✏️ Chỉnh sửa và gửi lại đơn"
                  : "Xem hồ sơ tác giả"}
              </Button>
            </div>
          )}

          {/* ─── ADMIN / MANAGER: Truy cập bảng quản lý ─── */}
          {(user.role === "ADMIN" || user.role === "MANAGER") && (
            <div className="bg-white rounded-3xl border border-blue-200 shadow-sm p-6 sm:p-7">
              <h2 className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {user.role === "ADMIN" ? "Bảng điều khiển Quản trị viên" : "Bảng điều khiển Quản lý"}
              </h2>
              <p className="text-sm text-zinc-500 mb-4">
                Truy cập trung tâm quản lý để kiểm duyệt truyện, duyệt yêu cầu tác giả và quản lý người dùng trong hệ thống.
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

          {/* ─── Thông tin chi tiết tài khoản (Sạch sẽ, không hiện MongoDB ID) ─── */}
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 sm:p-7 space-y-4">
            <h3 className="text-sm font-bold text-zinc-900">Chi tiết tài khoản của bạn</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-zinc-400 block mb-0.5">Tên đăng nhập</span>
                <span className="text-zinc-800 font-bold text-sm">@{user.username}</span>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-zinc-400 block mb-0.5">Email tài khoản</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-800 font-bold text-sm truncate">{user.email}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-semibold shrink-0">
                    Đã kích hoạt
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-zinc-400 block mb-0.5">Vai trò tài khoản</span>
                <span className="text-indigo-600 font-bold text-sm">{ROLE_LABEL[user.role] || user.role}</span>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-zinc-400 block mb-0.5">Trạng thái bảo mật</span>
                <span className="text-emerald-700 font-bold text-sm">Bảo vệ bình thường</span>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-zinc-400 block mb-0.5">Ngày tham gia StoryVN</span>
                <span className="text-zinc-800 font-bold text-sm">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                </span>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-zinc-400 block mb-0.5">Phiên đăng nhập</span>
                <span className="text-zinc-800 font-bold text-sm">Thiết bị hiện tại</span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-zinc-400">Bạn muốn kết thúc phiên đăng nhập?</span>
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
                Đăng xuất tài khoản
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

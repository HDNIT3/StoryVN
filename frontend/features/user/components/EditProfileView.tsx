"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button, ImageUploader } from "@/components/ui";
import { useAuth } from "@/lib/context/AuthContext";
import type { AuthorProfileItem } from "@/features/author";
import {
  useChangePassword,
  useUpdateAuthorProfile,
  useUpdateAvatar,
  useUpdateProfile,
  useUserAuthorStatus,
} from "../queries/useUserQueries";
import type { UserProfile } from "../types";

const inputClass =
  "w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 text-sm rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none py-2.5 px-3.5 transition-all";
const labelClass = "text-sm font-medium text-zinc-700";

function EyeToggle({ show, toggle }: { show: boolean; toggle: () => void }) {
  return (
    <button
      type="button"
      onClick={toggle}
      className="hover:text-zinc-600 cursor-pointer"
      aria-label={show ? "Ẩn" : "Hiện"}
    >
      {show ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
          />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
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
    <div className="space-y-1">
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} pr-10`}
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

function SectionCard({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-5 sm:p-6 space-y-5 scroll-mt-24"
    >
      <div>
        <h2 className="text-base font-bold text-zinc-900">{title}</h2>
        {description && <p className="text-xs sm:text-sm text-zinc-500 mt-1">{description}</p>}
      </div>
      {children}
    </section>
  );
}

// ─── Khối thông tin tài khoản ──────────────────────────────────
function AccountSection({ user, onSaved }: { user: UserProfile; onSaved: () => Promise<void> }) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [error, setError] = useState("");

  const updateProfileMutation = useUpdateProfile();
  const updateAvatarMutation = useUpdateAvatar();
  const isSaving = updateProfileMutation.isPending || updateAvatarMutation.isPending;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = displayName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setError("Tên hiển thị phải từ 2 đến 50 ký tự");
      return;
    }

    const initialName = user.displayName || "";
    const initialAvatar = user.avatarUrl || "";
    const trimmedAvatar = avatarUrl.trim();

    if (trimmedAvatar !== initialAvatar && !trimmedAvatar) {
      setError("Ảnh đại diện không được để trống");
      return;
    }

    try {
      if (trimmedName !== initialName) {
        await updateProfileMutation.mutateAsync({ displayName: trimmedName });
      }
      if (trimmedAvatar !== initialAvatar) {
        await updateAvatarMutation.mutateAsync({ avatarUrl: trimmedAvatar });
      }
      await onSaved();
    } catch (err: unknown) {
      const msg =
        err instanceof Error && !err.message.includes("Failed to fetch")
          ? err.message
          : "Cập nhật hồ sơ thất bại, vui lòng thử lại";
      setError(msg);
    }
  };

  return (
    <SectionCard
      title="Thông tin tài khoản"
      description="Ảnh đại diện và tên hiển thị dùng chung cho toàn bộ hệ thống."
    >
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <ImageUploader
          label="Ảnh đại diện"
          value={avatarUrl}
          onChange={setAvatarUrl}
          folder="avatars"
          aspectRatio="square"
          disabled={isSaving}
        />

        <div className="space-y-1">
          <label className={labelClass} htmlFor="edit-display-name">
            Tên hiển thị <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputClass}
            placeholder="Nhập tên hiển thị"
            minLength={2}
            maxLength={50}
            required
          />
          <p className="text-xs text-zinc-400">Từ 2 đến 50 ký tự</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className={labelClass}>Tên đăng nhập</span>
            <p className="text-sm text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-xl py-2.5 px-3.5 truncate">
              @{user.username}
            </p>
          </div>
          <div className="space-y-1">
            <span className={labelClass}>Email</span>
            <p className="text-sm text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-xl py-2.5 px-3.5 truncate">
              {user.email}
            </p>
          </div>
        </div>

        <Button id="btn-save-account" type="submit" variant="primary" size="sm" isLoading={isSaving}>
          Lưu thông tin tài khoản
        </Button>
      </form>
    </SectionCard>
  );
}

// ─── Khối đổi mật khẩu ─────────────────────────────────────────
function PasswordSection() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const changePasswordMutation = useChangePassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!oldPassword) {
      setError("Vui lòng nhập mật khẩu cũ");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        oldPassword,
        newPassword,
        confirmPassword,
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error && !err.message.includes("Failed to fetch")
          ? err.message
          : "Đổi mật khẩu thất bại, vui lòng thử lại";
      setError(msg);
    }
  };

  return (
    <SectionCard
      id="doi-mat-khau"
      title="Đổi mật khẩu"
      description="Mật khẩu mới cần tối thiểu 6 ký tự. Các phiên đăng nhập khác sẽ bị thu hồi."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <PasswordField
          id="cp-old"
          label="Mật khẩu hiện tại"
          value={oldPassword}
          onChange={setOldPassword}
          show={showOld}
          onToggle={() => setShowOld(!showOld)}
        />
        <PasswordField
          id="cp-new"
          label="Mật khẩu mới"
          value={newPassword}
          onChange={setNewPassword}
          show={showNew}
          onToggle={() => setShowNew(!showNew)}
        />
        <PasswordField
          id="cp-confirm"
          label="Xác nhận mật khẩu mới"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirm}
          onToggle={() => setShowConfirm(!showConfirm)}
        />

        <Button
          id="btn-save-password"
          type="submit"
          variant="primary"
          size="sm"
          isLoading={changePasswordMutation.isPending}
        >
          Đổi mật khẩu
        </Button>
      </form>
    </SectionCard>
  );
}

// ─── Khối hồ sơ tác giả ────────────────────────────────────────
function AuthorProfileForm({ authorProfile }: { authorProfile: AuthorProfileItem }) {
  const [coverUrl, setCoverUrl] = useState(authorProfile.coverUrl || "");
  const [biography, setBiography] = useState(authorProfile.biography || "");
  const [website, setWebsite] = useState(authorProfile.website || "");
  const [facebook, setFacebook] = useState(
    typeof authorProfile.socialLinks?.facebook === "string" ? authorProfile.socialLinks.facebook : ""
  );
  const [tiktok, setTiktok] = useState(
    typeof authorProfile.socialLinks?.tiktok === "string" ? authorProfile.socialLinks.tiktok : ""
  );
  const [bankName, setBankName] = useState(authorProfile.bankName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(authorProfile.bankAccountNumber || "");
  const [bankAccountName, setBankAccountName] = useState(authorProfile.bankAccountName || "");
  const [error, setError] = useState("");

  const updateAuthorProfileMutation = useUpdateAuthorProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (biography.trim().length > 1000) {
      setError("Tiểu sử tối đa 1.000 ký tự");
      return;
    }

    const socialLinks: Record<string, string> = {};
    Object.entries(authorProfile.socialLinks || {}).forEach(([key, value]) => {
      if (key !== "facebook" && key !== "tiktok" && typeof value === "string" && value.trim()) {
        socialLinks[key] = value;
      }
    });
    if (facebook.trim()) socialLinks.facebook = facebook.trim();
    if (tiktok.trim()) socialLinks.tiktok = tiktok.trim();

    try {
      await updateAuthorProfileMutation.mutateAsync({
        coverUrl: coverUrl.trim(),
        biography: biography.trim(),
        website: website.trim(),
        socialLinks,
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountName: bankAccountName.trim().toUpperCase(),
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error && !err.message.includes("Failed to fetch")
          ? err.message
          : "Cập nhật hồ sơ tác giả thất bại, vui lòng thử lại";
      setError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl bg-sky-50/60 border border-sky-100 px-4 py-3">
        <p className="text-xs text-zinc-500">Bút danh chính thức</p>
        <p className="text-base font-bold text-zinc-900 mt-0.5">{authorProfile.penName}</p>
      </div>

      <ImageUploader
        label="Ảnh bìa trang tác giả"
        value={coverUrl}
        onChange={setCoverUrl}
        folder="covers"
        aspectRatio="cover"
        cropAspect={3}
        disabled={updateAuthorProfileMutation.isPending}
      />

      <div className="space-y-1">
        <label className={labelClass} htmlFor="author-biography">
          Tiểu sử sáng tác
        </label>
        <textarea
          id="author-biography"
          value={biography}
          onChange={(e) => setBiography(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Giới thiệu về bản thân, phong cách viết, thể loại yêu thích..."
          className={`${inputClass} resize-none`}
        />
        <p className="text-xs text-zinc-400">Tối đa 1.000 ký tự</p>
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="author-website">
          Website cá nhân
        </label>
        <input
          id="author-website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://yourwebsite.com"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className={labelClass} htmlFor="author-facebook">
            Facebook
          </label>
          <input
            id="author-facebook"
            type="url"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="https://facebook.com/..."
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass} htmlFor="author-tiktok">
            TikTok
          </label>
          <input
            id="author-tiktok"
            type="url"
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            placeholder="https://tiktok.com/@..."
            className={inputClass}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-100 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">Thông tin nhận ủng hộ</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Độc giả dùng thông tin này để chuyển khoản ủng hộ bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelClass} htmlFor="author-bank-name">
              Tên ngân hàng
            </label>
            <input
              id="author-bank-name"
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Vietcombank, Techcombank..."
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass} htmlFor="author-bank-number">
              Số tài khoản
            </label>
            <input
              id="author-bank-number"
              type="text"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              placeholder="0123456789"
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className={labelClass} htmlFor="author-bank-owner">
            Tên chủ tài khoản
          </label>
          <input
            id="author-bank-owner"
            type="text"
            value={bankAccountName}
            onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
            placeholder="NGUYEN VAN A"
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      <Button
        id="btn-save-author-profile"
        type="submit"
        variant="primary"
        size="sm"
        isLoading={updateAuthorProfileMutation.isPending}
      >
        Lưu hồ sơ tác giả
      </Button>
    </form>
  );
}

function AuthorProfileSection({
  authorProfile,
  isLoading,
}: {
  authorProfile: AuthorProfileItem | null | undefined;
  isLoading: boolean;
}) {
  return (
    <SectionCard
      title="Hồ sơ tác giả công khai"
      description="Những thông tin này hiển thị cho độc giả trên trang tác giả của bạn."
    >
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-36 rounded-2xl bg-zinc-100" />
          <div className="h-10 rounded-xl bg-zinc-100" />
          <div className="h-24 rounded-xl bg-zinc-100" />
        </div>
      ) : !authorProfile ? (
        <p className="text-sm text-zinc-500">Chưa tìm thấy hồ sơ tác giả của tài khoản này.</p>
      ) : (
        <AuthorProfileForm
          key={`${authorProfile._id}:${authorProfile.updatedAt ?? ""}`}
          authorProfile={authorProfile}
        />
      )}
    </SectionCard>
  );
}

export function EditProfileView() {
  const { user, refreshUser } = useAuth();
  const isAuthor = user?.role === "AUTHOR";

  const { data: authorData, isLoading: isLoadingAuthorProfile } = useUserAuthorStatus(Boolean(isAuthor));
  const authorProfile = authorData?.authorProfile;

  if (!user) return null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/ho-so"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-100 border border-zinc-200 px-3.5 py-2 rounded-xl transition shadow-xs"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Quay lại hồ sơ</span>
        </Link>

        {isAuthor && (
          <Link
            href={`/tac-gia/${encodeURIComponent(user.username)}`}
            target="_blank"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3.5 py-2 rounded-xl transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span>Xem trang tác giả công khai</span>
          </Link>
        )}
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Chỉnh sửa hồ sơ</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Cập nhật ảnh đại diện, tên hiển thị, mật khẩu và thông tin công khai của bạn.
        </p>
      </div>

      <div
        className={
          isAuthor
            ? "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            : "grid grid-cols-1 gap-6 max-w-2xl"
        }
      >
        <div className={isAuthor ? "space-y-6 lg:col-span-5" : "space-y-6"}>
          <AccountSection user={user} onSaved={refreshUser} />
          <PasswordSection />
        </div>

        {isAuthor && (
          <div className="lg:col-span-7">
            <AuthorProfileSection authorProfile={authorProfile} isLoading={isLoadingAuthorProfile} />
          </div>
        )}
      </div>
    </div>
  );
}

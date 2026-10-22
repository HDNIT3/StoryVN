"use client";

import React, { useState } from "react";
import { Button, ImageUploader } from "@/components/ui";
import { useUpdateProfile, useUpdateAvatar } from "../queries/useUserQueries";

interface EditProfileModalProps {
  initialName: string;
  initialAvatarUrl?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditProfileModal({
  initialName,
  initialAvatarUrl,
  onClose,
  onSaved,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || "");
  const [error, setError] = useState("");

  const updateProfileMutation = useUpdateProfile();
  const updateAvatarMutation = useUpdateAvatar();

  const isSaving = updateProfileMutation.isPending || updateAvatarMutation.isPending;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (displayName.trim().length < 2 || displayName.trim().length > 50) {
      setError("Tên hiển thị phải từ 2 đến 50 ký tự");
      return;
    }

    try {
      if (displayName.trim() !== initialName) {
        await updateProfileMutation.mutateAsync({ displayName: displayName.trim() });
      }

      if (avatarUrl.trim() && avatarUrl.trim() !== initialAvatarUrl) {
        await updateAvatarMutation.mutateAsync({ avatarUrl: avatarUrl.trim() });
      }

      onSaved();
    } catch (err: unknown) {
      const msg =
        err instanceof Error && !err.message.includes("Failed to fetch")
          ? err.message
          : "Cập nhật thất bại, vui lòng thử lại";
      setError(msg);
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

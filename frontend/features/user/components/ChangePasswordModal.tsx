"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui";
import { useChangePassword } from "../queries/useUserQueries";

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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
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

interface ChangePasswordModalProps {
  onClose: () => void;
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
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
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error && !err.message.includes("Failed to fetch")
          ? err.message
          : "Đổi mật khẩu thất bại, vui lòng thử lại";
      setError(msg);
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
            label="Mật khẩu mới (tối thiểu 6 ký tự)"
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

          <div className="flex gap-3 pt-2">
            <Button
              id="btn-cp-cancel"
              type="button"
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={changePasswordMutation.isPending}
            >
              Huỷ
            </Button>
            <Button
              id="btn-cp-save"
              type="submit"
              variant="primary"
              fullWidth
              isLoading={changePasswordMutation.isPending}
            >
              Đổi mật khẩu
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

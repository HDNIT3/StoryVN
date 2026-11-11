"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthInput } from "../shared";

export interface RegisterFormProps {
  displayName: string;
  setDisplayName: (val: string) => void;
  username: string;
  setUsername: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  termsAccepted: boolean;
  setTermsAccepted: (val: boolean) => void;
  isLoading: boolean;
  handleRegisterSubmit: (e?: React.FormEvent) => void;
}

export function RegisterForm({
  displayName,
  setDisplayName,
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  termsAccepted,
  setTermsAccepted,
  isLoading,
  handleRegisterSubmit,
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form
      onSubmit={handleRegisterSubmit}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Display Name */}
        <AuthInput
          id="fullname"
          name="fullname"
          label="Họ và tên hoặc Biệt danh"
          placeholder="Ví dụ: Hoàng Long"
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          helperText="Tên thật hoặc bút danh hiển thị"
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />

        {/* Username */}
        <AuthInput
          id="username"
          name="username"
          label="Tên đăng nhập (Username)"
          placeholder="Ví dụ: hoanglong99"
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          helperText="Tối thiểu 3 ký tự (chữ, số, gạch dưới)"
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          }
        />
      </div>

      {/* Email */}
      <AuthInput
        id="email"
        name="email"
        label="Email"
        placeholder="example@gmail.com"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Password */}
        <AuthInput
          id="password"
          name="password"
          label="Mật khẩu"
          placeholder="Tối thiểu 6 ký tự"
          type={showPassword ? "text" : "password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText="Tối thiểu 6 ký tự bảo mật"
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="hover:text-zinc-600 focus:outline-none cursor-pointer"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? (
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
          }
        />

        {/* Confirm Password */}
        <AuthInput
          id="confirm_password"
          name="confirm_password"
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu"
          type={showConfirmPassword ? "text" : "password"}
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          helperText="Khớp với mật khẩu đã nhập"
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="hover:text-zinc-600 focus:outline-none cursor-pointer"
              aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showConfirmPassword ? (
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
          }
        />
      </div>

      {/* Terms checkbox */}
      <div className="pt-1">
        <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-zinc-600 leading-relaxed">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer shrink-0"
          />
          <span>
            Tôi đã đọc và đồng ý với{" "}
            <Link
              href="/dieu-khoan-dich-vu"
              target="_blank"
              className="text-sky-600 font-semibold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Điều khoản dịch vụ
            </Link>{" "}
            và{" "}
            <Link
              href="/chinh-sach-bao-mat"
              target="_blank"
              className="text-sky-600 font-semibold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Chính sách bảo mật
            </Link>
          </span>
        </label>
        {!termsAccepted && (
          <p className="mt-1 text-xs text-rose-500 font-medium">
            * Vui lòng tích chọn đồng ý với điều khoản để tiếp tục.
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-1">
        <button
          id="btn-register-submit"
          type="submit"
          disabled={isLoading || !termsAccepted}
          className="w-full py-3 px-4 bg-[#0ea5e9] hover:bg-[#0284c7] active:bg-[#0369a1] text-white font-bold text-sm rounded-xl shadow-sm hover:shadow active:scale-[0.99] transition-all duration-150 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Đang xử lý đăng ký...</span>
            </span>
          ) : (
            "Đăng Ký Tài Khoản"
          )}
        </button>
      </div>
    </form>
  );
}

export default RegisterForm;

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthInput } from "../shared";

export interface LoginFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  rememberMe,
  setRememberMe,
  isLoading,
  onSubmit,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AuthInput
        id="login-email"
        label="Email"
        placeholder="example@gmail.com"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
            />
          </svg>
        }
      />

      <AuthInput
        id="login-password"
        label="Mật khẩu"
        placeholder="••••••••"
        type={showPassword ? "text" : "password"}
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
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
        }
      />

      {/* Remember me + Quên mật khẩu */}
      <div className="flex items-center justify-between text-xs pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-600 hover:text-zinc-900 transition-colors">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer shrink-0"
          />
          <span className="leading-none">Ghi nhớ đăng nhập</span>
        </label>

        <Link
          href="/quen-mat-khau"
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer leading-none"
        >
          Quên mật khẩu?
        </Link>
      </div>

      <button
        id="btn-login-submit"
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-[#0ea5e9] hover:bg-[#0284c7] active:bg-[#0369a1] text-white font-bold text-sm rounded-xl shadow-sm hover:shadow active:scale-[0.99] transition-all duration-150 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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
            <span>Đang đăng nhập...</span>
          </span>
        ) : (
          "Đăng Nhập"
        )}
      </button>
    </form>
  );
}

export default LoginForm;

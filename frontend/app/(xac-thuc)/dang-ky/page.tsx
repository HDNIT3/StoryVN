"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, Button, OtpInput } from "@/components/ui";
import { useRegister } from "@/lib/hooks/useRegister";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
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
    step,
    otp,
    setOtp,
    countdown,
    canResend,
    isLoading,
    isResending,
    backendMessage,
    backendError,
    handleRegisterSubmit,
    handleVerifyOtp,
    handleResendOtp,
    handleBackToForm,
  } = useRegister();

  return (
    <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xl p-7 sm:p-9 space-y-6">
      {/* Step Indicator Header */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
            step === "form"
              ? "bg-orange-100 text-orange-700"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-current text-white flex items-center justify-center text-[10px] font-bold">
            1
          </span>
          <span>Thông tin</span>
        </div>
        <div className="w-6 h-0.5 bg-zinc-200" />
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
            step === "otp"
              ? "bg-orange-100 text-orange-700"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-current text-white flex items-center justify-center text-[10px] font-bold">
            2
          </span>
          <span>Xác thực OTP</span>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          {step === "form" ? "Đăng Ký Tài Khoản" : "Xác Thực Email"}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500">
          {step === "form"
            ? "Gia nhập cộng đồng độc giả StoryVN hoàn toàn miễn phí"
            : `Mã OTP đã được gửi đến email ${email}`}
        </p>
      </div>

      {/* Backend Success Notification */}
      {backendMessage && (
        <div className="p-3.5 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl flex items-start gap-2.5 animate-fadeIn">
          <svg
            className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium leading-relaxed">{backendMessage}</span>
        </div>
      )}

      {/* Backend Error Notification */}
      {backendError && (
        <div className="p-3.5 text-xs bg-red-50 text-red-700 border border-red-200/80 rounded-xl flex items-start gap-2.5 animate-fadeIn">
          <svg
            className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium leading-relaxed">{backendError}</span>
        </div>
      )}

      {/* STEP 1: Registration Form */}
      {step === "form" ? (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <Input
            label="Họ và tên hoặc Biệt danh"
            placeholder="Ví dụ: Hoàng Long"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            leftIcon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
          />

          <Input
            label="Tên đăng nhập (Username)"
            placeholder="Ví dụ: hoanglong99"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            helperText="Chỉ chứa chữ cái, số và gạch dưới (tối thiểu 3 ký tự)"
            leftIcon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            }
          />

          <Input
            label="Email"
            placeholder="example@gmail.com"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            }
          />

          <Input
            label="Mật khẩu"
            placeholder="Tối thiểu 6 ký tự"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
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
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
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

          <Input
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            type={showConfirmPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            }
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="hover:text-zinc-600 focus:outline-none cursor-pointer"
                title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showConfirmPassword ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
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

          {/* Terms checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-zinc-600">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded border-zinc-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
              />
              <span>
                Tôi đồng ý với{" "}
                <span className="text-orange-600 hover:underline">
                  Điều khoản sử dụng
                </span>{" "}
                và{" "}
                <span className="text-orange-600 hover:underline">
                  Chính sách bảo mật
                </span>
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            className="mt-2"
          >
            Đăng Ký Tài Khoản
          </Button>
        </form>
      ) : (
        /* STEP 2: OTP Verification Form */
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            <div className="text-center">
              <p className="text-xs text-zinc-500">
                Nhập mã 6 chữ số được gửi tới
              </p>
              <p className="text-sm font-semibold text-zinc-800 break-all">
                {email}
              </p>
            </div>

            {/* 6 Digit OTP input */}
            <div className="py-2">
              <OtpInput
                length={6}
                value={otp}
                onChange={setOtp}
                disabled={isLoading}
                hasError={Boolean(backendError)}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              disabled={otp.trim().length !== 6}
            >
              Xác Nhận & Hoàn Tất
            </Button>

            {/* Resend OTP button */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-zinc-500">Không nhận được mã?</span>
              {countdown > 0 ? (
                <span className="text-zinc-400 font-medium select-none">
                  Gửi lại sau{" "}
                  <span className="text-orange-600 font-semibold tabular-nums">
                    {countdown}s
                  </span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className="font-semibold text-orange-600 hover:text-orange-700 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {isResending ? "Đang gửi..." : "Gửi lại mã OTP"}
                </button>
              )}
            </div>

            {/* Change details / Back to Step 1 */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleBackToForm}
                disabled={isLoading}
                className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>←</span>
                <span>Thay đổi thông tin hoặc email</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Social login divider (only on Step 1) */}
      {step === "form" && (
        <>
          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-200 w-full" />
            <span className="bg-white px-3 text-xs text-zinc-400 select-none">
              hoặc
            </span>
            <div className="border-t border-zinc-200 w-full" />
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-blue-600 fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </button>
          </div>

          {/* Footer Switcher */}
          <div className="text-center text-xs text-zinc-500 pt-2">
            <span>Đã có tài khoản? </span>
            <Link
              href="/dang-nhap"
              className="font-semibold text-orange-600 hover:text-orange-700 underline-offset-2 hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

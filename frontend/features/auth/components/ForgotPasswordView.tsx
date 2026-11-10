"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { AuthBrandPanel, AuthHeader, AuthAlert, AuthFooterSwitcher, AuthInput } from "./shared";
import { useForgotPassword } from "../hooks/useForgotPassword";
import type { ForgotPasswordStep } from "../types";

export function ForgotPasswordView() {
  const {
    step,
    isLoading,
    error,
    email,
    setEmail,
    otp,
    setOtp,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showNewPass,
    setShowNewPass,
    showConfirmPass,
    setShowConfirmPass,
    handleSendEmail,
    handleResendOtp,
    handleVerifyOtp,
    handleResetPassword,
  } = useForgotPassword();

  const eyeIcon = (show: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      className="hover:text-zinc-600 focus:outline-none cursor-pointer"
      aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
    >
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

  return (
    <div className="h-screen max-h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-white">
      {/* 1. Left Column: Brand Celestial Showcase (Fixed height, independent) */}
      <div className="hidden lg:flex lg:w-1/2 h-full max-h-screen shrink-0 overflow-hidden">
        <AuthBrandPanel
          title="Khôi phục tài khoản StoryVN"
          subtitle="Lấy lại mật khẩu nhanh chóng và an toàn qua mã xác thực OTP."
        />
      </div>

      {/* 2. Right Column: Authentication Form Container (Independent scroll) */}
      <div className="w-full lg:w-1/2 h-full max-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto bg-white">
        {/* Top Navigation: Về trang chủ + Mobile Logo */}
        <div className="w-full max-w-md mx-auto flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-600 hover:text-sky-600 transition-colors duration-150 group px-2 py-1 rounded-lg hover:bg-zinc-100"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            <span>Về trang chủ</span>
          </Link>

          {/* Mobile Logo with Official StoryVN Icon */}
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-zinc-200 shadow-2xs">
              <Image
                src="/icon/iconweb.png"
                alt="StoryVN Icon"
                width={28}
                height={28}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-extrabold text-base text-zinc-900 tracking-tight">
              Story<span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent ml-0.5">VN</span>
            </span>
          </Link>
        </div>

        {/* Center Form Container */}
        <div className="w-full max-w-md mx-auto my-auto space-y-6">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 max-w-xs mx-auto mb-4">
            {(["email", "otp", "newpass"] as ForgotPasswordStep[]).map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step === s
                      ? "bg-sky-500 text-white shadow-2xs"
                      : ["email", "otp", "newpass"].indexOf(step) > i
                      ? "bg-emerald-500 text-white"
                      : "bg-zinc-100 text-zinc-400 border border-zinc-200"
                  }`}
                >
                  {["email", "otp", "newpass"].indexOf(step) > i ? "✓" : i + 1}
                </div>
                {i < 2 && (
                  <div
                    className={`flex-1 h-0.5 transition-colors ${
                      ["email", "otp", "newpass"].indexOf(step) > i ? "bg-emerald-400" : "bg-zinc-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Header */}
          <AuthHeader
            title={
              step === "email"
                ? "Quên Mật Khẩu"
                : step === "otp"
                ? "Nhập Mã OTP"
                : "Đặt Mật Khẩu Mới"
            }
            subtitle={
              step === "email"
                ? "Nhập email để nhận mã xác thực khôi phục mật khẩu"
                : step === "otp"
                ? `Nhập mã 6 số đã gửi đến ${email}`
                : "Tạo mật khẩu mới cho tài khoản của bạn"
            }
            align="center"
          />

          <AuthAlert error={error} />

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleSendEmail} className="space-y-4">
              <AuthInput
                id="forgot-email"
                label="Email"
                placeholder="example@gmail.com"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
              />
              <button
                id="btn-forgot-send-email"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#0ea5e9] hover:bg-[#0284c7] active:bg-[#0369a1] text-white font-bold text-sm rounded-xl shadow-sm hover:shadow active:scale-[0.99] transition-all duration-150 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? "Đang gửi..." : "Gửi Mã Xác Thực"}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <AuthInput
                id="forgot-otp"
                label="Mã OTP"
                placeholder="123456"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                }
              />
              <button
                id="btn-forgot-verify-otp"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#0ea5e9] hover:bg-[#0284c7] active:bg-[#0369a1] text-white font-bold text-sm rounded-xl shadow-sm hover:shadow active:scale-[0.99] transition-all duration-150 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? "Đang xác thực..." : "Xác Nhận Mã OTP"}
              </button>
              <div className="text-center text-xs text-zinc-500 pt-1">
                Không nhận được mã?{" "}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-sky-600 hover:text-sky-700 font-bold cursor-pointer disabled:opacity-60 hover:underline"
                >
                  Gửi lại
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === "newpass" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <AuthInput
                id="forgot-new-password"
                label="Mật khẩu mới"
                placeholder="••••••••"
                type={showNewPass ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
                rightIcon={eyeIcon(showNewPass, () => setShowNewPass(!showNewPass))}
              />
              <AuthInput
                id="forgot-confirm-password"
                label="Xác nhận mật khẩu mới"
                placeholder="••••••••"
                type={showConfirmPass ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
                rightIcon={eyeIcon(showConfirmPass, () => setShowConfirmPass(!showConfirmPass))}
              />
              <button
                id="btn-forgot-reset-password"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#0ea5e9] hover:bg-[#0284c7] active:bg-[#0369a1] text-white font-bold text-sm rounded-xl shadow-sm hover:shadow active:scale-[0.99] transition-all duration-150 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? "Đang xử lý..." : "Đặt Lại Mật Khẩu"}
              </button>
            </form>
          )}

          <AuthFooterSwitcher
            questionText="Nhớ mật khẩu rồi?"
            actionText="Đăng nhập"
            href="/dang-nhap"
          />
        </div>

        <div className="w-full h-4" />
      </div>
    </div>
  );
}

export default ForgotPasswordView;

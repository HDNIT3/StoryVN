"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useLogin } from "../hooks/useLogin";
import {
  AuthBrandPanel,
  AuthHeader,
  AuthAlert,
  SocialAuthButtons,
  AuthFooterSwitcher,
} from "./shared";
import { LoginForm } from "./forms/LoginForm";

function LoginContent() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const msgParam = searchParams.get("message");
  const emailParam = searchParams.get("email") || "";

  const {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    isLoading,
    backendError,
    handleSubmit,
  } = useLogin({ initialEmail: emailParam });

  const successBanner =
    registered === "true"
      ? msgParam || "Đăng ký tài khoản thành công! Vui lòng đăng nhập."
      : undefined;

  return (
    <div className="h-screen max-h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-white">
      {/* 1. Left Column: Brand Celestial Showcase (Hidden on Mobile, 50% on Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 h-full max-h-screen shrink-0 overflow-hidden">
        <AuthBrandPanel
          title="Đắm chìm trong thế giới tiểu thuyết bất tận"
          subtitle="Khám phá hàng ngàn bộ truyện kỳ ảo đặc sắc mỗi ngày."
        />
      </div>

      {/* 2. Right Column: Authentication Form Container */}
      <div className="w-full lg:w-1/2 h-full max-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto bg-white">
        {/* Top Navigation: Về trang chủ + Mobile Logo */}
        <div className="w-full max-w-md mx-auto flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-600 hover:text-sky-600 transition-colors duration-150 group px-3 py-1.5 rounded-lg hover:bg-zinc-100"
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

        {/* Form Center Box */}
        <div className="w-full max-w-md mx-auto my-auto space-y-6">
          {/* Header */}
          <AuthHeader
            title="Đăng Nhập"
            subtitle="Nhập thông tin tài khoản của bạn để tiếp tục"
            align="center"
          />

          {/* Feedback Banner */}
          <AuthAlert message={successBanner} error={backendError} />

          {/* Form */}
          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            rememberMe={rememberMe}
            setRememberMe={setRememberMe}
            isLoading={isLoading}
            onSubmit={handleSubmit}
          />

          {/* Social Auth */}
          <SocialAuthButtons />

          {/* Footer Switcher */}
          <AuthFooterSwitcher
            questionText="Chưa có tài khoản?"
            actionText="Đăng ký ngay"
            href="/dang-ky"
          />
        </div>

        {/* Bottom spacer for clean balance */}
        <div className="w-full h-4" />
      </div>
    </div>
  );
}

export function LoginView() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-white text-zinc-400 text-sm">
          Đang tải...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

export default LoginView;

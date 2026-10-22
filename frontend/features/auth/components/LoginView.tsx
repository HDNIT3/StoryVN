"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLogin } from "../hooks/useLogin";
import { AuthHeader, AuthAlert, SocialAuthButtons, AuthFooterSwitcher } from "./shared";
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
    <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs sm:shadow-sm p-6 sm:p-7 space-y-5">
      {/* 1. Header */}
      <AuthHeader
        title="Đăng Nhập"
        subtitle="Nhập thông tin tài khoản của bạn để tiếp tục"
      />

      {/* 2. Success / Error banner */}
      <AuthAlert message={successBanner} error={backendError} />

      {/* 3. Form */}
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

      {/* 4. Social Auth */}
      <SocialAuthButtons />

      {/* 5. Switch to register */}
      <AuthFooterSwitcher
        questionText="Chưa có tài khoản?"
        actionText="Đăng ký ngay"
        href="/dang-ky"
      />
    </div>
  );
}

export function LoginView() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xl p-6 sm:p-7 text-center text-zinc-400 text-sm">
          Đang tải...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

export default LoginView;

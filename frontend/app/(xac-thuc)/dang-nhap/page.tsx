"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  AuthHeader,
  AuthAlert,
  SocialAuthButtons,
  AuthFooterSwitcher,
} from "@/components/auth";
import { Input, Button } from "@/components/ui";
import { useLogin } from "@/lib/hooks/useLogin";

function LoginFormContainer() {
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
  } = useLogin();

  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const msgParam = searchParams.get("message");
  const emailParam = searchParams.get("email");

  const [showPassword, setShowPassword] = React.useState(false);
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (registered === "true") {
      const msg = msgParam || "Đăng ký tài khoản thành công! Vui lòng đăng nhập.";
      setSuccessBanner(msg);
      if (emailParam && !email) setEmail(emailParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registered]);

  return (
    <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xl p-7 sm:p-9 space-y-6">
      {/* 1. Header */}
      <AuthHeader
        title="Đăng Nhập"
        subtitle="Nhập thông tin tài khoản của bạn để tiếp tục"
      />

      {/* 2. Success / Error banner */}
      <AuthAlert message={successBanner || undefined} error={backendError} />

      {/* 3. Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
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

        <Input
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

        {/* Remember me + quên mật khẩu */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>

          <a
            href="/quen-mat-khau"
            className="text-sky-600 hover:text-sky-700 cursor-pointer font-medium"
          >
            Quên mật khẩu?
          </a>
        </div>

        <Button
          id="btn-login-submit"
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
          className="mt-2"
        >
          Đăng Nhập
        </Button>
      </form>

      {/* 4. Social */}
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xl p-7 sm:p-9 text-center text-zinc-400 text-sm">
          Đang tải...
        </div>
      }
    >
      <LoginFormContainer />
    </Suspense>
  );
}

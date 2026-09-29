"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AuthHeader,
  AuthAlert,
  LoginForm,
  SocialAuthButtons,
  AuthFooterSwitcher,
} from "@/components/auth";
import { toast } from "@/lib/toast";

function LoginFormContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    const registered = searchParams.get("registered");
    const emailParam = searchParams.get("email");
    const msgParam = searchParams.get("message");

    if (registered === "true") {
      const msg =
        msgParam || "Đăng ký tài khoản thành công! Vui lòng đăng nhập để tiếp tục.";
      setSuccessBanner(msg);
      toast.success(msg);
      if (emailParam) {
        setEmailOrUsername(emailParam);
      }
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push("/");
    }, 600);
  };

  return (
    <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xl p-7 sm:p-9 space-y-6">
      {/* 1. Header */}
      <AuthHeader
        title="Đăng Nhập"
        subtitle="Nhập thông tin tài khoản của bạn để tiếp tục"
      />

      {/* 2. Success Banner */}
      <AuthAlert message={successBanner || undefined} />

      {/* 3. Login Form */}
      <LoginForm
        emailOrUsername={emailOrUsername}
        setEmailOrUsername={setEmailOrUsername}
        password={password}
        setPassword={setPassword}
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
        isLoading={isLoading}
        onSubmit={handleSubmit}
      />

      {/* 4. Social Login */}
      <SocialAuthButtons />

      {/* 5. Footer Switcher */}
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

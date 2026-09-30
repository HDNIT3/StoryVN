"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/auth.service";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "@/lib/toast";

function getErrorMessage(err: any, fallback: string): string {
  const msg = err?.message;
  if (!msg || msg.includes("Failed to fetch")) {
    return "Website chưa hoạt động vui lòng chờ";
  }
  return msg || fallback;
}

export function useLogin() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backendError, setBackendError] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setBackendError("");

      const emailTrimmed = email.trim().toLowerCase();
      if (!emailTrimmed || !password) {
        const msg = "Vui lòng nhập email và mật khẩu";
        setBackendError(msg);
        toast.warning(msg);
        return;
      }

      setIsLoading(true);
      try {
        const res = await authService.login({
          email: emailTrimmed,
          password,
        });

        if (!res.success || !res.data) {
          throw new Error(res.message || "Đăng nhập thất bại");
        }

        const { accessToken, refreshToken } = res.data;

        // Lưu tokens + fetch profile vào context
        await login(accessToken, refreshToken);

        toast.success("Đăng nhập thành công!");

        // Điều hướng theo returnUrl hoặc về trang chủ
        const params = new URLSearchParams(window.location.search);
        const returnUrl = params.get("returnUrl") || "/";
        router.push(returnUrl);
        router.refresh();
      } catch (err: any) {
        const msg = getErrorMessage(err, "Email hoặc mật khẩu không chính xác!");
        setBackendError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, login, router]
  );

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    isLoading,
    backendError,
    handleSubmit,
  };
}

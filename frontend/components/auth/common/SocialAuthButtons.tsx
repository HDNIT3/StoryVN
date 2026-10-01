"use client";

import React, { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { authService } from "@/lib/services/auth.service";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

export function SocialAuthButtons() {
  const { login } = useAuth();
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      try {
        // Gửi access_token của Google lên backend
        const res = await authService.googleLogin({
          token: tokenResponse.access_token,
        });

        if (!res.success || !res.data) {
          throw new Error(res.message || "Đăng nhập Google thất bại");
        }

        const { accessToken, refreshToken } = res.data;
        await login(accessToken, refreshToken);

        toast.success("Đăng nhập bằng Google thành công!");

        const params = new URLSearchParams(window.location.search);
        const returnUrl = params.get("returnUrl") || "/";
        router.push(returnUrl);
        router.refresh();
      } catch (err: any) {
        const msg =
          err?.message && !err.message.includes("Failed to fetch")
            ? err.message
            : "Đăng nhập Google thất bại, vui lòng thử lại";
        toast.error(msg);
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => {
      toast.error("Đăng nhập Google bị huỷ hoặc thất bại");
    },
    flow: "implicit",
  });

  return (
    <div className="space-y-4 pt-1">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-zinc-400">Hoặc tiếp tục với</span>
        </div>
      </div>

      <button
        type="button"
        id="btn-google-login"
        onClick={() => handleGoogleLogin()}
        disabled={isGoogleLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-sm font-medium hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        {isGoogleLoading ? (
          <svg
            className="w-4 h-4 animate-spin text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
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
        )}
        <span>{isGoogleLoading ? "Đang đăng nhập..." : "Đăng nhập với Google"}</span>
      </button>
    </div>
  );
}

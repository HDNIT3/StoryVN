"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/lib/context/AuthContext";
import { ToastContainer } from "@/components/ui/Toast";
import { toast } from "@/lib/toast";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AuthLogoutListener />
        {children}
        <ToastContainer />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

// Lắng nghe event auth:logout khi 401 không refresh được
function AuthLogoutListener() {
  const router = useRouter();
  useEffect(() => {
    const handler = () => {
      toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
      router.push("/dang-nhap");
    };
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, [router]);
  return null;
}

"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider } from "@/lib/context/AuthContext";
import { ToastContainer } from "@/components/ui/Toast";
import { toast } from "@/lib/toast";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthLogoutListener />
      {children}
      <ToastContainer />
    </AuthProvider>
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

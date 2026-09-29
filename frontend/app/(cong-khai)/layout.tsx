import React from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/Footer";

export default function CongKhaiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50">
      {/* Header trạng thái chưa đăng nhập */}
      <Header isLoggedIn={false} />

      {/* Nội dung trang */}
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}

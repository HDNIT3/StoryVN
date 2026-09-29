"use client";

import React from "react";
import { SmartHeader } from "@/components/layout/header";
import { Footer } from "@/components/layout/Footer";

export default function CongKhaiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50">
      {/* Header tự động nhận biết trạng thái đăng nhập */}
      <SmartHeader />

      {/* Nội dung trang */}
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}

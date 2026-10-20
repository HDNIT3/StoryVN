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
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#F8FAFC]">
      {/* Header trong suốt — tự nhận biết trạng thái đăng nhập */}
      <SmartHeader />

      {/* Nội dung trang */}
      <main className="flex-1 w-full overflow-x-hidden">{children}</main>
      <Footer />
    </div>
  );
}

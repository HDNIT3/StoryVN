"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

interface AdminLayoutViewProps {
  children: React.ReactNode;
}

export function AdminLayoutView({ children }: AdminLayoutViewProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setRedirecting(true);
        router.replace(
          `/dang-nhap?returnUrl=${encodeURIComponent(window.location.pathname)}`
        );
      } else if (user && user.role !== "ADMIN" && user.role !== "MANAGER") {
        setRedirecting(true);
        router.replace("/ho-so");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-sm border border-slate-200/80 max-w-xs w-full text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700">
            {redirecting ? "Đang chuyển hướng..." : "Đang tải dữ liệu quản trị..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;
  if (user.role !== "ADMIN" && user.role !== "MANAGER") return null;

  return (
    <div className="min-h-screen admin-crm-bg flex text-slate-800 antialiased font-sans">
      {/* Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ${
          collapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <AdminHeader onMobileOpen={() => setMobileOpen(true)} />

        {/* Main page content */}
        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 w-full min-w-0 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

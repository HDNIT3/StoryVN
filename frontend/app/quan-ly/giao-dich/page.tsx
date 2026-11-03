import React from "react";
import type { Metadata } from "next";
import { AdminTransactionsView } from "@/features/admin";

export const metadata: Metadata = {
  title: "Quản lý Giao Dịch Nạp Xu | StoryVN Admin",
  description: "Đối soát và quản lý lịch sử giao dịch thanh toán gói Xu qua VNPay Sandbox",
};

export default function QuanLyGiaoDichPage() {
  return <AdminTransactionsView />;
}


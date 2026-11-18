import type { Metadata } from "next";
import { AdminSupportView } from "@/features/support/components/AdminSupportView";

export const metadata: Metadata = {
  title: "Tiếp Nhận & Phản Hồi Hỗ Trợ | Quản Trị StoryVN",
};

export default function AdminSupportPage() {
  return <AdminSupportView />;
}

import type { Metadata } from "next";
import { AdminReportsView } from "@/features/admin/components/reports/AdminReportsView";

export const metadata: Metadata = {
  title: "Quản Lý Báo Cáo Vi Phạm | StoryVN Admin",
};

export default function AdminBaoCaoPage() {
  return <AdminReportsView />;
}

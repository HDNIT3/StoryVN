import { AdminDashboardView } from "@/features/admin";

export const metadata = {
  title: "Tổng quan Quản trị | StoryVN Admin",
  description: "Bảng điều khiển tổng quan, thống kê biểu đồ doanh thu, độc giả và kiểm duyệt nội dung StoryVN",
};

export default function QuanLyIndexPage() {
  return <AdminDashboardView />;
}

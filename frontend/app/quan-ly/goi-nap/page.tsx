import { AdminCoinPackagesView } from "@/features/admin/components/coin-packages/AdminCoinPackagesView";

export const metadata = {
  title: "Quản lý gói nạp Xu | StoryVN Admin",
  description: "Trang cấu hình và quản lý các gói nạp Xu StoryVN",
};

export default function QuanLyGoiNapPage() {
  return <AdminCoinPackagesView />;
}

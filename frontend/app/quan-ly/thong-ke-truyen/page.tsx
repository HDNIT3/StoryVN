import { AdminContentStatisticsView } from "@/features/admin/components/dashboard/AdminContentStatisticsView";

export const metadata = {
  title: "Truyện & tác giả | StoryVN Admin",
  description: "Thống kê truyện, chương và tác giả theo thời gian",
};

export default function ContentStatisticsPage() {
  return <AdminContentStatisticsView />;
}

import { Metadata } from "next";
import { AuthorRevenueView } from "@/features/author";

export const metadata: Metadata = {
  title: "Doanh thu & Xu tác giả - StoryVN",
  description:
    "Theo dõi lịch sử nhận Xu, độc giả mở khóa chương và phân bổ doanh thu theo từng tác phẩm của tác giả trên StoryVN.",
};

export default function TacGiaDoanhThuPage() {
  return <AuthorRevenueView />;
}


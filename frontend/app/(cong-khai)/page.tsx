import type { Metadata } from "next";
import { HomeView } from "@/features/home";

export const metadata: Metadata = {
  title: "StoryVN - Thế giới truyện chữ & tiểu thuyết online",
  description: "Đọc truyện online hàng đầu với hàng ngàn tác phẩm cập nhật liên tục.",
};

export default function HomePage() {
  return <HomeView />;
}

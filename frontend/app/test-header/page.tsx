import { Metadata } from "next";
import { HeaderTestPage } from "@/components/test/HeaderTestPage";

export const metadata: Metadata = {
  title: "Test Header Component — StoryVN",
  description: "Trang kiểm thử component Header với khả năng tinh chỉnh thông số thời gian thực và kiểm tra các subcomponent độc lập",
};

export default function TestHeaderRoute() {
  return <HeaderTestPage />;
}

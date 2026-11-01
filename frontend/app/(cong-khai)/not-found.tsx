import type { Metadata } from "next";
import { NotFoundView } from "@/components/layout/NotFoundView";

export const metadata: Metadata = {
  title: "Không tìm thấy trang | StoryVN",
  robots: { index: false, follow: false },
};

export default function CongKhaiNotFound() {
  return <NotFoundView />;
}

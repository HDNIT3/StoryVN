import type { Metadata } from "next";
import { ReadingHistoryView } from "@/features/reading-history";

export const metadata: Metadata = {
  title: "Lịch sử đọc truyện | StoryVN",
  description: "Theo dõi tiến độ và lịch sử đọc truyện của bạn tại StoryVN.",
};

export default function LichSuDocPage() {
  return <ReadingHistoryView />;
}

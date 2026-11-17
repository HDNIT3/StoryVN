import type { Metadata } from "next";
import { AdminForumView } from "@/features/forum/components/AdminForumView";

export const metadata: Metadata = { title: "Quản lý diễn đàn | StoryVN" };

export default function QuanLyDienDanPage() {
  return <AdminForumView />;
}

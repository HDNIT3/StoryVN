import type { Metadata } from "next";
import { ForumView } from "@/features/forum/components/ForumView";

export const metadata: Metadata = { title: "Diễn đàn | StoryVN" };

export default function DienDanPage() {
  return <ForumView />;
}

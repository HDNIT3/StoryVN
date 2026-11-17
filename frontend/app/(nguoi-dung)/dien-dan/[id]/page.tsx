import type { Metadata } from "next";
import { ForumDetailView } from "@/features/forum/components/ForumDetailView";

export const metadata: Metadata = {
  title: "Chi tiết bài viết | Diễn đàn StoryVN",
};

export default async function ForumPostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ForumDetailView id={id} />;
}

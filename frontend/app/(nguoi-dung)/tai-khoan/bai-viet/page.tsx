import type { Metadata } from "next";
import { MyForumPostsView } from "@/features/forum/components/MyForumPostsView";

export const metadata: Metadata = { title: "Bài viết của tôi | StoryVN" };

export default function BaiVietPage() {
  return <MyForumPostsView />;
}

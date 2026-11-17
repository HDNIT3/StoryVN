import type { Metadata } from "next";
import { ForumPostEditView } from "@/features/forum/components/ForumPostEditView";

export const metadata: Metadata = { title: "Chỉnh sửa bài viết | StoryVN" };
export default async function ChinhSuaBaiVietPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <ForumPostEditView id={id} />; }

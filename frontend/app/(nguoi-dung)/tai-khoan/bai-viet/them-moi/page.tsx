import type { Metadata } from "next";
import { ForumPostForm } from "@/features/forum/components/ForumPostForm";

export const metadata: Metadata = { title: "Tạo bài viết | StoryVN" };
export default function ThemMoiBaiVietPage() { return <ForumPostForm />; }

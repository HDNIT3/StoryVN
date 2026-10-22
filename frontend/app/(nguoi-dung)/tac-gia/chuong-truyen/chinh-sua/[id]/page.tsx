import { use } from "react";
import { AuthorEditChapterView } from "@/features/author";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ChinhSuaChuongPage({ params }: PageProps) {
  const resolvedParams = use(params);
  return <AuthorEditChapterView chapterId={resolvedParams.id} />;
}

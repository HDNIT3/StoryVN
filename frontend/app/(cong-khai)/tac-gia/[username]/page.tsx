import { use } from "react";
import { PublicAuthorDetailView } from "@/features/author";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function AuthorDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  return <PublicAuthorDetailView username={resolvedParams.username} />;
}
